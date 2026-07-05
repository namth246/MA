import { buildGvizUrl } from "./config.js";
import { parseGvizResponse } from "./sheetParser.js";

export async function fetchSheetData() {
  const response = await fetch(buildGvizUrl());
  if (!response.ok) {
    throw new Error(`Google Sheet trả về HTTP ${response.status}`);
  }
  const text = await response.text();
  const rows = parseGvizResponse(text);
  if (!rows.length) {
    throw new Error("Không có dòng dữ liệu hợp lệ từ sheet Dem MA");
  }
  return rows;
}
