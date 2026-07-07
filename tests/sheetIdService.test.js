import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidSheetId,
  readStoredSheetId,
  writeStoredSheetId,
} from "../lib/sheetIdService.js";

const DEFAULT_ID = "18R5rYR6vZSkVND_7XH7WLdkUvdDiN34bLuAdb9SzaC0";
const NEW_ID = "1HE4V8twdmGLUUCFWrQEnNmzWchCf61vzqSuq891XTDc";
const PIN = "2406";

function createMemoryStore(initial = null) {
  /** @type {string | null} */
  let value = initial;
  return {
    async get() {
      return value;
    },
    async set(_key, next) {
      value = next;
    },
  };
}

describe("isValidSheetId", () => {
  it("accepts valid google sheet ids", () => {
    assert.equal(isValidSheetId(NEW_ID), true);
  });

  it("rejects invalid ids", () => {
    assert.equal(isValidSheetId("short"), false);
    assert.equal(isValidSheetId(""), false);
  });
});

describe("readStoredSheetId", () => {
  it("returns default when store is empty", async () => {
    const store = createMemoryStore();
    assert.equal(await readStoredSheetId(store, DEFAULT_ID), DEFAULT_ID);
  });

  it("returns stored id for all clients", async () => {
    const store = createMemoryStore(NEW_ID);
    assert.equal(await readStoredSheetId(store, DEFAULT_ID), NEW_ID);
  });
});

describe("writeStoredSheetId", () => {
  it("persists sheet id after authorized update", async () => {
    const store = createMemoryStore();
    const saved = await writeStoredSheetId(
      store,
      { pin: PIN, sheetId: NEW_ID },
      PIN
    );
    assert.equal(saved, NEW_ID);
    assert.equal(await readStoredSheetId(store, DEFAULT_ID), NEW_ID);
  });

  it("rejects wrong pin", async () => {
    const store = createMemoryStore();
    await assert.rejects(
      () => writeStoredSheetId(store, { pin: "0000", sheetId: NEW_ID }, PIN),
      (err) => {
        assert.equal(err.status, 401);
        return true;
      }
    );
  });
});
