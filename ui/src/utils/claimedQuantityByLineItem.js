/**
 * Sums quantity_claimed per receipt line item across all claim rows.
 *
 * @param {Array<{ receipt_line_item_id?: unknown, quantity_claimed?: unknown }> | null | undefined} receiptClaims
 * @returns {Map<string, number>}
 */
export function claimedQuantityByLineItem(receiptClaims) {
  const map = new Map();
  if (!Array.isArray(receiptClaims)) {
    return map;
  }
  for (const c of receiptClaims) {
    if (c == null || typeof c !== "object") {
      continue;
    }
    const lid = c.receipt_line_item_id;
    const q = Number(c.quantity_claimed);
    if (!lid || !Number.isFinite(q) || q <= 0) {
      continue;
    }
    map.set(lid, (map.get(lid) ?? 0) + q);
  }
  return map;
}
