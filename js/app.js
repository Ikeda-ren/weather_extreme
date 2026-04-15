import {
  DEFAULT_ANNUAL_ELEMENT,
  DEFAULT_MONTH,
  DEFAULT_MONTHLY_ELEMENT,
  DEFAULT_PREF,
  DEFAULT_REGION,
} from "./constants.js";
import {
  findStationByRowName,
  getDefaultElementKey,
  getElementListByMonth,
  loadElements,
  loadManifest,
  loadPrefectures,
  loadStations,
  loadTable,
} from "./data-loader.js";
import {
  buildLiveValuesForStations,
  isLiveSupported,
} from "./live-source.js";
import {
  buildLiveSummaryItems,
  decorateRowsWithLive,
} from "./ranking.js";
import {
  makeTableHead,
  renderDebug,
  renderElementPanel,
  renderLiveSummary,
  renderStatus,
  renderTable,
} from "./renderers.js";
import { state } from "./state.js";
import { unique } from "./utils.js";

const STORAGE_KEYS = {
  region: "weather_extreme:last_region",
  pref: "weather_extreme:last_pref",
  month: "weather_extreme:last_month",
  element: "weather_extreme:last_element",
  enabledPrefs: "weather_extreme:enabled_prefs",
};

const prefButtons = document.getElementById("prefButtons");
const monthSelect = document.getElementById("monthSelect");
const elementPanel = document.getElementById("elementPanel");
const elementPanelToggle = document.getElementById("elementPanelToggle");

const summaryHeader = document.getElementById("summaryHeader");
const summaryChevron = document.getElementById("summaryChevron");
const liveSummaryBody = document.getElementById("liveSummaryBody");

const rankInBadge = document.getElementById("rankInBadge");
const topRankAlert = document.getElementById("topRankAlert");
const observedLatestAtEl = document.getElementById("observedLatestAt");

const tableTitleEl = document.getElementById("tableTitle");
const statusTextEl = document.getElementById("statusText");
const rankTableHead = document.getElementById("rankTableHead");
const rankTableBody = document.getElementById("rankTableBody");
const debugGrid = document.getElementById("debugGrid");

const customizeButton = document.getElementById("customizeButton");
const customModal = document.getElementById("customModal");
const customCloseButton = document.getElementById("customCloseButton");
const customCancelButton = document.getElementById("customCancelButton");
const customSaveButton = document.getElementById("customSaveButton");
const customRegionTabs = document.getElementById("customRegionTabs");
const customPrefChecklist = document.getElementById("customPrefChecklist");
const selectAllPrefsButton = document.getElementById("selectAllPrefsButton");
const clearAllPrefsButton = document.getElementById("clearAllPrefsButton");

let currentRegion = "";
let currentPrefKey = "";
let currentElementKey = "";
let currentMonth = DEFAULT_MONTH;

let enabledPrefKeys = new Set();
let customEditingRegion = "";

async function main() {
  try {
    await Promise.all([
      loadPrefectures(),
      loadElements(),
      loadManifest(),
    ]);

    makeTableHead(rankTableHead);

    initControls();
    bindEvents();

    await refresh();
  } catch (error) {
    console.error(error);
    rankTableBody.innerHTML = `
      <tr>
        <td class="message-cell" colspan="11">
          初期化に失敗しました: ${error.message || String(error)}
        </td>
      </tr>
    `;
  }
}

function readStorage(key, fallback = "") {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // no-op
  }
}

function getAllPrefKeys() {
  return (state.prefectures || []).map((item) => item.key);
}

function loadEnabledPrefKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.enabledPrefs);
    if (!raw) {
      enabledPrefKeys = new Set(getAllPrefKeys());
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      enabledPrefKeys = new Set(getAllPrefKeys());
      return;
    }

    const validSet = new Set(getAllPrefKeys());
    enabledPrefKeys = new Set(parsed.filter((key) => validSet.has(key)));

    if (enabledPrefKeys.size === 0) {
      enabledPrefKeys = new Set(getAllPrefKeys());
    }
  } catch {
    enabledPrefKeys = new Set(getAllPrefKeys());
  }
}

function saveEnabledPrefKeys() {
  writeStorage(STORAGE_KEYS.enabledPrefs, JSON.stringify([...enabledPrefKeys]));
}

function initControls() {
  loadEnabledPrefKeys();

  currentRegion = getInitialRegion();
  currentPrefKey = getInitialPrefKey(currentRegion);
  currentMonth = getInitialMonth();
  currentElementKey = getInitialElementKey(currentMonth);

  monthSelect.value = currentMonth;

  renderPrefButtons();
  renderElementButtons();

  elementPanel.hidden = true;
  elementPanelToggle.textContent = "要素選択を開く";
  elementPanelToggle.setAttribute("aria-expanded", "false");

  setSummaryExpanded(false);

  rankInBadge.hidden = true;
  topRankAlert.hidden = true;
  observedLatestAtEl.textContent = "読み込み待ち";
}

