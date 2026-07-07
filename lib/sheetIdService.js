export const SHEET_ID_STORAGE_KEY = "cnf:active_sheet_id";

/**
 * @param {unknown} id
 */
export function isValidSheetId(id) {
  return typeof id === "string" && /^[a-zA-Z0-9-_]{20,}$/.test(id);
}

/**
 * @param {{ get: (key: string) => Promise<unknown>, set: (key: string, value: string) => Promise<void> }} store
 * @param {string} defaultId
 */
export async function readStoredSheetId(store, defaultId) {
  const stored = await store.get(SHEET_ID_STORAGE_KEY);
  return isValidSheetId(stored) ? stored : defaultId;
}

/**
 * @param {{ set: (key: string, value: string) => Promise<void> }} store
 * @param {{ pin?: string, sheetId?: string }} payload
 * @param {string} accessPin
 */
export async function writeStoredSheetId(store, payload, accessPin) {
  const pin = String(payload.pin ?? "").trim();
  const sheetId = payload.sheetId;

  if (pin !== accessPin) {
    const err = new Error("Mã PIN không đúng");
    err.status = 401;
    throw err;
  }

  if (!isValidSheetId(sheetId)) {
    const err = new Error("Sheet ID không hợp lệ");
    err.status = 400;
    throw err;
  }

  await store.set(SHEET_ID_STORAGE_KEY, sheetId);
  return sheetId;
}
