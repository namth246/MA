export const SHEET_ID = "18R5rYR6vZSkVND_7XH7WLdkUvdDiN34bLuAdb9SzaC0";
export const SHEET_NAME = "Dem MA";
export const POLL_MS = 10_000;
export const GVIZ_QUERY = "select A,C,M,W,AG";
/** 4-digit PIN to view or change the sheet source URL. */
export const SHEET_ACCESS_PIN = "2406";
/** When false, block common DevTools shortcuts and context menu. */
export const ALLOW_DEVTOOLS = false;

export const SERIES_COLORS = {
  "C>MA10": "#39FF88",
  "C>MA20": "#FF8A00",
  "C>MA50": "#FFD700",
  "C>MA200": "#1E90FF",
};

export const SHEET_ID_STORAGE_KEY = "cnf_sheet_id";

export function getActiveSheetId() {
  try {
    const stored = localStorage.getItem(SHEET_ID_STORAGE_KEY);
    if (stored && /^[a-zA-Z0-9-_]{20,}$/.test(stored)) {
      return stored;
    }
  } catch {
    // Storage may be unavailable in some environments.
  }
  return SHEET_ID;
}

/**
 * @param {string} sheetId
 */
export function setActiveSheetId(sheetId) {
  localStorage.setItem(SHEET_ID_STORAGE_KEY, sheetId);
}

export function getDefaultSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
}

export function getActiveSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${getActiveSheetId()}/edit`;
}

/**
 * @param {string} input
 */
export function parseSheetUrl(input) {
  const trimmed = String(input).trim();
  if (!trimmed) {
    throw new Error("Link sheet không được để trống");
  }

  const fromPath = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (fromPath) return fromPath[1];

  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;

  throw new Error("Link Google Sheet không hợp lệ");
}

/**
 * @param {string} [sheetId]
 */
export function buildGvizUrl(sheetId = SHEET_ID) {
  const params = new URLSearchParams({
    tqx: "out:json",
    sheet: SHEET_NAME,
    headers: "1",
    tq: GVIZ_QUERY,
    t: String(Date.now()),
  });
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${params}`;
}
