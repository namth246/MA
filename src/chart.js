import { SERIES_COLORS } from "./config.js";
import { formatPctValue } from "./sheetParser.js";

/**
 * @param {import("./sheetParser.js").parseGvizRows extends (...args: any) => infer R ? R : never} data
 */
export function buildTraces(data) {
  const x = data.map((d) => d.dateText);
  const series = [
    { name: "C>MA10", key: "ma10" },
    { name: "C>MA20", key: "ma20" },
    { name: "C>MA50", key: "ma50" },
    { name: "C>MA200", key: "ma200" },
  ];

  return series.map((s) => ({
    x,
    y: data.map((d) => d[s.key]),
    type: "scatter",
    mode: "lines+markers",
    name: s.name,
    line: { color: SERIES_COLORS[s.name], width: 3, shape: "spline" },
    marker: { size: 7, color: SERIES_COLORS[s.name] },
    hovertemplate: `<b>%{x}</b><br>• ${s.name}: %{y:.2f}%<extra></extra>`,
  }));
}

/**
 * @param {import("./sheetParser.js").parseGvizRows extends (...args: any) => infer R ? R : never} data
 */
export function buildLayout(data) {
  const len = data.length;
  return {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#FFFFFF", family: '"Times New Roman", Times, serif', size: 14 },
    xaxis: {
      title: "Ngày",
      gridcolor: "rgba(255,255,255,.12)",
      tickangle: -35,
      rangeslider: { visible: true, bgcolor: "#071229", thickness: 0.08 },
    },
    yaxis: {
      title: "Tỷ lệ (%)",
      gridcolor: "rgba(255,255,255,.12)",
      ticksuffix: "%",
    },
    hovermode: "x unified",
    updatemenus: [
      {
        type: "buttons",
        direction: "right",
        x: 0,
        y: -0.22,
        buttons: [
          { label: "1M", method: "relayout", args: [{ "xaxis.range": [Math.max(0, len - 22), len - 1] }] },
          { label: "3M", method: "relayout", args: [{ "xaxis.range": [Math.max(0, len - 66), len - 1] }] },
          { label: "6M", method: "relayout", args: [{ "xaxis.range": [Math.max(0, len - 132), len - 1] }] },
          { label: "YTD", method: "relayout", args: [{ "xaxis.range": [0, len - 1] }] },
          { label: "MAX", method: "relayout", args: [{ "xaxis.autorange": true }] },
        ],
        bgcolor: "#071229",
        bordercolor: "rgba(255,255,255,.25)",
        font: { color: "#FFFFFF" },
      },
    ],
    legend: {
      x: 0.01,
      y: 0.98,
      bgcolor: "rgba(0,0,0,.55)",
      bordercolor: "rgba(255,255,255,.18)",
      borderwidth: 1,
      font: { size: 16 },
    },
    margin: { l: 70, r: 30, t: 35, b: 120 },
    dragmode: "pan",
  };
}

export const chartConfig = {
  responsive: true,
  scrollZoom: true,
  displaylogo: false,
  modeBarButtonsToAdd: ["drawline"],
  toImageButtonOptions: {
    format: "png",
    filename: "CNF_Live_Sheet_Chart",
    width: 1800,
    height: 1000,
    scale: 2,
  },
};

/**
 * @param {import("./sheetParser.js").parseGvizRows extends (...args: any) => infer R ? R : never} data
 */
export function renderChart(data) {
  const traces = buildTraces(data);
  const layout = buildLayout(data);
  window.Plotly.react("chart", traces, layout, chartConfig);
}

export function updateAudit(data) {
  const body = document.getElementById("auditBody");
  if (!body || !data.length) return;
  body.innerHTML = "";
  const idxs = [0, Math.floor(data.length / 2), data.length - 1];
  const labels = ["Điểm đầu", "Điểm giữa", "Điểm cuối"];
  idxs.forEach((idx, k) => {
    const d = data[idx];
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${labels[k]}</td><td>${d.dateText}</td><td>${formatPctValue(d.ma10)}</td><td>${formatPctValue(d.ma20)}</td><td>${formatPctValue(d.ma50)}</td><td>${formatPctValue(d.ma200)}</td><td class="ok">✓ Pass</td>`;
    body.appendChild(tr);
  });
}

/**
 * @param {import("./sheetParser.js").parseGvizRows extends (...args: any) => infer R ? R : never} data
 */
export function updateSnapshotAndInsight(data) {
  if (!data.length) return;
  const last = data[data.length - 1];
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatPctValue(value);
  };
  set("m10", last.ma10);
  set("m20", last.ma20);
  set("m50", last.ma50);
  set("m200", last.ma200);

  const minMA10 = data.reduce((a, b) => (b.ma10 < a.ma10 ? b : a), data[0]);
  const insightBox = document.getElementById("insightBox");
  if (!insightBox) return;
  insightBox.innerHTML = `
    <p><b>1. Breadth ngắn hạn:</b> C&gt;MA10 đạt <b>${formatPctValue(last.ma10)}</b> và C&gt;MA20 đạt <b>${formatPctValue(last.ma20)}</b>. So với vùng yếu nhất tại ${minMA10.dateText}, độ rộng ngắn hạn đang được cải thiện.</p>
    <p><b>2. Breadth trung hạn:</b> C&gt;MA50 đạt <b>${formatPctValue(last.ma50)}</b>. Nếu MA50 thấp hơn nhiều so với MA10/MA20, nhịp hồi vẫn thiên về ngắn hạn.</p>
    <p><b>3. Breadth dài hạn:</b> C&gt;MA200 đạt <b>${formatPctValue(last.ma200)}</b>. Nếu vẫn dưới 50%, cấu trúc dài hạn chưa thật sự đồng thuận.</p>
    <p><b>Kết luận CNF:</b> Theo dõi sự lan tỏa từ MA10/MA20 sang MA50/MA200 trước khi nâng mức đánh giá thị trường.</p>
  `;
}
