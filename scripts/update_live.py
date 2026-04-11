import os
from datetime import datetime

from weather_common import (
    ELEMENTS,
    MONTHS,
    JST,
    build_dir_manifest,
    ensure_dir,
    fetch_latest_time,
    fetch_today_live_extreme,
    load_prefecture_configs,
    merge_live,
    read_json_file,
    write_json,
)

# 基礎ランキングの置き場
BASE_DIR = "data_base"

# 公開用の表示データ置き場
PUBLIC_DIR = "data"

# まずは奈良県だけで試す
TARGET_PREF_KEYS = {"nara"}


def load_base_rows(pref_key: str, element_key: str, month: str):
    path = os.path.join(BASE_DIR, pref_key, f"{element_key}-{month}.json")
    if not os.path.exists(path):
        return None
    return read_json_file(path)


def build_public_row_from_base(base_row: dict) -> dict:
    return {
        "stationName": base_row.get("stationName", ""),
        "startDate": base_row.get("startDate", ""),
        "ranks": base_row.get("ranks", []),
    }


def main() -> None:
    ensure_dir(PUBLIC_DIR)

    prefectures = load_prefecture_configs()
    target_prefs = [p for p in prefectures if p["key"] in TARGET_PREF_KEYS]

    if not target_prefs:
        raise RuntimeError("TARGET_PREF_KEYS に一致する都道府県設定が見つかりません。")

    latest_obs_iso = fetch_latest_time()
    latest_dt = datetime.fromisoformat(
        latest_obs_iso.replace("Z", "+00:00")
    ).astimezone(JST)
    generated_iso = datetime.now(JST).isoformat()

    for pref in target_prefs:
        pref_key = pref["key"]
        pref_name = pref["name"]
        stations = pref["stations"]

        station_map = {s["stationName"]: s for s in stations}

        public_pref_dir = os.path.join(PUBLIC_DIR, pref_key)
        ensure_dir(public_pref_dir)

        for element_key, element_def in ELEMENTS.items():
            live_mode = element_def.get("live_mode")
            direction = element_def.get("direction")

            for month in MONTHS:
                base_data = load_base_rows(pref_key, element_key, month)
                if not base_data:
                    # data_base にこの要素・月の基礎ファイルが無ければ飛ばす
                    continue

                rows = []

                for base_row in base_data.get("rows", []):
                    station_name = base_row.get("stationName")
                    if not station_name:
                        continue

                    station = station_map.get(station_name)

                    # 設定に地点が無い場合は実況差し込みせず、そのまま出力
                    if not station:
                        rows.append(build_public_row_from_base(base_row))
                        continue

                    # live_mode 未定義の要素は実況差し込み対象外
                    if not live_mode:
                        rows.append(build_public_row_from_base(base_row))
                        continue

                    try:
                        live_info = fetch_today_live_extreme(
                            station["amedasCode"],
                            latest_dt,
                            live_mode,
                            month,
                        )

                        merged_ranks, entered_rank = merge_live(
                            base_row.get("ranks", []),
                            live_info,
                            direction,
                            latest_dt,
                        )

                        row = {
                            "stationName": station_name,
                            "startDate": base_row.get("startDate", ""),
                            "ranks": merged_ranks,
                        }

                        # デバッグしやすいように補助情報を付与
                        if entered_rank is not None:
                            row["liveEnteredRank"] = entered_rank

                        rows.append(row)

                    except Exception as err:
                        # 実況取得失敗でも基礎ランキングは表示させる
                        row = build_public_row_from_base(base_row)
                        row["liveError"] = str(err)
                        rows.append(row)

                output = {
                    "updatedAt": generated_iso,
                    "observedLatestAt": latest_obs_iso,
                    "prefecture": pref_name,
                    "element": element_key,
                    "month": month,
                    "rows": rows,
                }

                file_name = f"{element_key}-{month}.json"
                output_path = os.path.join(public_pref_dir, file_name)
                write_json(output_path, output)
                print(f"wrote: {output_path}")

    manifest = build_dir_manifest(PUBLIC_DIR, generated_iso, target_prefs)
    manifest["observedLatestAt"] = latest_obs_iso

    manifest_path = os.path.join(PUBLIC_DIR, "manifest.json")
    write_json(manifest_path, manifest)
    print(f"wrote: {manifest_path}")

    print("done live update for target prefectures")


if __name__ == "__main__":
    main()
