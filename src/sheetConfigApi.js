import { SHEET_ID, SHEET_ID_STORAGE_KEY } from "./config.js";

const API_PATH = "/api/sheet-id";

/**
 * @returns {Promise<string>}
 */
export async function fetchRemoteSheetId() {
  const response = await fetch(API_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Không thể tải cấu hình sheet (${response.status})`);
  }
  const data = await response.json();
  if (!data?.sheetId) {
    throw new Error("Phản hồi API không hợp lệ");
  }
  return data.sheetId;
}

/**
 * @param {string} sheetId
 * @param {string} pin
 * @returns {Promise<string>}
 */
export async function saveRemoteSheetId(sheetId, pin) {
  const response = await fetch(API_PATH, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sheetId, pin }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Không thể lưu cấu hình sheet (${response.status})`);
  }
  return data.sheetId;
}

function readLocalFallbackSheetId() {
  try {
    const stored = localStorage.getItem(SHEET_ID_STORAGE_KEY);
    if (stored && /^[a-zA-Z0-9-_]{20,}$/.test(stored)) {
      return stored;
    }
  } catch {
    // Storage may be unavailable.
  }
  return SHEET_ID;
}

/**
 * @param {string} sheetId
 */
function writeLocalFallbackSheetId(sheetId) {
  try {
    localStorage.setItem(SHEET_ID_STORAGE_KEY, sheetId);
  } catch {
    // Storage may be unavailable.
  }
}

/**
 * @returns {Promise<string>}
 */
export async function resolveActiveSheetId() {
  try {
    return await fetchRemoteSheetId();
  } catch {
    return readLocalFallbackSheetId();
  }
}

/**
 * @param {string} sheetId
 * @param {string} pin
 * @returns {Promise<string>}
 */
export async function persistActiveSheetId(sheetId, pin) {
  try {
    return await saveRemoteSheetId(sheetId, pin);
  } catch (err) {
    if (err instanceof TypeError) {
      writeLocalFallbackSheetId(sheetId);
      return sheetId;
    }
    throw err;
  }
}

/**
 * @param {string} currentId
 * @returns {Promise<string>}
 */
export async function syncRemoteSheetId(currentId) {
  try {
    const remoteId = await fetchRemoteSheetId();
    return remoteId !== currentId ? remoteId : currentId;
  } catch {
    return currentId;
  }
}