function bindEvents() {
  prefButtons.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-pref-key]");
    if (!button) return;

    const nextPrefKey = button.dataset.prefKey || "";
    if (!nextPrefKey || nextPrefKey === currentPrefKey) return;

    currentPrefKey = nextPrefKey;
    const prefMeta = getPrefMetaByKey(currentPrefKey);
    if (prefMeta?.region) {
      currentRegion = prefMeta.region;
      writeStorage(STORAGE_KEYS.region, currentRegion);
    }
    writeStorage(STORAGE_KEYS.pref, currentPrefKey);

    renderPrefButtons();
    await refresh();
  });

  monthSelect.addEventListener("change", async () => {
    currentMonth = monthSelect.value;
    writeStorage(STORAGE_KEYS.month, currentMonth);

    currentElementKey = getInitialElementKey(currentMonth);
    writeStorage(STORAGE_KEYS.element, currentElementKey);

    renderElementButtons();
    await refresh();
  });

  elementPanel.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-element-key]");
    if (!button) return;

    currentElementKey = button.dataset.elementKey || "";
    writeStorage(STORAGE_KEYS.element, currentElementKey);

    renderElementButtons();
    await refresh();
  });

  elementPanelToggle.addEventListener("click", () => {
    const nextHidden = !elementPanel.hidden;
    elementPanel.hidden = nextHidden;
    elementPanelToggle.textContent = nextHidden ? "要素選択を開く" : "要素選択を閉じる";
    elementPanelToggle.setAttribute("aria-expanded", String(!nextHidden));
  });

  summaryHeader.addEventListener("click", () => {
    setSummaryExpanded(liveSummaryBody.hidden);
  });

  summaryHeader.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSummaryExpanded(liveSummaryBody.hidden);
    }
  });

  customizeButton.addEventListener("click", () => {
    openCustomModal();
  });

  customCloseButton.addEventListener("click", closeCustomModal);
  customCancelButton.addEventListener("click", closeCustomModal);

  customModal.addEventListener("click", (event) => {
    if (event.target === customModal) {
      closeCustomModal();
    }
  });

  customRegionTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-custom-region]");
    if (!button) return;

    customEditingRegion = button.dataset.customRegion || "";
    renderCustomRegionTabs();
    renderCustomPrefChecklist();
  });

  selectAllPrefsButton.addEventListener("click", () => {
    const prefs = getPrefsByRegion(customEditingRegion);
    prefs.forEach((item) => enabledPrefKeys.add(item.key));
    renderCustomPrefChecklist();
  });

  clearAllPrefsButton.addEventListener("click", () => {
    const prefs = getPrefsByRegion(customEditingRegion);
    prefs.forEach((item) => enabledPrefKeys.delete(item.key));
    renderCustomPrefChecklist();
  });

  customPrefChecklist.addEventListener("change", (event) => {
    const input = event.target.closest("[data-pref-check]");
    if (!input) return;

    const prefKey = input.dataset.prefCheck || "";
    if (!prefKey) return;

    if (input.checked) {
      enabledPrefKeys.add(prefKey);
    } else {
      enabledPrefKeys.delete(prefKey);
    }
  });

  customSaveButton.addEventListener("click", async () => {
    ensureAtLeastOneEnabledPref();

    const best = getBestRegionAndPref();
    currentRegion = best.region;
    currentPrefKey = best.prefKey;

    writeStorage(STORAGE_KEYS.region, currentRegion);
    writeStorage(STORAGE_KEYS.pref, currentPrefKey);
    saveEnabledPrefKeys();

    renderPrefButtons();
    closeCustomModal();
    await refresh();
  });
}

function setSummaryExpanded(expanded) {
  liveSummaryBody.hidden = !expanded;
  summaryHeader.setAttribute("aria-expanded", String(expanded));
  summaryChevron.classList.toggle("expanded", expanded);
}

function getRegions() {
  return [...new Set((state.prefectures || []).map((item) => item.region).filter(Boolean))];
}

function getPrefsByRegion(region) {
  return (state.prefectures || []).filter((item) => item.region === region);
}

function getVisiblePrefsByRegion(region) {
  return getPrefsByRegion(region).filter((item) => enabledPrefKeys.has(item.key));
}

function getPrefMetaByKey(prefKey) {
  return (state.prefectures || []).find((item) => item.key === prefKey) || null;
}

function getInitialRegion() {
  const regions = getRegions();
  const savedRegion = readStorage(STORAGE_KEYS.region);
  if (savedRegion && getVisiblePrefsByRegion(savedRegion).length > 0) {
    return savedRegion;
  }

  if (regions.includes(DEFAULT_REGION) && getVisiblePrefsByRegion(DEFAULT_REGION).length > 0) {
    return DEFAULT_REGION;
  }

  const fallbackRegion = regions.find((region) => getVisiblePrefsByRegion(region).length > 0);
  return fallbackRegion || regions[0] || "";
}

