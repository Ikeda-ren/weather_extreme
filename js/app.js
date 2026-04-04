const regionSelect = document.getElementById("regionSelect");
const prefSelect = document.getElementById("prefSelect");
const monthSelect = document.getElementById("monthSelect");
const statusEl = document.getElementById("status");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");
const liveSummaryEl = document.getElementById("liveSummary");

const elementDescriptionEl = document.getElementById("elementDescription");
const debugDetailsEl = document.getElementById("debugDetails");
const debugBodyEl = document.getElementById("debugBody");

let refreshTimer = null;
let manifestCache = null;
let prefecturesData = [];

const DEFAULT_REGION = "近畿";
const DEFAULT_PREF = "osaka";
const DEFAULT_MONTH = "all";
const DEFAULT_ELEMENT = "dailyPrecip";

const ELEMENT_LABELS = {
  dailyPrecip: "日降水量",
  max10mPrecip: "日最大10分間降水量",
  max1hPrecip: "日最大1時間降水量",
  monthMax1h10mPrecip: "日最大1時間降水量(10分間隔)の多い方から",
  monthMax3hPrecip: "月最大3時間降水量の多い方から",
  monthMax6hPrecip: "月最大6時間降水量の多い方から",
  monthMax12hPrecip: "月最大12時間降水量の多い方から",
  monthMax24hPrecip: "月最大24時間降水量の多い方から",
  monthMax48hPrecip: "月最大48時間降水量の多い方から",
  monthMax72hPrecip: "月最大72時間降水量の多い方から",
  monthPrecipHigh: "月降水量の多い方から",
  monthPrecipLow: "月降水量の少ない方から",

  dailyMaxTempHigh: "日最高気温の高い方から",
  dailyMaxTempLow: "日最高気温の低い方から",
  dailyMinTempHigh: "日最低気温の高い方から",
  dailyMinTempLow: "日最低気温の低い方から",
  monthAvgTempHigh: "月平均気温の高い方から",
  monthAvgTempLow: "月平均気温の低い方から",

  dailyMinHumidity: "日最小相対湿度",

  dailyMaxWind: "日最大風速",
  dailyMaxGust: "日最大瞬間風速",

  monthSunshineHigh: "月間日照時間の多い方から",
  monthSunshineLow: "月間日照時間の少ない方から",

  dailySnowDepth: "降雪の深さ日合計",
  monthSnowDepth: "降雪の深さ月合計",
  monthMax3hSnow: "月最大3時間降雪量の多い方から",
  monthMax6hSnow: "月最大6時間降雪量の多い方から",
  monthMax12hSnow: "月最大12時間降雪量の多い方から",
  monthMax24hSnow: "月最大24時間降雪量の多い方から",
  monthMax48hSnow: "月最大48時間降雪量の多い方から",
  monthMax72hSnow: "月最大72時間降雪量の多い方から",
  monthDeepSnowHigh: "月最深積雪の大きい方から",
  monthDeepSnowLow: "月最深積雪の小さい方から"
};

