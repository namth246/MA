import { Redis } from "@upstash/redis";
import {
  readStoredSheetId,
  writeStoredSheetId,
} from "../lib/sheetIdService.js";

const DEFAULT_SHEET_ID =
  process.env.SHEET_ID || "18R5rYR6vZSkVND_7XH7WLdkUvdDiN34bLuAdb9SzaC0";
const ACCESS_PIN = process.env.SHEET_ACCESS_PIN || "2406";

/** @type {{ get: (key: string) => Promise<unknown>, set: (key: string, value: string) => Promise<unknown> } | null} */
let store = null;

try {
  const redis = Redis.fromEnv();
  store = {
    get: (key) => redis.get(key),
    set: (key, value) => redis.set(key, value),
  };
} catch {
  store = null;
}

/**
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 */
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!store) {
        res.status(200).json({ sheetId: DEFAULT_SHEET_ID });
        return;
      }
      const sheetId = await readStoredSheetId(store, DEFAULT_SHEET_ID);
      res.status(200).json({ sheetId });
      return;
    }

    if (req.method === "PUT") {
      if (!store) {
        res.status(503).json({
          error: "Chưa cấu hình Redis trên Vercel. Thêm Upstash Redis integration.",
        });
        return;
      }
      const sheetId = await writeStoredSheetId(store, req.body ?? {}, ACCESS_PIN);
      res.status(200).json({ sheetId });
      return;
    }

    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    const status = err?.status || 503;
    const message =
      err instanceof Error ? err.message : "Không thể truy cập cấu hình sheet";
    res.status(status).json({ error: message });
  }
}