function getInitialPrefKey(region) {
  const visiblePrefs = getVisiblePrefsByRegion(region);
  const savedPref = readStorage(STORAGE_KEYS.pref);

  if (savedPref && visiblePrefs.some((item) => item.key === savedPref)) {
    return savedPref;
  }
  if (visiblePrefs.some((item) => item.key === DEFAULT_PREF)) {
    return DEFAULT_PREF;
  }
  return visiblePrefs[0]?.key || "";
}

function getBestRegionAndPref() {
  const regions = getRegions();

  if (currentRegion) {
    const visiblePrefs = getVisiblePrefsByRegion(currentRegion);
    if (visiblePrefs.length > 0) {
      if (visiblePrefs.some((item) => item.key === currentPrefKey)) {
        return { region: currentRegion, prefKey: currentPrefKey };
      }
      return { region: currentRegion, prefKey: visiblePrefs[0].key };
    }
  }

  for (const region of regions) {
    const visiblePrefs = getVisiblePrefsByRegion(region);
    if (visiblePrefs.length > 0) {
      return { region, prefKey: visiblePrefs[0].key };
    }
  }

  return { region: regions[0] || "", prefKey: getPrefsByRegion(regions[0] || "")[0]?.key || "" };
}

function ensureAtLeastOneEnabledPref() {
  if (enabledPrefKeys.size > 0) return;
  enabledPrefKeys = new Set(getAllPrefKeys());
}

