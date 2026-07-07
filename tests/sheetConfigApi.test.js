import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { SHEET_ID } from "../src/config.js";
import {
  fetchRemoteSheetId,
  saveRemoteSheetId,
  resolveActiveSheetId,
} from "../src/sheetConfigApi.js";

const NEW_ID = "1HE4V8twdmGLUUCFWrQEnNmzWchCf61vzqSuq891XTDc";
const originalFetch = globalThis.fetch;

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
  globalThis.fetch = originalFetch;
  globalThis.localStorage = originalLocalStorage;
});

describe("sheetConfigApi", () => {
  it("fetchRemoteSheetId returns server sheet id", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ sheetId: NEW_ID }), { status: 200 });

    assert.equal(await fetchRemoteSheetId(), NEW_ID);
  });

  it("saveRemoteSheetId sends pin and sheet id to server", async () => {
    /** @type {RequestInit | undefined} */
    let capturedInit;
    globalThis.fetch = async (_url, init) => {
      capturedInit = init;
      return new Response(JSON.stringify({ sheetId: NEW_ID }), { status: 200 });
    };

    const saved = await saveRemoteSheetId(NEW_ID, "2406");
    assert.equal(saved, NEW_ID);
    assert.equal(capturedInit?.method, "PUT");
    assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
      sheetId: NEW_ID,
      pin: "2406",
    });
  });

  it("resolveActiveSheetId prefers remote value over local fallback", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ sheetId: NEW_ID }), { status: 200 });

    assert.equal(await resolveActiveSheetId(), NEW_ID);
    assert.notEqual(await resolveActiveSheetId(), SHEET_ID);
  });
});
