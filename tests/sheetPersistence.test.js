import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  SHEET_ID,
  SHEET_ID_STORAGE_KEY,
  getActiveSheetId,
  setActiveSheetId,
  getActiveSheetUrl,
} from "../src/config.js";

/** @type {Map<string, string>} */
const storage = new Map();

const originalLocalStorage = globalThis.localStorage;

beforeEach(() => {
  storage.clear();
  globalThis.localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => {
      storage.set(key, String(value));
    },
    removeItem: (key) => {
      storage.delete(key);
    },
  };
});

afterEach(() => {
  globalThis.localStorage = originalLocalStorage;
});

describe("sheet id persistence", () => {
  it("returns default SHEET_ID when nothing is stored", () => {
    assert.equal(getActiveSheetId(), SHEET_ID);
  });

  it("persists sheet id across simulated page reload", () => {
    const newId = "1HE4V8twdmGLUUCFWrQEnNmzWchCf61vzqSuq891XTDc";
    setActiveSheetId(newId);

    assert.equal(storage.get(SHEET_ID_STORAGE_KEY), newId);
    assert.equal(getActiveSheetId(), newId);
  });

  it("builds active sheet URL from persisted id", () => {
    const newId = "1HE4V8twdmGLUUCFWrQEnNmzWchCf61vzqSuq891XTDc";
    setActiveSheetId(newId);

    assert.equal(
      getActiveSheetUrl(),
      `https://docs.google.com/spreadsheets/d/${newId}/edit`
    );
  });
});
