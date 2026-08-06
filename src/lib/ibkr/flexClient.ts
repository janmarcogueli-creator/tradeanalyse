const SEND_REQUEST_URL =
  "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/SendRequest";
const DEFAULT_GET_STATEMENT_URL =
  "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/GetStatement";

// Error codes meaning "not ready yet, retry" per IBKR Flex Web Service v3 docs.
const RETRYABLE_ERROR_CODES = new Set([
  "1001",
  "1004",
  "1005",
  "1006",
  "1007",
  "1008",
  "1009",
  "1018",
  "1019",
]);

export class FlexApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean,
  ) {
    super(message);
    this.name = "FlexApiError";
  }
}

interface FlexStatementResponseXml {
  status: "Success" | "Fail";
  referenceCode?: string;
  url?: string;
  errorCode?: string;
  errorMessage?: string;
}

function parseFlexStatementResponse(xml: string): FlexStatementResponseXml | null {
  if (!xml.includes("<FlexStatementResponse")) return null;

  const status = /<Status>(.*?)<\/Status>/.exec(xml)?.[1];
  const referenceCode = /<ReferenceCode>(.*?)<\/ReferenceCode>/.exec(xml)?.[1];
  const url = /<Url>(.*?)<\/Url>/.exec(xml)?.[1];
  const errorCode = /<ErrorCode>(.*?)<\/ErrorCode>/.exec(xml)?.[1];
  const errorMessage = /<ErrorMessage>(.*?)<\/ErrorMessage>/.exec(xml)?.[1];

  return {
    status: status === "Success" ? "Success" : "Fail",
    referenceCode,
    url,
    errorCode,
    errorMessage,
  };
}

async function sendRequest(
  token: string,
  queryId: string,
): Promise<{ referenceCode: string; statementUrl: string }> {
  const res = await fetch(
    `${SEND_REQUEST_URL}?t=${encodeURIComponent(token)}&q=${encodeURIComponent(queryId)}&v=3`,
  );
  const xml = await res.text();
  const parsed = parseFlexStatementResponse(xml);

  if (!parsed || parsed.status !== "Success" || !parsed.referenceCode) {
    throw new FlexApiError(
      parsed?.errorMessage ?? "SendRequest failed with unexpected response",
      parsed?.errorCode ?? "UNKNOWN",
      parsed ? RETRYABLE_ERROR_CODES.has(parsed.errorCode ?? "") : false,
    );
  }

  return {
    referenceCode: parsed.referenceCode,
    statementUrl: parsed.url ?? DEFAULT_GET_STATEMENT_URL,
  };
}

/**
 * Fetches the statement. Returns the raw FlexQueryResponse XML on success.
 * Throws FlexApiError (retryable=true) while the statement is still generating.
 */
async function getStatement(
  token: string,
  referenceCode: string,
  statementUrl: string,
): Promise<string> {
  const res = await fetch(
    `${statementUrl}?t=${encodeURIComponent(token)}&q=${encodeURIComponent(referenceCode)}&v=3`,
  );
  const xml = await res.text();
  const parsed = parseFlexStatementResponse(xml);

  if (parsed) {
    // Root was <FlexStatementResponse> -> pending or failed, not the actual statement.
    throw new FlexApiError(
      parsed.errorMessage ?? "GetStatement failed",
      parsed.errorCode ?? "UNKNOWN",
      RETRYABLE_ERROR_CODES.has(parsed.errorCode ?? ""),
    );
  }

  return xml;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FlexRequestOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Orchestrates the two-step Flex Web Service flow: SendRequest, then poll
 * GetStatement with backoff until the statement is ready. Returns raw XML.
 */
export async function requestFlexStatement(
  token: string,
  queryId: string,
  options: FlexRequestOptions = {},
): Promise<string> {
  const { maxRetries = 10, retryDelayMs = 3000 } = options;

  const { referenceCode, statementUrl } = await sendRequest(token, queryId);
  let currentUrl = statementUrl;
  let triedFallbackUrl = false;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await sleep(retryDelayMs);
    try {
      return await getStatement(token, referenceCode, currentUrl);
    } catch (err) {
      if (err instanceof FlexApiError && err.retryable) {
        lastError = err;
        continue;
      }
      // A raw network failure (DNS, connection reset, ...) on the server-provided
      // Url — not an IBKR-level FlexApiError — is worth one retry against the
      // known-good default host before giving up, since it can be transient.
      const isNetworkError = !(err instanceof FlexApiError);
      if (isNetworkError && !triedFallbackUrl && currentUrl !== DEFAULT_GET_STATEMENT_URL) {
        triedFallbackUrl = true;
        currentUrl = DEFAULT_GET_STATEMENT_URL;
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new FlexApiError("GetStatement timed out", "TIMEOUT", false);
}
