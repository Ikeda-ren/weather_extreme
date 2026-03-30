const regionMap = {
  shiga: { code: "250000", name: "滋賀県", path: "data/shiga" },
  kyoto: { code: "260000", name: "京都府", path: "data/kyoto" },
  osaka: { code: "270000", name: "大阪府", path: "data/osaka" },
  hyogo: { code: "280000", name: "兵庫県", path: "data/hyogo" },
  nara: { code: "290000", name: "奈良県", path: "data/nara" },
  wakayama: { code: "300000", name: "和歌山県", path: "data/wakayama" }
};

const presetPairs = [
  { label: "滋賀・京都", left: "shiga", right: "kyoto" },
  { label: "大阪・兵庫", left: "osaka", right: "hyogo" },
  { label: "奈良・和歌山", left: "nara", right: "wakayama" }
];

let currentLeft = "nara";
let currentRight = "wakayama";
let displayMode = "pair";

function jmaLikeIcon(code, text = "") {
  const map = {
    "100": "☀",
    "101": "☀☁",
    "102": "☀☔",
    "103": "☀☃",
    "104": "☀⛄",
    "110": "☀☁",
    "111": "☀☁",
    "112": "☀☔",
    "113": "☀☔",
    "114": "☀⛄",
    "115": "☀⛄",
    "200": "☁",
    "201": "☁☀",
    "202": "☁☔",
    "203": "☁☔",
    "204": "☁☃",
    "205": "☁⛄",
    "206": "☁☔",
    "207": "☁☃",
    "208": "☁⛄",
    "209": "☁⚡",
    "210": "☁☀",
    "211": "☁☀",
    "212": "☁☔",
    "213": "☁☔",
    "214": "☁⛄",
    "215": "☁⛄",
    "300": "☔",
    "301": "☔☀",
    "302": "☔☁",
    "303": "☔☁",
    "304": "☔⛄",
    "306": "☔",
    "308": "⛈",
    "309": "☔⛄",
    "311": "☔☀",
    "313": "☔☁",
    "314": "☔☁",
    "315": "☔⛄",
    "400": "☃",
    "401": "☃☀",
    "402": "☃☁",
    "403": "☃☁",
    "405": "☃",
    "406": "☃☔",
    "407": "☃☔",
  };

  if (code && map[code]) return map[code];

  if (text.includes("晴")) return "☀";
  if (text.includes("曇")) return "☁";
  if (text.includes("雨")) return "☔";
  if (text.includes("雪")) return "☃";
  if (text.includes("雷")) return "⚡";
  return "○";
}

function normalizeBgColor(bgcolor) {
  if (!bgcolor) return "";
  const v = String(bgcolor).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
  if (/^[0-9a-fA-F]{6}$/.test(v)) return `#${v}`;
  if (/^[0-9a-fA-F]{3}$/.test(v)) return `#${v}`;
  return v;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function populateSelectors() {
  const left = document.getElementById("leftSelect");
  const right = document.getElementById("rightSelect");

  left.innerHTML = "";
  right.innerHTML = "";

  Object.entries(regionMap).forEach(([key, region]) => {
    const opt1 = document.createElement("option");
    opt1.value = key;
    opt1.textContent = region.name;
    left.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = key;
    opt2.textContent = region.name;
    right.appendChild(opt2);
  });

  left.value = currentLeft;
  right.value = currentRight;
}

function renderModeButtons() {
  const wrap = document.getElementById("modeButtons");
  wrap.innerHTML = "";

  const modes = [
    { key: "single", label: "1府県表示" },
    { key: "pair", label: "2府県表示" }
  ];

  modes.forEach(mode => {
    const btn = document.createElement("button");
    btn.textContent = mode.label;
    if (mode.key === displayMode) btn.classList.add("active");
    btn.addEventListener("click", () => {
      displayMode = mode.key;
      applyLayoutMode();
      renderModeButtons();
      init();
    });
    wrap.appendChild(btn);
  });
}

function renderPairButtons() {
  const wrap = document.getElementById("pairButtons");
  wrap.innerHTML = "";

  presetPairs.forEach(pair => {
    const btn = document.createElement("button");
    btn.textContent = pair.label;
    if (pair.left === currentLeft && pair.right === currentRight) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      currentLeft = pair.left;
      currentRight = pair.right;
      populateSelectors();
      renderPairButtons();
      init();
    });
    wrap.appendChild(btn);
  });
}

function applyLayoutMode() {
  document.body.classList.toggle("single-mode", displayMode === "single");
}

function applyManualSelection() {
  currentLeft = document.getElementById("leftSelect").value;
  currentRight = document.getElementById("rightSelect").value;
  renderPairButtons();
  init();
}

function swapRegions() {
  const temp = currentLeft;
  currentLeft = currentRight;
  currentRight = temp;
  populateSelectors();
  renderPairButtons();
  init();
}

