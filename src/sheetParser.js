/** @typedef {{ v?: number | string, f?: string }} GvizCell */
/** @typedef {{ c?: (GvizCell | null)[] }} GvizRow */
/** @typedef {{ rows?: GvizRow[] }} GvizTable */

/**
 * @param {string} text
 */
export function extractGvizJson(text) {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\)\s*;?\s*$/);
  if (!match) {
    throw new Error("Invalid gviz response: missing setResponse wrapper");
  }
  return JSON.parse(match[1]);
}

/**
 * @param {GvizCell | null | undefined} cell
 */
export function normalizePercent(cell) {
  if (!cell) return NaN;

  if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
    const scaled = cell.v <= 1 ? cell.v * 100 : cell.v;
    return Math.round(scaled * 100) / 100;
  }

  const raw = cell.f ?? cell.v ?? "";
  const cleaned = String(raw).replace("%", "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

/**
 * @param {string} s
 */
export function parseDateVN(s) {
  const m = String(s).trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

/**
 * @param {string} dateText
 */
export function formatPctValue(value) {
  return Number(value).toFixed(2) + "%";
}

/**
 * @param {GvizTable} table
 */
export function parseGvizRows(table) {
  const rows = table.rows ?? [];
  const result = [];

  for (const row of rows) {
    const cells = row.c ?? [];
    const dateCell = cells[0];
    const dateText = dateCell?.f ?? dateCell?.v;
    if (!dateText || String(dateText).trim() === "Row Labels") continue;

    const dateObj = parseDateVN(String(dateText));
    if (!dateObj) continue;

    const ma10 = normalizePercent(cells[1]);
    const ma20 = normalizePercent(cells[2]);
    const ma50 = normalizePercent(cells[3]);
    const ma200 = normalizePercent(cells[4]);

    if ([ma10, ma20, ma50, ma200].some(Number.isNaN)) continue;

    result.push({
      dateText: String(dateText).trim(),
      dateObj,
      ma10,
      ma20,
      ma50,
      ma200,
    });
  }

  return result.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
}

/**
 * @param {string} text
 */
export function parseGvizResponse(text) {
  const payload = extractGvizJson(text);
  return parseGvizRows(payload.table ?? {});
}

/**
 * @param {ReturnType<typeof parseGvizRows>} data
 */
export function toDisplayRows(data) {
  return data.map((d) => [
    d.dateText,
    formatPctValue(d.ma10),
    formatPctValue(d.ma20),
    formatPctValue(d.ma50),
    formatPctValue(d.ma200),
  ]);
}

/**
 * @param {ReturnType<typeof parseGvizRows>} data
 */
export function serializeDataHash(data) {
  return JSON.stringify(
    data.map((d) => [d.dateText, d.ma10, d.ma20, d.ma50, d.ma200])
  );
}
