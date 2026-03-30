const prefSelect = document.getElementById("prefSelect");
const elementSelect = document.getElementById("elementSelect");
const monthSelect = document.getElementById("monthSelect");
const loadBtn = document.getElementById("loadBtn");
const statusEl = document.getElementById("status");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");

/*
  まずは奈良県だけの最小版。
  後で地点を増やすときは stationsByPref の配列に追加していく。
*/
const stationsByPref = {
  "奈良県": [
    {
      stationName: "奈良",
      precNo: "64",
      blockNo: "47780",
      amedasCode: "64036",
      rankView: "h0"
    }
  ]
};

const elementDefs = {
  dailyMaxTemp: {
    labelIncludes: ["日最高気温", "最高気温"],
    direction: "desc",
    liveType: "temp"
  },
  dailyMinTemp: {
    labelIncludes: ["日最低気温", "最低気温"],
    direction: "asc",
    liveType: "temp"
  }
};

function initPrefOptions() {
  const prefs = Object.keys(stationsByPref);
  prefSelect.innerHTML = prefs.map(pref => `<option value="${pref}">${pref}</option>`).join("");
}

function makeHeader() {
  const cols = ["地点名 / 観測開始"];
  for (let i = 1; i <= 10; i++) cols.push(`${i}位`);
  tableHead.innerHTML = `
    <tr>
      ${cols.map((c, i) => `<th class="${i === 0 ? "station-col" : ""}">${c}</th>`).join("")}
    </tr>
  `;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatYmd(date) {
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
}

function normalizeMonth(month) {
  return month === "all" ? "" : month;
}

function buildRankUrl(station, month) {
  const mm = normalizeMonth(month);
  return `https://www.data.jma.go.jp/stats/etrn/view/rank_s.php?prec_no=${station.precNo}&block_no=${station.blockNo}&year=&month=${mm}&day=&view=${station.rankView}`;
}

/*
  公開プロキシ経由で取得
  失敗時に備えて複数候補を順に試す
*/
async function fetchViaProxyText(url) {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`
  ];

  let lastError = null;
  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("proxy fetch failed");
}

async function fetchViaProxyJson(url) {
  const text = await fetchViaProxyText(url);
  return JSON.parse(text);
}

function parseHtml(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

function extractStartDate(text) {
  const m = text.match(/(\d{4}\/\d{1,2})/);
  return m ? m[1] : "";
}

function parseValueFromText(text) {
  const m = text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parseDateFromText(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();

  let m = cleaned.match(/(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})/);
  if (m) {
    return `${m[1]}/${pad2(m[2])}/${pad2(m[3])}`;
  }

  m = cleaned.match(/(\d{1,2})\/(\d{1,2})/);
  if (m) {
    return `----/${pad2(m[1])}/${pad2(m[2])}`;
  }

  return "";
}

function sortRecords(records, direction) {
  return [...records].sort((a, b) => {
    if (a.value !== b.value) {
      return direction === "desc" ? b.value - a.value : a.value - b.value;
    }

    const ad = normalizeSortDate(a.date);
    const bd = normalizeSortDate(b.date);
    return bd - ad;
  });
}

function normalizeSortDate(dateStr) {
  if (!dateStr) return new Date("1900-01-01").getTime();
  if (dateStr.startsWith("----/")) {
    const mmdd = dateStr.replace("----/", "");
    return new Date(`2000/${mmdd}`).getTime();
  }
  return new Date(dateStr.replace(/\//g, "-")).getTime();
}

function withinOneYear(dateStr) {
  if (!dateStr || dateStr.startsWith("----/")) return false;
  const d = new Date(dateStr.replace(/\//g, "-"));
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return diff >= 0 && diff <= 365 * 24 * 60 * 60 * 1000;
}

/*
  rank_s.php のHTMLから対象要素の行を探す
  気象庁の表構造は少し揺れることがあるので、
  かなり緩めに拾う
*/
function parseRankPage(html, elementKey) {
  const doc = parseHtml(html);
  const def = elementDefs[elementKey];

  const rows = Array.from(doc.querySelectorAll("tr"));
  let targetRow = null;

  for (const tr of rows) {
    const text = tr.textContent.replace(/\s+/g, " ").trim();
    const hit = def.labelIncludes.some(label => text.includes(label));
    if (hit) {
      targetRow = tr;
      break;
    }
  }

  if (!targetRow) return null;

  const rowText = targetRow.textContent.replace(/\s+/g, " ").trim();
  const startDate = extractStartDate(rowText);

  const cells = Array.from(targetRow.querySelectorAll("td"));
  const records = [];

  for (const td of cells) {
    const text = td.textContent.replace(/\s+/g, " ").trim();
    const value = parseValueFromText(text);
    const date = parseDateFromText(text);

    if (value !== null && date) {
      records.push({ value, date });
    }
  }

  const sorted = sortRecords(records, def.direction).slice(0, 10);

  if (!sorted.length) return null;

  return {
    startDate,
    records: sorted.map((r, i) => ({
      rank: i + 1,
      value: r.value,
      date: r.date
    }))
  };
}

async function fetchLatestAmedasTime() {
  const text = await fetchViaProxyText("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt");
  return text.trim();
}

function toMapTimeKey(isoText) {
  const d = new Date(isoText);
  return [
    d.getFullYear(),
    pad2(d.getMonth() + 1),
    pad2(d.getDate()),
    pad2(d.getHours()),
    pad2(d.getMinutes()),
    pad2(d.getSeconds())
  ].join("");
}

async function fetchLatestMapData() {
  const latest = await fetchLatestAmedasTime();
  const key = toMapTimeKey(latest);
  const url = `https://www.jma.go.jp/bosai/amedas/data/map/${key}.json`;
  const json = await fetchViaProxyJson(url);
  return { latest, json };
}

function pickLiveValue(mapJson, amedasCode, liveType) {
  const item = mapJson[String(amedasCode)];
  if (!item) return null;

  if (liveType === "temp") {
    if (!item.temp || item.temp[0] == null) return null;
    return Number(item.temp[0]);
  }

  return null;
}

function mergeLiveIntoRanks(records, liveValue, direction, todayStr) {
  if (liveValue == null) {
    return records.map(r => ({
      ...r,
      highlightLive: false,
      highlightWithinYear: withinOneYear(r.date)
    }));
  }

  const merged = [...records, { value: liveValue, date: todayStr, isLive: true }];
  const sorted = sortRecords(merged, direction).slice(0, 10);

  return sorted.map((r, i) => ({
    rank: i + 1,
    value: r.value,
    date: r.date,
    highlightLive: !!r.isLive,
    highlightWithinYear: withinOneYear(r.date)
  }));
}

function renderTable(rows) {
  tableBody.innerHTML = "";

  for (const row of rows) {
    const tr = document.createElement("tr");

    const stationTd = document.createElement("td");
    stationTd.className = "station-col";
    stationTd.innerHTML = `
      <div class="station-name">${escapeHtml(row.stationName)}</div>
      <div class="station-start">観測開始: ${escapeHtml(row.startDate || "-")}</div>
    `;
    tr.appendChild(stationTd);

    for (let i = 0; i < 10; i++) {
      const r = row.ranks[i];
      const td = document.createElement("td");

      if (r) {
        const classes = ["rank-cell"];
        if (r.highlightLive) classes.push("live-in-rank");
        if (r.highlightWithinYear) classes.push("within-year");
        td.className = classes.join(" ");

        td.innerHTML = `
          <div class="value">${escapeHtml(String(r.value))}</div>
          <div class="date">${escapeHtml(r.date || "-")}</div>
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

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadTable() {
  const pref = prefSelect.value;
  const elementKey = elementSelect.value;
  const month = monthSelect.value;
  const stations = stationsByPref[pref] || [];
  const def = elementDefs[elementKey];

  statusEl.textContent = "読み込み中...";
  tableBody.innerHTML = "";

  try {
    const { latest, json: mapJson } = await fetchLatestMapData();
    const todayStr = formatYmd(new Date());
    const rows = [];

    for (const station of stations) {
      try {
        const rankUrl = buildRankUrl(station, month);
        const html = await fetchViaProxyText(rankUrl);
        const parsed = parseRankPage(html, elementKey);

        // 観測要素がない地点は除外
        if (!parsed || !parsed.records.length) continue;

        const liveValue = pickLiveValue(mapJson, station.amedasCode, def.liveType);
        const ranks = mergeLiveIntoRanks(parsed.records, liveValue, def.direction, todayStr);

        rows.push({
          stationName: station.stationName,
          startDate: parsed.startDate,
          ranks
        });
      } catch (e) {
        console.error(`station failed: ${station.stationName}`, e);
      }
    }

    renderTable(rows);
    statusEl.textContent = `更新: ${latest} / 地点数: ${rows.length}`;
  } catch (e) {
    console.error(e);
    statusEl.textContent = "読み込みに失敗しました。プロキシ制限の可能性があります。";
  }
}

makeHeader();
initPrefOptions();
loadBtn.addEventListener("click", loadTable);
loadTable();

/*
  10分値は随時更新したいとのことなので、
  まずは1分ごとに再取得
*/
setInterval(loadTable, 60 * 1000);
