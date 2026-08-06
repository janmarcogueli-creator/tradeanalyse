import { processImportBatch, type ImportSummary } from "./importFlexStatement";

/** Manual upload fallback: same parse→map→dedupe→group pipeline as the Flex
 * Web Service import, just fed with an already-downloaded Flex XML file
 * (e.g. exported by hand from IBKR Client Portal). */
export async function importManualFile(xml: string): Promise<ImportSummary> {
  return processImportBatch(xml);
}
