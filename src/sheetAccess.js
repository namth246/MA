import { SHEET_ACCESS_PIN } from "./config.js";

/**
 * @param {string} pin
 */
export function isValidPinFormat(pin) {
  return /^\d{4}$/.test(String(pin).trim());
}

/**
 * @param {string} pin
 */
export function verifySheetPin(pin) {
  const normalized = String(pin).trim();
  if (!isValidPinFormat(normalized)) {
    throw new Error("Mã PIN phải gồm đúng 4 chữ số");
  }
  if (normalized !== SHEET_ACCESS_PIN) {
    throw new Error("Mã PIN không đúng");
  }
  return true;
}

export const SHEET_UNLOCK_STORAGE_KEY = "cnf_sheet_source_unlocked";

export function isSheetSourceUnlocked() {
  return sessionStorage.getItem(SHEET_UNLOCK_STORAGE_KEY) === "1";
}

export function setSheetSourceUnlocked(unlocked) {
  if (unlocked) {
    sessionStorage.setItem(SHEET_UNLOCK_STORAGE_KEY, "1");
    return;
  }
  sessionStorage.removeItem(SHEET_UNLOCK_STORAGE_KEY);
}

/** @type {string | null} */
let sessionPin = null;

/**
 * @param {string} pin
 */
export function setSessionPin(pin) {
  sessionPin = pin;
}

export function clearSessionPin() {
  sessionPin = null;
}

export function getSessionPin() {
  return sessionPin;
}
