#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
from datetime import datetime, timezone, timedelta, date
from pathlib import Path
from typing import Any

JST = timezone(timedelta(hours=9))


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def parse_manifest_month(manifest_path: Path) -> tuple[str | None, int]:
    """
    manifest.json から observedLatestAt / latest_time / base_time を見て、
    できればその月を返す。取れなければ現在JSTの月を返す。
    """
    now_jst = datetime.now(JST)
    default_obs = None
    default_month = now_jst.month

    if not manifest_path.exists():
        return default_obs, default_month

    try:
        manifest = load_json(manifest_path)
    except Exception:
        return default_obs, default_month

    candidates = [
        manifest.get("observedLatestAt"),
        manifest.get("observation_time"),
        manifest.get("latest_time"),
        manifest.get("base_time"),
    ]

    for value in candidates:
        if not value:
            continue
        try:
            # 末尾 Z 対応
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            dt_jst = dt.astimezone(JST) if dt.tzinfo else dt.replace(tzinfo=JST)
            return dt_jst.isoformat(), dt_jst.month
        except Exception:
            continue

    return default_obs, default_month


def parse_observed_date(observed_latest_at: str | None) -> date | None:
    """
    observedLatestAt の ISO 文字列から JST の日付を返す。
    """
    if not observed_latest_at:
        return None

    try:
        dt = datetime.fromisoformat(str(observed_latest_at).replace("Z", "+00:00"))
        dt_jst = dt.astimezone(JST) if dt.tzinfo else dt.replace(tzinfo=JST)
        return dt_jst.date()
    except Exception:
        return None


def parse_rank_date(date_str: Any) -> date | None:
    """
    '2026年4月4日（令和8年）' のような文字列から date を取り出す。
    """
    if not date_str:
        return None

    text = str(date_str)
    m = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日", text)
    if not m:
        return None

    try:
        y = int(m.group(1))
        mo = int(m.group(2))
        d = int(m.group(3))
        return date(y, mo, d)
    except Exception:
        return None


def build_element_map(elements_config: dict[str, Any]) -> list[tuple[str, str]]:
    result: list[tuple[str, str]] = []
    for group in elements_config.get("groups", []):
        for item in group.get("items", []):
            key = item.get("key")
            label = item.get("label")
            if key and label:
                result.append((key, label))
    return result


def extract_ranked_items(
    json_path: Path,
    element_key: str,
    element_label: str,
    *,
    target_observed_date: date | None,
    month_label: str | None = None,
) -> list[dict[str, Any]]:
    """
    rows[].ranks[] から
    - highlightLive == true
    - かつ rank の日付が observedLatestAt と同じ日
    のものだけを抜き出す。
    """
    if not json_path.exists():
        return []

    try:
        data = load_json(json_path)
    except Exception as e:
        print(f"[WARN] 読み込み失敗: {json_path} ({e})")
        return []

    results: list[dict[str, Any]] = []

    for row in data.get("rows", []):
        station_name = row.get("stationName", "")

        for rank_data in row.get("ranks", []):
            if rank_data.get("highlightLive") is not True:
                continue

            rank_date = parse_rank_date(rank_data.get("date"))

            # 観測日の解釈ができる場合は、同日のみ採用
            if target_observed_date is not None:
                if rank_date != target_observed_date:
                    continue

            item: dict[str, Any] = {
                "stationName": station_name,
                "elementKey": element_key,
                "elementLabel": element_label,
                "rank": rank_data.get("rank"),
                "value": rank_data.get("value"),
                "date": rank_data.get("date"),
            }

            if month_label is not None:
                item["monthLabel"] = month_label

            results.append(item)

    return results


def sort_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    要素順 → 地点順 → 順位順
    """
    return sorted(
        items,
        key=lambda x: (
            str(x.get("elementLabel", "")),
            str(x.get("stationName", "")),
            int(x.get("rank", 9999)) if str(x.get("rank", "")).isdigit() else 9999,
            float(x.get("value", 0)) if isinstance(x.get("value"), (int, float)) else 0,
        ),
    )


def build_live_summary_for_pref(
    repo_root: Path,
    pref_key: str,
    pref_name: str,
    element_pairs: list[tuple[str, str]],
    observed_latest_at: str | None,
    target_month: int,
) -> dict[str, Any]:
    annual_items: list[dict[str, Any]] = []
    monthly_items: list[dict[str, Any]] = []

    pref_data_dir = repo_root / "data" / pref_key
    month_label = f"{target_month}月"
    target_observed_date = parse_observed_date(observed_latest_at)

    for element_key, element_label in element_pairs:
        annual_path = pref_data_dir / f"{element_key}-all.json"
        monthly_path = pref_data_dir / f"{element_key}-{target_month}.json"

        annual_items.extend(
            extract_ranked_items(
                annual_path,
                element_key,
                element_label,
                target_observed_date=target_observed_date,
                month_label=None,
            )
        )

        monthly_items.extend(
            extract_ranked_items(
                monthly_path,
                element_key,
                element_label,
                target_observed_date=target_observed_date,
                month_label=month_label,
            )
        )

    summary = {
        "updatedAt": datetime.now(JST).isoformat(),
        "observedLatestAt": observed_latest_at,
        "prefecture": pref_name,
        "annualItems": sort_items(annual_items),
        "monthlyItems": sort_items(monthly_items),
    }
    return summary


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    prefectures_path = repo_root / "config" / "prefectures.json"
    elements_path = repo_root / "config" / "elements.json"
    manifest_path = repo_root / "data" / "manifest.json"

    prefectures_config = load_json(prefectures_path)
    elements_config = load_json(elements_path)

    observed_latest_at, target_month = parse_manifest_month(manifest_path)
    element_pairs = build_element_map(elements_config)
    prefectures = prefectures_config.get("prefectures", [])

    print(f"[INFO] 対象月: {target_month}月")
    print(f"[INFO] observedLatestAt: {observed_latest_at}")

    for pref in prefectures:
        pref_key = pref.get("key")
        pref_name = pref.get("name")
        if not pref_key or not pref_name:
            continue

        summary = build_live_summary_for_pref(
            repo_root=repo_root,
            pref_key=pref_key,
            pref_name=pref_name,
            element_pairs=element_pairs,
            observed_latest_at=observed_latest_at,
            target_month=target_month,
        )

        out_path = repo_root / "data" / pref_key / "live-summary.json"
        save_json(out_path, summary)

        print(
            f"[OK] {pref_name}: "
            f"annual={len(summary['annualItems'])}, "
            f"monthly={len(summary['monthlyItems'])} -> {out_path}"
        )


if __name__ == "__main__":
    main()
