import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractGvizJson,
  normalizePercent,
  parseDateVN,
  parseGvizRows,
  parseGvizResponse,
} from "../src/sheetParser.js";

describe("normalizePercent", () => {
  it("converts decimal sheet values to 0-100 scale", () => {
    assert.equal(normalizePercent({ v: 0.3077, f: "30.77%" }), 30.77);
  });

  it("keeps values already on 0-100 scale", () => {
    assert.equal(normalizePercent({ v: 30.77, f: "30.77%" }), 30.77);
  });

  it("parses formatted percent string when v is missing", () => {
    assert.equal(normalizePercent({ f: "25.51%" }), 25.51);
  });
});

describe("parseDateVN", () => {
  it("parses dd-mm-yyyy", () => {
    const d = parseDateVN("01-06-2026");
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 5);
    assert.equal(d.getDate(), 1);
  });

  it("returns null for invalid date", () => {
    assert.equal(parseDateVN("Row Labels"), null);
    assert.equal(parseDateVN(""), null);
  });
});

describe("parseGvizRows", () => {
  const table = {
    rows: [
      { c: [{ v: "Row Labels" }, null, null, null, null] },
      {
        c: [
          { v: "29-05-2026" },
          { v: 0.2551, f: "25.51%" },
          { v: 0.2227, f: "22.27%" },
          { v: 0.3077, f: "30.77%" },
          { v: 0.2996, f: "29.96%" },
        ],
      },
      {
        c: [
          { v: "01-06-2026" },
          { v: 0.3077, f: "30.77%" },
          { v: 0.2308, f: "23.08%" },
          { v: 0.3077, f: "30.77%" },
          { v: 0.2874, f: "28.74%" },
        ],
      },
      { c: [null, { v: 0.5887 }, { v: 0.5 }, { v: 0.4 }, { v: 0.3 }] },
    ],
  };

  it("skips header and rows without valid dates", () => {
    const rows = parseGvizRows(table);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].dateText, "29-05-2026");
    assert.equal(rows[1].dateText, "01-06-2026");
  });

  it("maps MA columns correctly", () => {
    const rows = parseGvizRows(table);
    assert.equal(rows[0].ma10, 25.51);
    assert.equal(rows[0].ma20, 22.27);
    assert.equal(rows[0].ma50, 30.77);
    assert.equal(rows[0].ma200, 29.96);
  });

  it("sorts rows from oldest to newest when sheet data is returned newest first", () => {
    const descendingTable = {
      rows: [
        {
          c: [
            { v: "03-06-2026" },
            { v: 0.4, f: "40.00%" },
            { v: 0.3, f: "30.00%" },
            { v: 0.2, f: "20.00%" },
            { v: 0.1, f: "10.00%" },
          ],
        },
        {
          c: [
            { v: "02-06-2026" },
            { v: 0.35, f: "35.00%" },
            { v: 0.25, f: "25.00%" },
            { v: 0.15, f: "15.00%" },
            { v: 0.05, f: "5.00%" },
          ],
        },
        {
          c: [
            { v: "01-06-2026" },
            { v: 0.3, f: "30.00%" },
            { v: 0.2, f: "20.00%" },
            { v: 0.1, f: "10.00%" },
            { v: 0.01, f: "1.00%" },
          ],
        },
      ],
    };

    const rows = parseGvizRows(descendingTable);
    assert.deepEqual(
      rows.map((row) => row.dateText),
      ["01-06-2026", "02-06-2026", "03-06-2026"]
    );
  });
});

describe("parseGvizResponse", () => {
  it("parses JSONP wrapper from gviz endpoint", () => {
    const payload = {
      table: {
        rows: [
          {
            c: [
              { v: "03-07-2026" },
              { v: 0.4303, f: "43.03%" },
              { v: 0.35, f: "35.00%" },
              { v: 0.28, f: "28.00%" },
              { v: 0.22, f: "22.00%" },
            ],
          },
        ],
      },
    };
    const text = `/*O_o*/\ngoogle.visualization.Query.setResponse(${JSON.stringify(payload)});`;
    const rows = parseGvizResponse(text);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].ma10, 43.03);
  });
});

describe("extractGvizJson", () => {
  it("throws on invalid response", () => {
    assert.throws(() => extractGvizJson("not json"), /Invalid gviz/);
  });
});
