import { POLL_MS } from "./config.js";
import { fetchSheetData } from "./sheetClient.js";
import { serializeDataHash, toDisplayRows } from "./sheetParser.js";
import { renderChart, updateAudit, updateSnapshotAndInsight } from "./chart.js";

/** @type {ReturnType<import("./sheetParser.js").parseGvizRows> | null} */
let currentData = null;
let lastHash = "";
let pollTimer = null;
let isLoading = false;

function setStatus(kind, message) {
  const box = document.getElementById("validationBox");
  if (!box) return;
  if (!message) {
    box.innerHTML = "";
    return;
  }
  const cls = kind === "error" ? "error" : kind === "warn" ? "warn" : "hint";
  const tag = kind === "error" ? "error" : kind === "warn" ? "warn" : "div";
  box.innerHTML = `<${tag} class="${cls}">${message}</${tag}>`;
}

function setLastUpdated(date = new Date()) {
  const el = document.getElementById("lastUpdated");
  if (!el) return;
  el.textContent = `Cập nhật lúc ${date.toLocaleString("vi-VN")}`;
}

function renderTable(data) {
  const tbody = document.querySelector("#dataTable tbody");
  if (!tbody) return;
  const rows = toDisplayRows(data);
  tbody.innerHTML = rows
    .map(
      (r) =>
        `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
    )
    .join("");
}

function renderAll(data) {
  currentData = data;
  renderChart(data);
  renderTable(data);
  updateAudit(data);
  updateSnapshotAndInsight(data);
  setLastUpdated();
  setStatus("ok", "");
}

export async function loadAndRender({ manual = false } = {}) {
  if (isLoading) return;
  isLoading = true;
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) refreshBtn.disabled = true;

  if (manual || !currentData) {
    setStatus("hint", "Đang tải dữ liệu từ Google Sheets...");
  }

  try {
    const data = await fetchSheetData();
    const hash = serializeDataHash(data);

    if (hash !== lastHash) {
      lastHash = hash;
      renderAll(data);
    } else if (manual) {
      setLastUpdated();
      setStatus("hint", "Dữ liệu không thay đổi kể từ lần tải trước.");
      setTimeout(() => setStatus("ok", ""), 2500);
    } else {
      setLastUpdated();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setStatus(
      "error",
      `<b>Không thể tải Google Sheet.</b><br>${msg}<br>Hệ thống sẽ thử lại sau ${POLL_MS / 1000} giây.`
    );
    if (!currentData) {
      const tbody = document.querySelector("#dataTable tbody");
      if (tbody) tbody.innerHTML = "";
    }
  } finally {
    isLoading = false;
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => loadAndRender(), POLL_MS);
}

function bindUi() {
  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn?.addEventListener("click", () => loadAndRender({ manual: true }));
}

function waitForPlotly(maxWaitMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window.Plotly) {
      resolve();
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.Plotly) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > maxWaitMs) {
        clearInterval(timer);
        reject(new Error("Plotly chưa tải xong"));
      }
    }, 50);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bindUi();
  try {
    await waitForPlotly();
    await loadAndRender();
    startPolling();
  } catch (err) {
    setStatus("error", err instanceof Error ? err.message : String(err));
  }
});
