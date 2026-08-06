export interface FillForGrouping {
  id: number;
  buySell: "BUY" | "SELL";
  quantity: number;
  price: number;
  multiplier: number;
  commission: number;
  datetime: string; // ISO, must sort chronologically
  assetCategory: string;
}

export interface GroupedTrade {
  fillIds: number[];
  assetCategory: string;
  direction: "long" | "short";
  openTime: string;
  closeTime: string | null;
  status: "open" | "closed";
  quantity: number;
  avgEntryPrice: number;
  avgExitPrice: number | null;
  multiplier: number;
  grossPnl: number | null;
  commissions: number;
  netPnl: number | null;
  holdingSeconds: number | null;
}

interface OpenGroup {
  fillIds: number[];
  assetCategory: string;
  direction: "long" | "short";
  openTime: string;
  multiplier: number;
  entryQty: number;
  entrySum: number;
  exitQty: number;
  exitSum: number;
  commissions: number;
}

function finalizeGroup(g: OpenGroup, closeTime: string | null): GroupedTrade {
  const directionSign = g.direction === "long" ? 1 : -1;
  const avgEntryPrice = g.entrySum / g.entryQty;
  const avgExitPrice = g.exitQty > 0 ? g.exitSum / g.exitQty : null;
  const status: "open" | "closed" = g.exitQty >= g.entryQty - 1e-9 && g.exitQty > 0 ? "closed" : "open";

  const grossPnl =
    status === "closed" && avgExitPrice !== null
      ? (avgExitPrice - avgEntryPrice) * directionSign * g.exitQty * g.multiplier
      : null;
  const netPnl = grossPnl !== null ? grossPnl - g.commissions : null;

  const holdingSeconds =
    status === "closed" && closeTime
      ? Math.round((Date.parse(closeTime) - Date.parse(g.openTime)) / 1000)
      : null;

  return {
    fillIds: g.fillIds,
    assetCategory: g.assetCategory,
    direction: g.direction,
    openTime: g.openTime,
    closeTime: status === "closed" ? closeTime : null,
    status,
    quantity: g.entryQty,
    avgEntryPrice,
    avgExitPrice,
    multiplier: g.multiplier,
    grossPnl,
    commissions: g.commissions,
    netPnl,
    holdingSeconds,
  };
}

/**
 * Groups a list of fills for a single (account, symbol) into round-trip
 * trades based on running signed position: a trade starts when position
 * moves away from flat and ends when it returns to flat. Partial closes
 * stay in the same trade. A single execution that crosses through zero
 * (a reversal) is split proportionally into a close-of-remainder (finalizes
 * the old trade) and an open-of-new (starts the next trade) at the same
 * price/time.
 *
 * Pure function: no I/O, deterministic, safe to re-run on the same input.
 * Fill order does not need to be pre-sorted; this function sorts by datetime.
 */
export function groupFills(fills: FillForGrouping[]): GroupedTrade[] {
  const sorted = [...fills].sort((a, b) => Date.parse(a.datetime) - Date.parse(b.datetime));

  const result: { group: OpenGroup; closeTime: string | null }[] = [];
  let position = 0;
  let current: OpenGroup | null = null;

  for (const fill of sorted) {
    const fillSign = fill.buySell === "BUY" ? 1 : -1;
    let remainingQty = fill.quantity;
    const commissionPerUnit = fill.commission / fill.quantity;

    while (remainingQty > 1e-9) {
      if (position === 0) {
        current = {
          fillIds: [],
          assetCategory: fill.assetCategory,
          direction: fillSign > 0 ? "long" : "short",
          openTime: fill.datetime,
          multiplier: fill.multiplier,
          entryQty: 0,
          entrySum: 0,
          exitQty: 0,
          exitSum: 0,
          commissions: 0,
        };
      }
      const group = current!;
      const posSign = position === 0 ? fillSign : Math.sign(position);
      const sameDirection = fillSign === posSign;

      if (sameDirection) {
        // Opens or adds to the position — consumes the whole remainder,
        // since adding to a position never crosses zero.
        const take = remainingQty;
        group.entryQty += take;
        group.entrySum += take * fill.price;
        group.commissions += take * commissionPerUnit;
        if (!group.fillIds.includes(fill.id)) group.fillIds.push(fill.id);
        position += fillSign * take;
        remainingQty -= take;
      } else {
        // Closes some or all of the position.
        const closeAmount = Math.min(remainingQty, Math.abs(position));
        group.exitQty += closeAmount;
        group.exitSum += closeAmount * fill.price;
        group.commissions += closeAmount * commissionPerUnit;
        if (!group.fillIds.includes(fill.id)) group.fillIds.push(fill.id);
        position += fillSign * closeAmount;
        remainingQty -= closeAmount;

        if (Math.abs(position) < 1e-9) {
          position = 0;
          result.push({ group: current!, closeTime: fill.datetime });
          current = null;
          // If quantity remains, the loop continues and opens a new group
          // for the reversal below (position === 0 again).
        }
      }
    }
  }

  if (current) result.push({ group: current, closeTime: null });

  return result.map(({ group, closeTime }) => finalizeGroup(group, closeTime));
}

/**
 * For each fill id, determines which trade (by index into the groupFills()
 * result) should own the DB `trade_group_id` link. A fill only appears in
 * more than one group when it's a reversal execution; in that case the link
 * goes to the later (newly opened) trade since that's the one still relevant
 * going forward — the earlier trade's aggregates already account for its
 * contribution regardless of the link.
 */
export function resolvePrimaryTradeIndexForFill(groups: GroupedTrade[]): Map<number, number> {
  const primary = new Map<number, number>();
  groups.forEach((group, index) => {
    for (const fillId of group.fillIds) {
      primary.set(fillId, index);
    }
  });
  return primary;
}
