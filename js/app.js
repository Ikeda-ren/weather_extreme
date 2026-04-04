const regionSelect = document.getElementById("regionSelect");
const prefSelect = document.getElementById("prefSelect");
const monthSelect = document.getElementById("monthSelect");
const statusEl = document.getElementById("status");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");
const liveSummaryEl = document.getElementById("liveSummary");

let refreshTimer = null;
let manifestCache = null;
let prefecturesData = [];

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

const ELEMENT_ORDER = [
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

const DEFAULT_REGION = "近畿";
const DEFAULT_PREF = "osaka";
const DEFAULT_MONTH = "all";
const DEFAULT_ELEMENT = "dailyPrecip";

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function getSelectedElement() {
  const checked = qs('input[name="element"]:checked');
  return checked ? checked.value : DEFAULT_ELEMENT;
}

function getSelectedElementLabel() {
  return ELEMENT_LABELS[getSelectedElement()] || getSelectedElement();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDualLine(text) {
  if (!text) return "-";

  const value = String(text);
  const idx = value.indexOf("（");

  if (idx === -1) {
    return `<div class="date-main">${escapeHtml(value)}</div>`;
  }

  const first = value.slice(0, idx);
  const second = value.slice(idx);

  return `
    <div class="date-main">${escapeHtml(first)}</div>
    <div class="date-sub">${escapeHtml(second)}</div>
  `;
}

function formatObservedAt(isoText) {
  if (!isoText) return "-";

  const d = new Date(isoText);
  if (Number.isNaN(d.getTime())) return isoText;

  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDisplayDate(dateText) {
  if (!dateText) return "-";

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!m) return dateText;

  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`;
}

function getSelectedPrefMeta() {
  return prefecturesData.find((p) => p.key === prefSelect.value) || null;
}

function monthLabel(month) {
  return month === "all" ? "通年" : `${month}月`;
}

function makeHeader() {
  const cols = ["地点名 / 観測開始"];
  for (let i = 1; i <= 10; i += 1) cols.push(`${i}位`);

  tableHead.innerHTML = `
    <tr>
      ${cols.map((c, i) => `<th class="${i === 0 ? "station-col" : ""}">${escapeHtml(c)}</th>`).join("")}
    </tr>
  `;
}

async function initPrefectures() {
  const res = await fetch(`./config/prefectures.json?t=${Date.now()}`, {
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
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

  const defaultRadio = qs(`input[name="element"][value="${DEFAULT_ELEMENT}"]`);
  if (defaultRadio) {
    defaultRadio.checked = true;
  }
}

function populatePrefectures() {
  const region = regionSelect.value;
  const list = prefecturesData.filter((p) => p.region === region);

  prefSelect.innerHTML = list
    .map((pref) => `<option value="${escapeHtml(pref.key)}">${escapeHtml(pref.name)}</option>`)
    .join("");
}

async function loadManifest() {
  try {
    const res = await fetch(`./data/manifest.json?t=${Date.now()}`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifestCache = await res.json();
  } catch (e) {
    console.error(e);
    manifestCache = null;
  }
}

function buildStatusText({
  rowCount,
  elementLabel,
  prefName,
  observedLatestAt,
  displayDate,
  tablePath
}) {
  const parts = [];

  if (observedLatestAt) {
    parts.push(`実況基準時刻:${formatObservedAt(observedLatestAt)}`);
  } else if (manifestCache?.observedLatestAt) {
    parts.push(`実況基準時刻:${formatObservedAt(manifestCache.observedLatestAt)}`);
  } else if (manifestCache?.updatedAt) {
    parts.push(`更新:${formatObservedAt(manifestCache.updatedAt)}`);
  }

  if (displayDate) {
    parts.push(`実況判定日:${formatDisplayDate(displayDate)}`);
  } else if (manifestCache?.displayDate) {
    parts.push(`実況判定日:${formatDisplayDate(manifestCache.displayDate)}`);
  }

  if (typeof rowCount === "number") {
    parts.push(`地点数:${rowCount}`);
  }

  if (elementLabel) {
    parts.push(`要素:${elementLabel}`);
  }

  if (prefName) {
    parts.push(`都道府県:${prefName}`);
  }

  if (tablePath) {
    parts.push(`JSON:${tablePath}`);
  }

  return parts.join(" / ");
}

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

    for (let i = 0; i < 10; i += 1) {
      const r = row.ranks?.[i];
      const td = document.createElement("td");

      if (r) {
        const classes = ["rank-cell"];
        if (r.highlightLive) classes.push("live-in-rank");
        if (r.highlightWithinYear) classes.push("within-year");
        if (r.highlightLive && r.highlightWithinYear) classes.push("live-and-recent");

        td.className = classes.join(" ");
        td.innerHTML = `
          <div class="rank-value">${escapeHtml(String(r.value))}</div>
          <div class="rank-date">${renderDualLine(r.date)}</div>
        `;
      } else {
        td.className = "rank-cell";
        td.innerHTML = `
          <div class="rank-value">-</div>
          <div class="rank-date">-</div>
        `;
      }

      tr.appendChild(td);
    }

    tableBody.appendChild(tr);
  }
}

function sortLiveSummaryItems(items) {
  return [...items].sort((a, b) => {
    const oa = ELEMENT_ORDER.indexOf(a.elementKey);
    const ob = ELEMENT_ORDER.indexOf(b.elementKey);

    const aa = oa === -1 ? 999 : oa;
    const bb = ob === -1 ? 999 : ob;

    if (aa !== bb) return aa - bb;
    if ((a.rank ?? 999) !== (b.rank ?? 999)) return (a.rank ?? 999) - (b.rank ?? 999);
    return String(a.stationName || "").localeCompare(String(b.stationName || ""), "ja");
  });
}

function renderLiveSummaryColumn(title, data) {
  if (!data || data.length === 0) {
    return `
      <div class="live-col">
        <div class="live-col-title">${escapeHtml(title)}</div>
        <div class="live-empty">該当なし</div>
      </div>
    `;
  }

  return `
    <div class="live-col">
      <div class="live-col-title">${escapeHtml(title)}</div>
      <div class="live-list">
        ${data.map((item) => `
          <div class="live-card">
            <div class="live-card-top">
              <span class="live-rank">${escapeHtml(String(item.rank))}位</span>
              <span class="live-station">${escapeHtml(item.stationName || "-")}</span>
            </div>
            <div class="live-card-element">${escapeHtml(item.elementLabel || item.elementKey || "-")}</div>
            <div class="live-card-bottom">
              <span class="live-value">${escapeHtml(String(item.value ?? "-"))}</span>
              <span class="live-date">${escapeHtml(item.date || "-")}</span>
              <span class="live-month">${escapeHtml(item.monthLabel || "")}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function updateLiveRelatedBadges(hasItems) {
  const candidates = [
    "#liveSummaryBadge",
    "#liveRankBadge",
    "#rankInBadge",
    "#summaryHasRankBadge",
    "#liveTop10Badge",
    "#topRankUpdateBadge"
  ];

  candidates.forEach((selector) => {
    const el = qs(selector);
    if (!el) return;
    el.hidden = !hasItems;
    el.style.display = hasItems ? "" : "none";
  });

  const summarySection = qs("#liveSummarySection");
  if (summarySection) {
    summarySection.dataset.hasItems = hasItems ? "1" : "0";
  }
}

function renderLiveSummary(items, meta = {}) {
  const observedLatestAt = meta.observedLatestAt || manifestCache?.observedLatestAt || "";
  const displayDate = meta.displayDate || manifestCache?.displayDate || "";

  if (!items || items.length === 0) {
    updateLiveRelatedBadges(false);
    liveSummaryEl.innerHTML = `
      <div class="live-summary-meta">
        <div>実況基準時刻: ${escapeHtml(formatObservedAt(observedLatestAt))}</div>
        <div>実況判定日: ${escapeHtml(formatDisplayDate(displayDate))}</div>
      </div>
      <div class="live-summary-empty">
        現在、実況で10位以内に入っている項目はありません。
      </div>
    `;
    return;
  }

  updateLiveRelatedBadges(true);

  const sorted = sortLiveSummaryItems(items);
  const overall = sorted.filter((item) => item.monthLabel === "通年");
  const monthly = sorted.filter((item) => item.monthLabel !== "通年");

  liveSummaryEl.innerHTML = `
    <div class="live-summary-meta">
      <div>実況基準時刻: ${escapeHtml(formatObservedAt(observedLatestAt))}</div>
      <div>実況判定日: ${escapeHtml(formatDisplayDate(displayDate))}</div>
    </div>
    <div class="live-summary-grid">
      ${renderLiveSummaryColumn("通年", overall)}
      ${renderLiveSummaryColumn("当月", monthly)}
    </div>
  `;
}

async function loadLiveSummary(prefKey) {
  try {
    const res = await fetch(`./data/${prefKey}/live-summary.json?t=${Date.now()}`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    renderLiveSummary(data.items || [], data);
    return data;
  } catch (e) {
    console.error(e);
    updateLiveRelatedBadges(false);
    liveSummaryEl.innerHTML = `
      <div class="live-summary-error">実況一覧の読み込みに失敗しました。</div>
    `;
    return null;
  }
}

async function loadTable() {
  const prefMeta = getSelectedPrefMeta();
  const pref = prefSelect.value;
  const element = getSelectedElement();
  const month = monthSelect.value;
  const elementLabel = getSelectedElementLabel();
  const tablePath = `./data/${pref}/${element}-${month}.json`;

  await loadManifest();

  if (!prefMeta) {
    statusEl.textContent = "都道府県情報が見つかりません";
    tableBody.innerHTML = "";
    liveSummaryEl.innerHTML = `<div class="live-summary-error">実況一覧を表示できません。</div>`;
    return;
  }

  const liveData = await loadLiveSummary(pref);

  if (!prefMeta.stationsFile) {
    statusEl.textContent = buildStatusText({
      rowCount: 0,
      elementLabel,
      prefName: prefMeta.name,
      observedLatestAt: liveData?.observedLatestAt || manifestCache?.observedLatestAt || "",
      displayDate: liveData?.displayDate || manifestCache?.displayDate || "",
      tablePath
    }) + " / 未対応";
    tableBody.innerHTML = "";
    return;
  }

  statusEl.textContent = "読み込み中...";

  try {
    const res = await fetch(`${tablePath}?t=${Date.now()}`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    makeHeader();
    renderTable(data.rows || []);

    statusEl.textContent = buildStatusText({
      rowCount: data.rows?.length ?? 0,
      elementLabel,
      prefName: prefMeta.name,
      observedLatestAt: data.observedLatestAt || liveData?.observedLatestAt || manifestCache?.observedLatestAt || data.updatedAt || "",
      displayDate: data.displayDate || liveData?.displayDate || manifestCache?.displayDate || "",
      tablePath
    });
  } catch (e) {
    console.error(e);
    statusEl.textContent =
      buildStatusText({
        rowCount: 0,
        elementLabel,
        prefName: prefMeta.name,
        observedLatestAt: liveData?.observedLatestAt || manifestCache?.observedLatestAt || "",
        displayDate: liveData?.displayDate || manifestCache?.displayDate || "",
        tablePath
      }) + " / JSONの読み込みに失敗しました";
    tableBody.innerHTML = "";
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    loadTable().catch((err) => console.error(err));
  }, 10 * 60 * 1000);
}

async function init() {
  makeHeader();
  await initPrefectures();

  regionSelect.addEventListener("change", async () => {
    populatePrefectures();
    await loadTable();
  });

  prefSelect.addEventListener("change", loadTable);
  monthSelect.addEventListener("change", loadTable);

  qsa('input[name="element"]').forEach((el) => {
    el.addEventListener("change", loadTable);
  });

  await loadTable();
  startAutoRefresh();
}

init().catch((err) => {
  console.error(err);
  statusEl.textContent = "初期化に失敗しました";
});
