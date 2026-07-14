/** @typedef {{ v?: number | string, f?: string }} GvizCell */
/** @typedef {{ c?: (GvizCell | null)[] }} GvizRow */
/** @typedef {{ rows?: GvizRow[] }} GvizTable */

/**
 * @param {string} text
 */
export function extractGvizJson(text) {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\)\s*;?\s*$/);
  if (!match) {
    throw new Error("Invalid gviz response: missing setResponse wrapper");
  }
  return JSON.parse(match[1]);
}

/**
 * @param {GvizCell | null | undefined} cell
 */
export function normalizePercent(cell) {
  if (!cell) return NaN;

  if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
    const scaled = cell.v <= 1 ? cell.v * 100 : cell.v;
    return Math.round(scaled * 100) / 100;
  }

  const raw = cell.f ?? cell.v ?? "";
  const cleaned = String(raw).replace("%", "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

/**
 * @param {string} s
 */
export function parseDateVN(s) {
  const m = String(s).trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

/**
 * @param {string} dateText
 */
export function formatPctValue(value) {
  return Number(value).toFixed(2) + "%";
}

/**
 * @param {GvizTable} table
 */
function detectSheetSchema(cols, rows) {
  const dateIdx = cols.findIndex(c => c.label && (
    c.label.includes("Row Labels") || 
    c.label.includes("Ngày") || 
    c.type === "date"
  ));
  const actualDateIdx = dateIdx !== -1 ? dateIdx : 0;

  const ma10Idx = findColumnIndex(cols, ["MA10", "C>MA10", "C-MA10", "CP>MA10"], 1);
  const ma20Idx = findColumnIndex(cols, ["MA20", "C>MA20", "C-MA20", "CP>MA20"], 2, "MA200");
  const ma50Idx = findColumnIndex(cols, ["MA50", "C>MA50", "C-MA50", "CP>MA50"], 3);
  const ma200Idx = findColumnIndex(cols, ["MA200", "C>MA200", "C-MA200", "CP>MA200"], 4);

  const dateStrings = [];
  for (const row of rows) {
    const cells = row.c ?? [];
    const cell = cells[actualDateIdx];
    const text = cell?.f ?? cell?.v;
    if (text && String(text).trim() !== "Row Labels") {
      dateStrings.push(String(text).trim());
    }
  }

  let isMMDD = false;
  const firstParts = new Set();
  const secondParts = new Set();
  for (const s of dateStrings) {
    const m = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (m) {
      firstParts.add(m[1]);
      secondParts.add(m[2]);
    }
  }

  if (firstParts.size > 0 && secondParts.size > 0 && firstParts.size < secondParts.size) {
    isMMDD = true;
  }

  return { actualDateIdx, isMMDD, ma10Idx, ma20Idx, ma50Idx, ma200Idx };
}

function findColumnIndex(cols, keywords, fallbackIdx, excludeKeyword = null) {
  const idx = cols.findIndex(c => c.label && keywords.some(k => c.label.includes(k)) && (!excludeKeyword || !c.label.includes(excludeKeyword)));
  return idx !== -1 ? idx : fallbackIdx;
}

function parseDateString(s, isMMDD) {
  const m = String(s).trim().match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!m) return null;
  const part1 = +m[1];
  const part2 = +m[2];
  const year = +m[3];

  let day, month;
  if (isMMDD) {
    if (part1 > 12) {
      day = part1;
      month = part2;
    } else if (part2 > 12) {
      day = part2;
      month = part1;
    } else {
      day = part2;
      month = part1;
    }
  } else {
    day = part1;
    month = part2;
  }

  try {
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return d;
    }
  } catch {
    return null;
  }
  return null;
}

function addBusinessDays(date, days) {
  let result = new Date(date);
  let count = 0;
  while (count < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return result;
}

function subtractBusinessDays(date, days) {
  let result = new Date(date);
  let count = 0;
  while (count < days) {
    result.setDate(result.getDate() - 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return result;
}

function fillMissingDates(rows) {
  const validIndices = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].dateObj) {
      validIndices.push(i);
    }
  }

  if (validIndices.length === 0) {
    return rows;
  }

  const firstValidIdx = validIndices[0];
  const firstValidDate = rows[firstValidIdx].dateObj;
  for (let i = firstValidIdx - 1; i >= 0; i--) {
    rows[i].dateObj = addBusinessDays(firstValidDate, firstValidIdx - i);
  }

  for (let k = 0; k < validIndices.length - 1; k++) {
    const startIdx = validIndices[k];
    const endIdx = validIndices[k + 1];
    const startDate = rows[startIdx].dateObj;
    for (let i = startIdx + 1; i < endIdx; i++) {
      rows[i].dateObj = subtractBusinessDays(startDate, i - startIdx);
    }
  }

  const lastValidIdx = validIndices[validIndices.length - 1];
  const lastValidDate = rows[lastValidIdx].dateObj;
  for (let i = lastValidIdx + 1; i < rows.length; i++) {
    rows[i].dateObj = subtractBusinessDays(lastValidDate, i - lastValidIdx);
  }

  const pad = (n) => String(n).padStart(2, "0");
  for (const row of rows) {
    if (row.dateObj) {
      row.dateText = `${pad(row.dateObj.getDate())}-${pad(row.dateObj.getMonth() + 1)}-${row.dateObj.getFullYear()}`;
    }
  }

  return rows;
}

/**
 * @param {GvizTable} table
 */
export function parseGvizRows(table) {
  const rows = table.rows ?? [];
  const cols = table.cols ?? [];

  const { actualDateIdx, isMMDD, ma10Idx, ma20Idx, ma50Idx, ma200Idx } = detectSheetSchema(cols, rows);

  const result = [];

  for (const row of rows) {
    const cells = row.c ?? [];
    if (!cells.length) continue;

    const dateCell = cells[actualDateIdx];
    const dateText = dateCell?.f ?? dateCell?.v;
    if (dateText && String(dateText).trim() === "Row Labels") continue;

    const ma10 = normalizePercent(cells[ma10Idx]);
    const ma20 = normalizePercent(cells[ma20Idx]);
    const ma50 = normalizePercent(cells[ma50Idx]);
    const ma200 = normalizePercent(cells[ma200Idx]);

    if ([ma10, ma20, ma50, ma200].some(v => v === null || Number.isNaN(v))) continue;

    let dateObj = null;
    if (dateText) {
      dateObj = parseDateString(String(dateText), isMMDD);
    }

    result.push({
      dateText: dateText ? String(dateText).trim() : "",
      dateObj,
      ma10,
      ma20,
      ma50,
      ma200,
    });
  }

  fillMissingDates(result);

  const finalResult = result.filter(r => r.dateObj !== null);

  return finalResult.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
}

/**
 * @param {string} text
 */
export function parseGvizResponse(text) {
  const payload = extractGvizJson(text);
  return parseGvizRows(payload.table ?? {});
}

/**
 * @param {ReturnType<typeof parseGvizRows>} data
 */
export function toDisplayRows(data) {
  return data.map((d) => [
    d.dateText,
    formatPctValue(d.ma10),
    formatPctValue(d.ma20),
    formatPctValue(d.ma50),
    formatPctValue(d.ma200),
  ]);
}

/**
 * @param {ReturnType<typeof parseGvizRows>} data
 */
export function serializeDataHash(data) {
  return JSON.stringify(
    data.map((d) => [d.dateText, d.ma10, d.ma20, d.ma50, d.ma200])
  );
}
