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
      { c: [null, null, null, null, null] },
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

  it("dynamically maps columns based on labels instead of hardcoded indices", () => {
    const customSchemaTable = {
      cols: [
        { id: "A", label: "CP>MA200", type: "number" },
        { id: "B", label: "CP>MA50", type: "number" },
        { id: "C", label: "Row Labels", type: "date" },
        { id: "D", label: "CP>MA10", type: "number" },
        { id: "E", label: "CP>MA20", type: "number" }
      ],
      rows: [
        {
          c: [
            { v: 0.22, f: "22.00%" },
            { v: 0.28, f: "28.00%" },
            { v: "03-06-2026" },
            { v: 0.40, f: "40.00%" },
            { v: 0.30, f: "30.00%" }
          ]
        }
      ]
    };
    const rows = parseGvizRows(customSchemaTable);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].dateText, "03-06-2026");
    assert.equal(rows[0].ma10, 40.00);
    assert.equal(rows[0].ma20, 30.00);
    assert.equal(rows[0].ma50, 28.00);
    assert.equal(rows[0].ma200, 22.00);
  });

  it("parses mixed date formats correctly (MM-DD-YYYY for days <= 12 and DD-MM-YYYY for days > 12)", () => {
    const mixedDateTable = {
      cols: [
        { id: "A", label: "Row Labels", type: "date" },
        { id: "B", label: "CP>MA10", type: "number" },
        { id: "C", label: "CP>MA20", type: "number" },
        { id: "D", label: "CP>MA50", type: "number" },
        { id: "E", label: "CP>MA200", type: "number" }
      ],
      rows: [
        {
          c: [
            { f: "07-10-2026" }, // July 10th (both parts <= 12 -> swap to 10-07)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        },
        {
          c: [
            { f: "07-09-2026" }, // July 9th (both parts <= 12 -> swap to 09-07)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        },
        {
          c: [
            { f: "07-08-2026" }, // July 8th (both parts <= 12 -> swap to 08-07)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        },
        {
          c: [
            { f: "13-07-2026" }, // July 13th (day > 12 -> keep 13-07)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        }
      ]
    };
    const rows = parseGvizRows(mixedDateTable);
    assert.equal(rows.length, 4);
    // Sort oldest to newest: July 8th, July 9th, July 10th, July 13th
    assert.equal(rows[0].dateText, "08-07-2026");
    assert.equal(rows[1].dateText, "09-07-2026");
    assert.equal(rows[2].dateText, "10-07-2026");
    assert.equal(rows[3].dateText, "13-07-2026");
  });

  it("fills in missing business days by interpolating and extrapolating", () => {
    const missingDateTable = {
      cols: [
        { id: "A", label: "Row Labels", type: "date" },
        { id: "B", label: "CP>MA10", type: "number" },
        { id: "C", label: "CP>MA20", type: "number" },
        { id: "D", label: "CP>MA50", type: "number" },
        { id: "E", label: "CP>MA200", type: "number" }
      ],
      rows: [
        {
          c: [
            null, // Extrapolates to July 13th (Monday) from Row 1's July 10th (Friday)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        },
        {
          c: [
            { f: "07-10-2026" }, // July 10th (Friday)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        },
        {
          c: [
            null, // Interpolates to July 9th (Thursday)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        },
        {
          c: [
            null, // Interpolates to July 8th (Wednesday)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        },
        {
          c: [
            { f: "07-07-2026" }, // July 7th (Tuesday)
            { v: 0.4 }, { v: 0.3 }, { v: 0.2 }, { v: 0.1 }
          ]
        }
      ]
    };
    const rows = parseGvizRows(missingDateTable);
    assert.equal(rows.length, 5);
    // Sort oldest to newest: July 7, 8, 9, 10, 13
    assert.deepEqual(
      rows.map(r => r.dateText),
      ["07-07-2026", "08-07-2026", "09-07-2026", "10-07-2026", "13-07-2026"]
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