const ELEMENT_DESCRIPTIONS = {
  dailyPrecip: "各日の24時間降水量による順位です。",
  max10mPrecip: "各日に観測された10分間降水量の最大値による順位です。",
  max1hPrecip: "各日に観測された1時間降水量の最大値による順位です。",
  monthMax1h10mPrecip: "月内の10分値から算出した1時間積算降水量の最大値による順位です。",
  monthMax3hPrecip: "月内の3時間降水量最大値による順位です。",
  monthMax6hPrecip: "月内の6時間降水量最大値による順位です。",
  monthMax12hPrecip: "月内の12時間降水量最大値による順位です。",
  monthMax24hPrecip: "月内の24時間降水量最大値による順位です。",
  monthMax48hPrecip: "月内の48時間降水量最大値による順位です。",
  monthMax72hPrecip: "月内の72時間降水量最大値による順位です。",
  monthPrecipHigh: "月降水量の多い記録順です。",
  monthPrecipLow: "月降水量の少ない記録順です。",

  dailyMaxTempHigh: "日最高気温の高い記録順です。",
  dailyMaxTempLow: "日最高気温の低い記録順です。",
  dailyMinTempHigh: "日最低気温の高い記録順です。",
  dailyMinTempLow: "日最低気温の低い記録順です。",
  monthAvgTempHigh: "月平均気温の高い記録順です。",
  monthAvgTempLow: "月平均気温の低い記録順です。",

  dailyMinHumidity: "日最小相対湿度の低い記録順です。",

  dailyMaxWind: "日最大風速の大きい記録順です。",
  dailyMaxGust: "日最大瞬間風速の大きい記録順です。",

  monthSunshineHigh: "月間日照時間の多い記録順です。",
  monthSunshineLow: "月間日照時間の少ない記録順です。",

  dailySnowDepth: "日ごとの降雪の深さ合計による順位です。",
  monthSnowDepth: "月ごとの降雪の深さ合計による順位です。",
  monthMax3hSnow: "月内の3時間降雪量最大値による順位です。",
  monthMax6hSnow: "月内の6時間降雪量最大値による順位です。",
  monthMax12hSnow: "月内の12時間降雪量最大値による順位です。",
  monthMax24hSnow: "月内の24時間降雪量最大値による順位です。",
  monthMax48hSnow: "月内の48時間降雪量最大値による順位です。",
  monthMax72hSnow: "月内の72時間降雪量最大値による順位です。",
  monthDeepSnowHigh: "月最深積雪の大きい記録順です。",
  monthDeepSnowLow: "月最深積雪の小さい記録順です。"
};

const LIVE_SUMMARY_ORDER = [
  "dailyPrecip",
  "max10mPrecip",
  "max1hPrecip",
  "monthMax1h10mPrecip",
  "monthMax3hPrecip",
  "monthMax6hPrecip",
  "monthMax12hPrecip",
  "monthMax24hPrecip",
  "monthMax48hPrecip",
  "monthMax72hPrecip",
  "monthPrecipHigh",
  "monthPrecipLow",
  "dailyMaxTempHigh",
  "dailyMaxTempLow",
  "dailyMinTempHigh",
  "dailyMinTempLow",
  "monthAvgTempHigh",
  "monthAvgTempLow",
  "dailyMinHumidity",
  "dailyMaxWind",
  "dailyMaxGust",
  "monthSunshineHigh",
  "monthSunshineLow",
  "dailySnowDepth",
  "monthSnowDepth",
  "monthMax3hSnow",
  "monthMax6hSnow",
  "monthMax12hSnow",
  "monthMax24hSnow",
  "monthMax48hSnow",
  "monthMax72hSnow",
  "monthDeepSnowHigh",
  "monthDeepSnowLow"
];

const debugState = {
  selectedRegion: "",
  selectedPref: "",
  selectedPrefName: "",
  selectedMonth: "",
  selectedElement: "",
  selectedElementLabel: "",
  manifest: {
    path: "./data/manifest.json",
    ok: false,
    observationTime: "",
    generatedAt: "",
    error: ""
  },
  liveSummary: {
    path: "",
    ok: false,
    itemCount: 0,
    observationTime: "",
    generatedAt: "",
    status: "",
    message: "",
    error: ""
  },
  table: {
    path: "",
    ok: false,
    rowCount: 0,
    observationTime: "",
    generatedAt: "",
    status: "",
    message: "",
    error: ""
  }
};