function createCard(region) {
  const el = document.createElement("div");
  el.className = "card";
  el.id = `card-${region.code}`;

  el.innerHTML = `
    <h2>${region.name}</h2>
    <div class="time" id="time-${region.code}">更新時刻: -</div>

    <section class="section">
      <h3>天気</h3>
      <div id="weather-${region.code}" class="table-wrap">
        <div class="panel">読み込み中...</div>
      </div>
    </section>

    <section class="section">
      <h3>風・波</h3>
      <div id="windwave-${region.code}" class="table-wrap">
        <div class="panel">読み込み中...</div>
      </div>
    </section>

    <section class="section">
      <h3>降水確率</h3>
      <div id="pop-${region.code}" class="table-wrap">
        <div class="panel">読み込み中...</div>
      </div>
    </section>

    <section class="section">
      <h3>気温</h3>
      <div id="temp-${region.code}" class="table-wrap">
        <div class="panel">読み込み中...</div>
      </div>
    </section>

    <section class="section">
      <h3>天気概況</h3>
      <div id="overview-${region.code}" class="panel">読み込み中...</div>
    </section>

    <section class="section">
      <h3>気象台からのコメント</h3>
      <div id="comment-${region.code}" class="panel comment-panel">読み込み中...</div>
    </section>
  `;
  return el;
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return await res.json();
}

function buildHeaderCells(timeDefines, includeTime = false) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  return timeDefines.map(d => {
    const date = new Date(d);
    let cls = "";
    if (date.toDateString() === today.toDateString()) cls = "today";
    else if (date.toDateString() === tomorrow.toDateString()) cls = "tomorrow";

    const label = includeTime
      ? `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}時`
      : `${date.getMonth() + 1}/${date.getDate()}`;

    return `<th class="${cls}">${label}</th>`;
  }).join("");
}

function renderWeatherTable(code, data) {
  const el = document.getElementById(`weather-${code}`);
  if (!Array.isArray(data) || !data[0]?.timeSeries?.[0]) {
    el.innerHTML = `<div class="panel error">天気データを読み込めませんでした。</div>`;
    return;
  }

  const ts = data[0].timeSeries[0];
  let html = `<table><tr><th class="region-head">地域</th>${buildHeaderCells(ts.timeDefines)}</tr>`;

  ts.areas.forEach(area => {
    const weathers = area.weathers || [];
    const weatherCodes = area.weatherCodes || [];

    html += `<tr><th class="region-head">${area.area?.name ?? "-"}</th>`;

    weathers.forEach((w, i) => {
      const icon = jmaLikeIcon(weatherCodes[i], w);
      html += `
        <td class="weather-cell">
          <div class="weather-icon">${icon}</div>
          <div>${w || "-"}</div>
        </td>
      `;
    });

    html += `</tr>`;
  });

  html += `</table>`;
  el.innerHTML = html;
}

function renderWindWaveTable(code, data) {
  const el = document.getElementById(`windwave-${code}`);
  if (!Array.isArray(data) || !data[0]?.timeSeries?.[0]) {
    el.innerHTML = `<div class="panel error">風・波データを読み込めませんでした。</div>`;
    return;
  }

  const ts = data[0].timeSeries[0];
  let html = `<table><tr><th class="region-head">地域</th>${buildHeaderCells(ts.timeDefines)}</tr>`;

  ts.areas.forEach(area => {
    html += `<tr><th class="region-head">${area.area?.name ?? "-"}</th>`;
    const winds = area.winds || [];
    const waves = area.waves || [];
    const len = Math.max(ts.timeDefines.length, winds.length, waves.length);

    for (let i = 0; i < len; i++) {
      html += `
        <td>
          <div>風: ${winds[i] || "-"}</div>
          <div>波: ${waves[i] || "-"}</div>
        </td>
      `;
    }
    html += `</tr>`;
  });

  html += `</table>`;
  el.innerHTML = html;
}

function renderPopTable(code, data) {
  const el = document.getElementById(`pop-${code}`);
  if (!Array.isArray(data) || !data[0]?.timeSeries?.[1]) {
    el.innerHTML = `<div class="panel muted">降水確率データなし</div>`;
    return;
  }

  const ts = data[0].timeSeries[1];
  let html = `<table><tr><th>地域</th>${buildHeaderCells(ts.timeDefines, true)}</tr>`;

  ts.areas.forEach(area => {
    html += `<tr><th>${area.area?.name || "-"}</th>`;
    (area.pops || []).forEach(v => {
      html += `<td>${v || "-"}%</td>`;
    });
    html += `</tr>`;
  });

  html += `</table>`;
  el.innerHTML = html;
}

