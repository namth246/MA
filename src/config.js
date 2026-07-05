export const SHEET_ID = "18R5rYR6vZSkVND_7XH7WLdkUvdDiN34bLuAdb9SzaC0";
export const SHEET_NAME = "Dem MA";
export const POLL_MS = 1_000;
export const GVIZ_QUERY = "select A,C,M,W,AG";

export const SERIES_COLORS = {
  "C>MA10": "#39FF88",
  "C>MA20": "#FF8A00",
  "C>MA50": "#FFD700",
  "C>MA200": "#1E90FF",
};

export function buildGvizUrl() {
  const params = new URLSearchParams({
    tqx: "out:json",
    sheet: SHEET_NAME,
    headers: "1",
    tq: GVIZ_QUERY,
    t: String(Date.now()),
  });
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`;
}