/* =========================
 * utility
 * ========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDualLine(text) {
  if (!text) return "-";
  const parts = String(text).split("（");
  const first = parts[0] || "-";
  const second = parts[1] ? "（" + parts[1] : "";
  return `${escapeHtml(first)}${second ? `<span class="sub">${escapeHtml(second)}</span>` : ""}`;
}

function formatDateTime(isoText) {
  if (!isoText) return "-";
  const d = new Date(isoText);
  if (Number.isNaN(d.getTime())) return escapeHtml(isoText);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}年${m}月${day}日 ${hh}:${mm}`;
}

function formatObservationLabel(isoText) {
  if (!isoText) return "-";
  return `${formatDateTime(isoText)} 時点`;
}

function getSelectedElement() {
  const checked = document.querySelector('input[name="element"]:checked');
  return checked ? checked.value : DEFAULT_ELEMENT;
}

function getSelectedElementLabel() {
  return ELEMENT_LABELS[getSelectedElement()] || getSelectedElement();
}

function getSelectedPrefMeta() {
  return prefecturesData.find((p) => p.key === prefSelect.value) || null;
}

async function fetchJsonWithMeta(path) {
  const response = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const json = await response.json();
  return json;
}

/* =========================
 * debug
 * ========================= */

function updateDebugSelections() {
  const prefMeta = getSelectedPrefMeta();
  debugState.selectedRegion = regionSelect.value;
  debugState.selectedPref = prefSelect.value;
  debugState.selectedPrefName = prefMeta?.name || "";
  debugState.selectedMonth = monthSelect.value;
  debugState.selectedElement = getSelectedElement();
  debugState.selectedElementLabel = getSelectedElementLabel();
}

function renderDebugPanel() {
  if (!debugBodyEl) return;

  const lines = [
    ["地域", debugState.selectedRegion],
    ["都道府県", `${debugState.selectedPrefName} (${debugState.selectedPref})`],
    ["月", debugState.selectedMonth],
    ["要素", `${debugState.selectedElementLabel} (${debugState.selectedElement})`],

    ["manifest path", debugState.manifest.path],
    ["manifest OK", String(debugState.manifest.ok)],
    ["manifest observationTime", debugState.manifest.observationTime || "-"],
    ["manifest generatedAt", debugState.manifest.generatedAt || "-"],
    ["manifest error", debugState.manifest.error || "-"],

    ["live-summary path", debugState.liveSummary.path || "-"],
    ["live-summary OK", String(debugState.liveSummary.ok)],
    ["live-summary itemCount", String(debugState.liveSummary.itemCount)],
    ["live-summary status", debugState.liveSummary.status || "-"],
    ["live-summary message", debugState.liveSummary.message || "-"],
    ["live-summary observationTime", debugState.liveSummary.observationTime || "-"],
    ["live-summary generatedAt", debugState.liveSummary.generatedAt || "-"],
    ["live-summary error", debugState.liveSummary.error || "-"],

    ["table path", debugState.table.path || "-"],
    ["table OK", String(debugState.table.ok)],
    ["table rowCount", String(debugState.table.rowCount)],
    ["table status", debugState.table.status || "-"],
    ["table message", debugState.table.message || "-"],
    ["table observationTime", debugState.table.observationTime || "-"],
    ["table generatedAt", debugState.table.generatedAt || "-"],
    ["table error", debugState.table.error || "-"]
  ];

  debugBodyEl.innerHTML = `
    <div class="debug-grid">
      ${lines.map(([k, v]) => `
        <div class="debug-key">${escapeHtml(k)}</div>
        <div class="debug-value">${escapeHtml(v)}</div>
      `).join("")}
    </div>
  `;

  if (debugDetailsEl) {
    debugDetailsEl.hidden = false;
  }
}

/* =========================
 * description
 * ========================= */

function renderElementDescription() {
  if (!elementDescriptionEl) return;
  const element = getSelectedElement();
  const label = getSelectedElementLabel();
  const description = ELEMENT_DESCRIPTIONS[element] || "この要素の説明は未設定です。";

  elementDescriptionEl.innerHTML = `
    <div class="element-description-title">${escapeHtml(label)}</div>
    <div class="element-description-body">${escapeHtml(description)}</div>
  `;
}

/* =========================
 * select / init
 * ========================= */