function getInitialMonth() {
  const savedMonth = readStorage(STORAGE_KEYS.month, DEFAULT_MONTH);
  const allowed = new Set(["all", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);
  return allowed.has(savedMonth) ? savedMonth : DEFAULT_MONTH;
}

function getCurrentElementList(month = currentMonth) {
  return getElementListByMonth(month, state.elements);
}

function getInitialElementKey(month = currentMonth) {
  const list = getCurrentElementList(month);
  if (!list.length) return "";

  const savedElement = readStorage(STORAGE_KEYS.element);
  if (savedElement && list.some((item) => item.key === savedElement)) {
    return savedElement;
  }

  const defaultKey =
    getDefaultElementKey(month, state.elements) ||
    (month === "all" ? DEFAULT_ANNUAL_ELEMENT : DEFAULT_MONTHLY_ELEMENT);

  return list.some((item) => item.key === defaultKey)
    ? defaultKey
    : list[0].key;
}

function getCurrentPrefMeta() {
  return getPrefMetaByKey(currentPrefKey);
}

function getCurrentElementMeta() {
  return getCurrentElementList().find((item) => item.key === currentElementKey) || null;
}

function renderPrefButtons() {
  const prefList = getVisiblePrefsByRegion(currentRegion);

  if (!prefList.length) {
    prefButtons.innerHTML = `<div class="empty-message">表示対象の都道府県がありません。カスタムから設定してください。</div>`;
    return;
  }

  prefButtons.innerHTML = prefList
    .map((item) => `
      <button
        type="button"
        class="pref-button ${item.key === currentPrefKey ? "active" : ""}"
        data-pref-key="${item.key}"
      >
        ${item.name}
      </button>
    `)
    .join("");
}

function renderElementButtons() {
  renderElementPanel(elementPanel, getCurrentElementList(), currentElementKey);
}

function openCustomModal() {
  customEditingRegion = currentRegion || getRegions()[0] || "";
  renderCustomRegionTabs();
  renderCustomPrefChecklist();
  customModal.hidden = false;
}

function closeCustomModal() {
  customModal.hidden = true;
}

function renderCustomRegionTabs() {
  const regions = getRegions();
  customRegionTabs.innerHTML = regions
    .map((region) => `
      <button
        type="button"
        class="region-tab ${region === customEditingRegion ? "active" : ""}"
        data-custom-region="${region}"
      >
        ${region}
      </button>
    `)
    .join("");
}

function renderCustomPrefChecklist() {
  const prefs = getPrefsByRegion(customEditingRegion);
  customPrefChecklist.innerHTML = prefs
    .map((item) => `
      <label class="pref-check-item">
        <input
          type="checkbox"
          data-pref-check="${item.key}"
          ${enabledPrefKeys.has(item.key) ? "checked" : ""}
        />
        <span>${item.name}</span>
      </label>
    `)
    .join("");
}

function pickLatestObservedAt(latestObservationTime, liveValuesByCode) {
  if (latestObservationTime) return latestObservationTime;

  const observedList = Object.values(liveValuesByCode || {})
    .map((item) => item?.observedAt || "")
    .filter(Boolean)
    .sort();

  return observedList.length ? observedList[observedList.length - 1] : "";
}

async function refresh() {
  const prefMeta = getCurrentPrefMeta();
  const elementMeta = getCurrentElementMeta();

  if (!prefMeta || !elementMeta) {
    rankTableBody.innerHTML = `
      <tr>
        <td class="message-cell" colspan="11">都道府県または要素が未選択です。</td>
      </tr>
    `;
    rankInBadge.hidden = true;
    topRankAlert.hidden = true;
    observedLatestAtEl.textContent = "実況未取得";
    return;
  }

  state.debug.selectedRegion = currentRegion;
  state.debug.selectedPrefKey = prefMeta.key;
  state.debug.selectedPrefName = prefMeta.name;
  state.debug.selectedMonth = currentMonth;
  state.debug.selectedElementKey = elementMeta.key;
  state.debug.selectedElementLabel = elementMeta.label || elementMeta.shortLabel || elementMeta.key;
  state.debug.pointFetchCount = 0;
  state.debug.liveError = "";

  rankTableBody.innerHTML = `
    <tr>
      <td class="message-cell" colspan="11">読み込み中です…</td>
    </tr>
  `;

  try {
    const [{ index }, tableData] = await Promise.all([
      loadStations(prefMeta.key),
      loadTable(prefMeta.key, elementMeta.key, currentMonth),
    ]);

    const rows = tableData.rows || [];
    state.debug.tableRowCount = rows.length;

    const neededStationCodes = unique(
      rows
        .map((row) => findStationByRowName(row.stationName, index)?.code || null)
        .filter(Boolean)
    );

    let liveSupportMode = "unsupported";
    let latestObservationTime = "";
    let liveValuesByCode = {};

    if (isLiveSupported(elementMeta.key, currentMonth) && neededStationCodes.length > 0) {
      try {
        const liveBundle = await buildLiveValuesForStations({
          stationCodes: neededStationCodes,
          elementKey: elementMeta.key,
          month: currentMonth,
        });

        latestObservationTime = liveBundle.latestIso || "";
        liveValuesByCode = liveBundle.valuesByCode || {};
        liveSupportMode = liveBundle.support || "supported";
      } catch (error) {
        liveSupportMode = "error";
        state.debug.liveError = error.message || String(error);
        liveValuesByCode = {};
        latestObservationTime = "";
      }
    }

    latestObservationTime = pickLatestObservedAt(latestObservationTime, liveValuesByCode);

    state.debug.latestObservationTime = latestObservationTime;
    state.debug.liveSupported = liveSupportMode;

    const decoratedRows = decorateRowsWithLive(
      rows,
      (rowStationName) => findStationByRowName(rowStationName, index),
      liveValuesByCode,
      elementMeta.key,
      liveSupportMode
    );

    const fullLabel = elementMeta.label || elementMeta.shortLabel || elementMeta.key;

    const annualSummary = currentMonth === "all"
      ? buildLiveSummaryItems(
          decoratedRows,
          elementMeta.key,
          fullLabel,
          "all"
        )
      : [];

    const monthlySummary = currentMonth === "all"
      ? []
      : buildLiveSummaryItems(
          decoratedRows,
          elementMeta.key,
          fullLabel,
          currentMonth
        );

    state.debug.summaryItemCount = annualSummary.length + monthlySummary.length;

    renderTable(rankTableBody, decoratedRows);
    renderLiveSummary(liveSummaryBody, annualSummary, monthlySummary);
    renderStatus({
      tableTitleEl,
      statusTextEl,
      observedLatestAtEl,
      prefName: prefMeta.name,
      month: currentMonth,
      elementLabel: fullLabel,
      rowCount: rows.length,
      latestObservationTime,
    });

    const totalSummaryCount = annualSummary.length + monthlySummary.length;
    const hasTop1Summary =
      annualSummary.some((item) => item.rank === 1) ||
      monthlySummary.some((item) => item.rank === 1);

    if (totalSummaryCount === 0) {
      rankInBadge.hidden = true;
      topRankAlert.hidden = true;
    } else if (hasTop1Summary) {
      rankInBadge.hidden = true;
      topRankAlert.hidden = false;
    } else {
      rankInBadge.hidden = false;
      topRankAlert.hidden = true;
    }

    renderDebug(debugGrid, state.debug);
  } catch (error) {
    console.error(error);
    rankTableBody.innerHTML = `
      <tr>
        <td class="message-cell" colspan="11">表示に失敗しました: ${error.message || String(error)}</td>
      </tr>
    `;
    state.debug.liveError = error.message || String(error);
    rankInBadge.hidden = true;
    topRankAlert.hidden = true;
    observedLatestAtEl.textContent = "実況未取得";
    renderDebug(debugGrid, state.debug);
  }
}

main();
