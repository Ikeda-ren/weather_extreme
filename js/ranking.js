import { LOW_IS_BETTER_KEYS, LIVE_SUMMARY_ORDER } from "./constants.js";
import { parseRankValue } from "./utils.js";

export function isLowBetter(elementKey) {
  return LOW_IS_BETTER_KEYS.has(elementKey);
}

export function judgeLiveRank(liveValue, row, elementKey) {
  if (!Number.isFinite(liveValue)) {
    return null;
  }

  const ranks = Array.isArray(row?.ranks) ? row.ranks : [];
  const parsed = ranks
    .map((rankItem, index) => ({
      index,
      value: parseRankValue(rankItem?.value),
    }))
    .filter((item) => Number.isFinite(item.value));

  if (parsed.length === 0) {
    return 1;
  }

  if (isLowBetter(elementKey)) {
    for (let i = 0; i < parsed.length; i += 1) {
      if (liveValue <= parsed[i].value) return i + 1;
    }
  } else {
    for (let i = 0; i < parsed.length; i += 1) {
      if (liveValue >= parsed[i].value) return i + 1;
    }
  }

  return parsed.length < 10 ? parsed.length + 1 : null;
}

export function decorateRowsWithLive(rows, stationIndex, liveValuesByCode, elementKey, supportMode) {
  return (rows || []).map((row) => {
    const station = stationIndex ? stationIndex(row.stationName) : null;
    const code = station?.code || null;
    const live = code ? liveValuesByCode?.[code] : null;

    const liveValue = live?.value;
    const insertionRank = Number.isFinite(liveValue)
      ? judgeLiveRank(liveValue, row, elementKey)
      : null;

    return {
      ...row,
      stationCode: code,
      liveCandidate: {
        supportMode,
        supported: supportMode !== "unsupported",
        value: liveValue,
        rank: insertionRank,
        observedAt: live?.observedAt || "",
        error: live?.error || "",
      },
    };
  });
}

export function buildLiveSummaryItems(rows, elementKey, elementLabel, month) {
  const items = [];

  for (const row of rows || []) {
    const live = row.liveCandidate;
    if (!live || !Number.isFinite(live.value) || !live.rank || live.rank > 10) continue;

    items.push({
      elementKey,
      elementLabel,
      stationName: row.stationName || "-",
      rank: live.rank,
      value: live.value,
      observedAt: live.observedAt || "",
      monthLabel: month === "all" ? "通年" : "当月",
      top1: live.rank === 1,
    });
  }

  items.sort((a, b) => {
    const orderA = LIVE_SUMMARY_ORDER.indexOf(a.elementKey);
    const orderB = LIVE_SUMMARY_ORDER.indexOf(b.elementKey);
    if (orderA !== orderB) return orderA - orderB;
    if (a.rank !== b.rank) return a.rank - b.rank;
    return String(a.stationName).localeCompare(String(b.stationName), "ja");
  });

  return items;
}

export function hasAnyRankIn(rows) {
  return (rows || []).some((row) => {
    const rank = row?.liveCandidate?.rank;
    return Number.isFinite(rank) && rank >= 1 && rank <= 10;
  });
}

export function hasAnyTop1(rows) {
  return (rows || []).some((row) => row?.liveCandidate?.rank === 1);
}