async function initPrefectures() {
  const data = await fetchJsonWithMeta("./config/prefectures.json");
  prefecturesData = data.prefectures || [];

  const regions = [...new Set(prefecturesData.map((p) => p.region))];
  regionSelect.innerHTML = regions
    .map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`)
    .join("");

  if (regions.includes(DEFAULT_REGION)) {
    regionSelect.value = DEFAULT_REGION;
  }

  populatePrefectures();

  if ([...prefSelect.options].some((opt) => opt.value === DEFAULT_PREF)) {
    prefSelect.value = DEFAULT_PREF;
  }

  monthSelect.value = DEFAULT_MONTH;

  const defaultRadio = document.querySelector(`input[name="element"][value="${DEFAULT_ELEMENT}"]`);
  if (defaultRadio) {
    defaultRadio.checked = true;
  }

  updateDebugSelections();
  renderDebugPanel();
  renderElementDescription();
}

function populatePrefectures() {
  const region = regionSelect.value;
  const list = prefecturesData.filter((p) => p.region === region);

  prefSelect.innerHTML = list
    .map((pref) => `<option value="${escapeHtml(pref.key)}">${escapeHtml(pref.name)}</option>`)
    .join("");
}

function makeHeader() {
  const cols = ["地点名 / 観測開始"];
  for (let i = 1; i <= 10; i++) {
    cols.push(`${i}位`);
  }

  tableHead.innerHTML = `
    <tr>
      ${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}
    </tr>
  `;
}

/* =========================
 * manifest
 * ========================= */

async function loadManifest() {
  debugState.manifest.ok = false;
  debugState.manifest.error = "";
  debugState.manifest.observationTime = "";
  debugState.manifest.generatedAt = "";

  try {
    const data = await fetchJsonWithMeta("./data/manifest.json");
    manifestCache = data;

    debugState.manifest.ok = true;
    debugState.manifest.observationTime =
      data.observationTime || data.baseTime || data.updatedAt || "";
    debugState.manifest.generatedAt = data.generatedAt || "";
  } catch (error) {
    console.error(error);
    manifestCache = null;
    debugState.manifest.error = error.message || String(error);
  }

  renderDebugPanel();
}

/* =========================
 * render status
 * ========================= */

function buildStatusText({
  observationTime,
  rowCount,
  elementLabel,
  prefName,
  extraMessage
}) {
  const parts = [];

  if (observationTime) {
    parts.push(`更新時刻:${formatObservationLabel(observationTime)}`);
  } else if (manifestCache?.observationTime || manifestCache?.baseTime || manifestCache?.updatedAt) {
    const fallbackTime =
      manifestCache.observationTime || manifestCache.baseTime || manifestCache.updatedAt;
    parts.push(`更新時刻:${formatObservationLabel(fallbackTime)}`);
  }

  if (typeof rowCount === "number") {
    parts.push(`地点数:${rowCount}`);
  }
  if (elementLabel) {
    parts.push(`選択中要素:${elementLabel}`);
  }
  if (prefName) {
    parts.push(`都道府県:${prefName}`);
  }
  if (extraMessage) {
    parts.push(extraMessage);
  }

  return parts.join(" / ");
}

/* =========================
 * table render
 * ========================= */

function renderTable(rows) {
  tableBody.innerHTML = "";

  for (const row of rows) {
    const tr = document.createElement("tr");

    const stationTd = document.createElement("td");
    stationTd.className = "station-col";
    stationTd.innerHTML = `
      <div class="station-name">${escapeHtml(row.stationName || "-")}</div>
      <div class="station-start">${renderDualLine(row.startDate || "-")}</div>
    `;
    tr.appendChild(stationTd);

    for (let i = 0; i < 10; i++) {
      const rank = row.ranks?.[i];
      const td = document.createElement("td");

      if (rank) {
        const classes = ["rank-cell"];
        if (rank.highlightLive) classes.push("live-in-rank");
        if (rank.highlightWithinYear) classes.push("within-year");
        td.className = classes.join(" ");

        td.innerHTML = `
          <div class="value">${escapeHtml(rank.value ?? "-")}</div>
          <div class="date">${renderDualLine(rank.date || "-")}</div>
        `;
      } else {
        td.className = "rank-cell";
        td.innerHTML = `
          <div class="value">-</div>
          <div class="date">-</div>
        `;
      }

      tr.appendChild(td);
    }

    tableBody.appendChild(tr);
  }
}

function renderTableMessage(message) {
  tableBody.innerHTML = `
    <tr>
      <td colspan="11">${escapeHtml(message)}</td>
    </tr>
  `;
}

/* =========================
 * live summary render
 * ========================= */

function renderLiveSummary(items) {
  if (!items || items.length === 0) {
    liveSummaryEl.innerHTML = `
      <div class="live-summary-empty">
        現在、実況で10位以内に入っている項目はありません。
      </div>
    `;
    return;
  }

  const sorted = [...items].sort((a, b) => {
    const oa = LIVE_SUMMARY_ORDER.indexOf(a.elementKey);
    const ob = LIVE_SUMMARY_ORDER.indexOf(b.elementKey);
    if (oa !== ob) return oa - ob;
    if (a.rank !== b.rank) return a.rank - b.rank;
    return String(a.stationName || "").localeCompare(String(b.stationName || ""), "ja");
  });

  const overall = sorted.filter((item) => item.monthLabel === "通年");
  const monthly = sorted.filter((item) => item.monthLabel !== "通年");

  const renderColumn = (title, data) => `
    <div class="live-summary-column">
      <div class="live-summary-column-title">${escapeHtml(title)}</div>
      <div class="live-summary-scroll">
        ${
          data.length === 0
            ? `<div class="live-summary-empty">該当なし</div>`
            : data
                .map((item) => {
                  const itemClass =
                    Number(item.rank) === 1
                      ? "live-summary-item live-summary-item-top1"
                      : "live-summary-item live-summary-item-rankin";

                  return `
                    <div class="${itemClass}">
                      <div class="live-summary-main">
                        <span>${escapeHtml(String(item.rank))}位</span>
                        <span>${escapeHtml(item.stationName || "-")}</span>
                        <span>${escapeHtml(item.elementLabel || "-")}</span>
                      </div>
                      <div class="live-summary-sub">
                        <span>${escapeHtml(String(item.value ?? "-"))}</span>
                        <span>${escapeHtml(item.date || "-")}</span>
                        <span>${escapeHtml(item.monthLabel || "")}</span>
                      </div>
                    </div>
                  `;
                })
                .join("")
        }
      </div>
    </div>
  `;

  liveSummaryEl.innerHTML = `
    <div class="live-summary-grid">
      ${renderColumn("通年", overall)}
      ${renderColumn("当月", monthly)}
    </div>
  `;
}

function renderLiveSummaryMessage(message) {
  liveSummaryEl.innerHTML = `
    <div class="live-summary-empty">${escapeHtml(message)}</div>
  `;
}

/* =========================
 * load live summary
 * ========================= */

async function loadLiveSummary(prefKey) {
  const path = `./data/${prefKey}/live-summary.json`;

  debugState.liveSummary.path = path;
  debugState.liveSummary.ok = false;
  debugState.liveSummary.itemCount = 0;
  debugState.liveSummary.status = "";
  debugState.liveSummary.message = "";
  debugState.liveSummary.observationTime = "";
  debugState.liveSummary.generatedAt = "";
  debugState.liveSummary.error = "";

  try {
    const data = await fetchJsonWithMeta(path);

    const items = data.items || [];
    const status = data.status || "ok";
    const message = data.message || "";

    debugState.liveSummary.ok = true;
    debugState.liveSummary.itemCount = items.length;
    debugState.liveSummary.status = status;
    debugState.liveSummary.message = message;
    debugState.liveSummary.observationTime =
      data.observationTime || data.baseTime || data.updatedAt || "";
    debugState.liveSummary.generatedAt = data.generatedAt || "";

    if (status === "error") {
      renderLiveSummaryMessage(message || "実況一覧の取得に失敗しました。");
    } else {
      renderLiveSummary(items);
    }
  } catch (error) {
    console.error(error);
    debugState.liveSummary.error = error.message || String(error);
    renderLiveSummaryMessage("実況一覧の読み込みに失敗しました。");
  }

  renderDebugPanel();
}

/* =========================
 * load table
 * ========================= */

async function loadTable() {
  updateDebugSelections();
  renderElementDescription();

  const prefMeta = getSelectedPrefMeta();
  const pref = prefSelect.value;
  const element = getSelectedElement();
  const month = monthSelect.value;
  const elementLabel = getSelectedElementLabel();

  debugState.table.path = `./data/${pref}/${element}-${month}.json`;
  debugState.table.ok = false;
  debugState.table.rowCount = 0;
  debugState.table.status = "";
  debugState.table.message = "";
  debugState.table.observationTime = "";
  debugState.table.generatedAt = "";
  debugState.table.error = "";

  await loadManifest();

  if (!prefMeta) {
    statusEl.textContent = "都道府県情報が見つかりません";
    renderTableMessage("都道府県情報が見つかりません。");
    renderLiveSummaryMessage("実況一覧を表示できません。");
    renderDebugPanel();
    return;
  }

  await loadLiveSummary(pref);

  if (!prefMeta.stationsFile) {
    statusEl.textContent = buildStatusText({
      rowCount: 0,
      elementLabel,
      prefName: prefMeta.name,
      extraMessage: "未対応"
    });
    renderTableMessage("この都道府県は未対応です。");
    renderDebugPanel();
    return;
  }

  statusEl.textContent = "読み込み中...";

  try {
    const data = await fetchJsonWithMeta(`./data/${pref}/${element}-${month}.json`);

    const rows = data.rows || [];
    const status = data.status || "ok";
    const message = data.message || "";
    const observationTime = data.observationTime || data.baseTime || data.updatedAt || "";

    debugState.table.ok = true;
    debugState.table.rowCount = rows.length;
    debugState.table.status = status;
    debugState.table.message = message;
    debugState.table.observationTime = observationTime;
    debugState.table.generatedAt = data.generatedAt || "";

    makeHeader();

    if (status === "error") {
      renderTableMessage(message || "データ取得に失敗しました。");
      statusEl.textContent = buildStatusText({
        observationTime,
        rowCount: 0,
        elementLabel,
        prefName: prefMeta.name,
        extraMessage: message || "データ取得失敗"
      });
    } else if (status === "no_observation") {
      renderTableMessage("この要素は、この県では観測対象がありません。");
      statusEl.textContent = buildStatusText({
        observationTime,
        rowCount: 0,
        elementLabel,
        prefName: prefMeta.name
      });
    } else {
      renderTable(rows);
      statusEl.textContent = buildStatusText({
        observationTime,
        rowCount: rows.length,
        elementLabel,
        prefName: prefMeta.name
      });
    }
  } catch (error) {
    console.error(error);
    debugState.table.error = error.message || String(error);

    makeHeader();
    renderTableMessage("JSONの読み込みに失敗しました。");
    statusEl.textContent = buildStatusText({
      observationTime:
        manifestCache?.observationTime || manifestCache?.baseTime || manifestCache?.updatedAt || "",
      rowCount: 0,
      elementLabel,
      prefName: prefMeta.name,
      extraMessage: "JSONの読み込みに失敗しました"
    });
  }

  renderDebugPanel();
}

/* =========================
 * auto refresh
 * ========================= */

function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(() => {
    loadTable().catch((error) => {
      console.error(error);
    });
  }, 10 * 60 * 1000);
}

/* =========================
 * init
 * ========================= */

async function init() {
  makeHeader();
  await initPrefectures();

  regionSelect.addEventListener("change", async () => {
    populatePrefectures();
    updateDebugSelections();
    renderDebugPanel();
    await loadTable();
  });

  prefSelect.addEventListener("change", loadTable);
  monthSelect.addEventListener("change", loadTable);

  document.querySelectorAll('input[name="element"]').forEach((el) => {
    el.addEventListener("change", loadTable);
  });

  await loadTable();
  startAutoRefresh();
}

init().catch((error) => {
  console.error(error);
  statusEl.textContent = "初期化に失敗しました";
});