function renderTempTable(code, data) {
  const el = document.getElementById(`temp-${code}`);

  if (!Array.isArray(data) || !data[0]?.timeSeries) {
    el.innerHTML = `<div class="panel muted">気温データなし</div>`;
    return;
  }

  const tempSeries = data[0].timeSeries.find(ts =>
    Array.isArray(ts.areas) && ts.areas.some(a => Array.isArray(a.temps))
  );

  if (!tempSeries) {
    el.innerHTML = `<div class="panel muted">気温データなし</div>`;
    return;
  }

  const areas = tempSeries.areas || [];
  const times = tempSeries.timeDefines || [];

  if (!areas.length || !times.length) {
    el.innerHTML = `<div class="panel muted">気温データなし</div>`;
    return;
  }

  const labels = ["今日最低", "今日最高", "明日最低", "明日最高"];

  let html = `<table>
    <tr>
      <th>地域</th>
      <th>今日最低</th>
      <th>今日最高</th>
      <th>明日最低</th>
      <th>明日最高</th>
    </tr>`;

  areas.forEach(area => {
    const temps = area.temps || [];

    const values = [
      temps[0] ?? "-",
      temps[1] ?? "-",
      temps[2] ?? "-",
      temps[3] ?? "-"
    ];

    html += `<tr><th>${area.area?.name || "-"}</th>`;
    html += `<td class="temp-min">${values[0] !== "-" ? values[0] + "℃" : "-"}</td>`;
    html += `<td class="temp-max">${values[1] !== "-" ? values[1] + "℃" : "-"}</td>`;
    html += `<td class="temp-min">${values[2] !== "-" ? values[2] + "℃" : "-"}</td>`;
    html += `<td class="temp-max">${values[3] !== "-" ? values[3] + "℃" : "-"}</td>`;
    html += `</tr>`;
  });

  html += `</table>`;
  el.innerHTML = html;
}

function renderOverview(code, data) {
  const el = document.getElementById(`overview-${code}`);
  const timeEl = document.getElementById(`time-${code}`);

  if (!data || typeof data !== "object") {
    el.textContent = "天気概況データを読み込めませんでした。";
    return;
  }

  el.textContent = data.text || "データなし";

  if (data.reportDatetime) {
    timeEl.textContent = "更新時刻: " + new Date(data.reportDatetime).toLocaleString("ja-JP");
  }
}

function renderComment(code, data) {
  const el = document.getElementById(`comment-${code}`);
  if (!data || typeof data !== "object") {
    el.textContent = "コメントデータを読み込めませんでした。";
    return;
  }

  const textHtml = `<div class="comment-text">${escapeHtml(data.text || "コメントなし").replace(/\n/g, "<br>")}</div>`;

  let linksHtml = "";
  if (Array.isArray(data.links) && data.links.length) {
    linksHtml = `
      <div class="comment-links">
        <strong>関連リンク</strong>
        <ul>
          ${data.links.map(link => `
            <li>
              <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(link.label)}
              </a>
            </li>
          `).join("")}
        </ul>
      </div>
    `;
  }

  el.innerHTML = textHtml + linksHtml;

  const bg = normalizeBgColor(data.bgcolor);
  if (bg) el.style.backgroundColor = bg;
}

async function fetchRegion(regionKey) {
  const region = regionMap[regionKey];

  try {
    const [weather, overview, comment] = await Promise.all([
      fetchJson(`${region.path}/weather.json`),
      fetchJson(`${region.path}/overview.json`),
      fetchJson(`${region.path}/comment.json`)
    ]);

    renderWeatherTable(region.code, weather);
    renderWindWaveTable(region.code, weather);
    renderPopTable(region.code, weather);
    renderTempTable(region.code, weather);
    renderOverview(region.code, overview);
    renderComment(region.code, comment);
  } catch (err) {
    console.error(region.name, err);

    ["weather", "windwave", "pop", "temp"].forEach(id => {
      document.getElementById(`${id}-${region.code}`).innerHTML =
        `<div class="panel error">データ取得に失敗しました。</div>`;
    });

    document.getElementById(`overview-${region.code}`).textContent =
      "天気概況の取得に失敗しました。";

    document.getElementById(`comment-${region.code}`).textContent =
      "コメントの取得に失敗しました。";
  }
}

async function init() {
  const status = document.getElementById("status");
  const areas = document.getElementById("areas");

  status.textContent = "更新中...";
  areas.innerHTML = "";

  const leftRegion = regionMap[currentLeft];
  areas.appendChild(createCard(leftRegion));

  if (displayMode === "pair") {
    const rightRegion = regionMap[currentRight];
    areas.appendChild(createCard(rightRegion));
    await Promise.all([fetchRegion(currentLeft), fetchRegion(currentRight)]);
  } else {
    await fetchRegion(currentLeft);
  }

  status.textContent = "最終更新: " + new Date().toLocaleString("ja-JP");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

document.getElementById("applySelectionBtn").addEventListener("click", applyManualSelection);
document.getElementById("swapBtn").addEventListener("click", swapRegions);
document.getElementById("darkModeBtn").addEventListener("click", toggleDarkMode);
document.getElementById("refreshBtn").addEventListener("click", init);

window.addEventListener("load", () => {
  populateSelectors();
  renderModeButtons();
  renderPairButtons();
  applyLayoutMode();
  init();
});

setInterval(init, 300000);
