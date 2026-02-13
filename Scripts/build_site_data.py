#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATA_DIR = REPO_ROOT / "Data"
SITE_DATA_DIR = REPO_ROOT / "site" / "assets" / "records"


def normalize_state(name: str) -> str:
    value = name.strip().upper()
    value = value.replace(".", "")
    value = value.replace("-", " ")
    value = re.sub(r"\s+", " ", value).strip()

    special_map = {
        "NEW YORK STATE": "NEW YORK",
        "NEW YORK CITY": "NEW YORK",
    }
    return special_map.get(value, value)


def normalize_text(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    value = normalize_text(value)
    value = re.sub(r"\s+", "-", value)
    return value.strip("-")


def split_name_desc(value: str) -> tuple[str, str]:
    value = value.strip()
    em_dash = "\u2014"
    if em_dash in value:
        name, desc = value.split(em_dash, 1)
        return name.strip(), desc.strip()

    match = re.search(r"\.\s+[A-Z][a-z]", value)
    if match:
        idx = match.start()
        name = value[:idx].strip().rstrip(".")
        desc = value[idx + 1 :].strip()
        return name, desc

    return value, ""


def read_people(path: Path) -> list[dict[str, str]]:
    people: list[dict[str, str]] = []
    seen: dict[str, int] = {}

    with path.open(encoding="utf-8") as handle:
        header = handle.readline()
        if not header:
            return people

        for line in handle:
            line = line.strip()
            if not line:
                continue
            parts = [part.strip() for part in line.split("|")]
            if len(parts) >= 4:
                state = parts[0]
                city = parts[1]
                name = parts[2]
                desc = "|".join(parts[3:]).strip()
            elif len(parts) == 3:
                state = parts[0]
                city = parts[1]
                name, desc = split_name_desc(parts[2])
            else:
                continue

            base_slug = slugify(f"{name}-{city}-{state}") or "entry"
            count = seen.get(base_slug, 0) + 1
            seen[base_slug] = count
            entry_id = base_slug if count == 1 else f"{base_slug}-{count}"

            people.append(
                {
                    "id": entry_id,
                    "name": name,
                    "state": state,
                    "city": city,
                    "desc": desc,
                    "name_norm": normalize_text(name),
                    "state_norm": normalize_text(state),
                    "city_norm": normalize_text(city),
                    "desc_norm": normalize_text(desc),
                }
            )

    return people


def read_state_totals(path: Path) -> dict[str, int]:
    counts: dict[str, int] = {}
    in_state_section = False

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped:
            if in_state_section:
                break
            continue

        lower = stripped.lower()
        if lower == "counts by state":
            in_state_section = True
            continue
        if lower.startswith("counts by state and city"):
            break
        if not in_state_section:
            continue
        if ":" not in stripped:
            continue

        state_part, _, count_part = stripped.partition(":")
        state = normalize_state(state_part)
        try:
            count = int(count_part.strip())
        except ValueError:
            continue
        counts[state] = count

    return counts


def read_state_city_counts(path: Path, totals: dict[str, int]) -> dict[str, list[dict[str, int]]]:
    state_data: dict[str, dict[str, object]] = {}
    in_section = False
    current_state: str | None = None

    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        if line.strip().lower() == "counts by state and city":
            in_section = True
            continue
        if not in_section:
            continue

        if line.startswith(" "):
            if current_state is None:
                continue
            stripped = line.strip()
            if ":" not in stripped:
                continue
            city_part, _, count_part = stripped.partition(":")
            city = city_part.strip()
            try:
                count = int(count_part.strip())
            except ValueError:
                continue
            state_data[current_state]["cities"].append({"city": city, "count": count})
        else:
            current_state = normalize_state(line.strip())
            state_data[current_state] = {"state": current_state, "cities": []}

    states: list[dict[str, object]] = []
    for state, total in totals.items():
        entry = state_data.get(state, {"state": state, "cities": []})
        entry["count"] = total
        states.append(entry)

    for entry in states:
        entry["cities"] = sorted(
            entry["cities"], key=lambda item: (-item["count"], item["city"])
        )

    states.sort(key=lambda item: item["state"])
    return {"states": states}


def read_industry_totals(path: Path) -> list[dict[str, object]]:
    totals: list[dict[str, object]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if "|" not in stripped:
            continue
        category, _, count_raw = stripped.partition("|")
        try:
            count = int(count_raw.strip())
        except ValueError:
            continue
        totals.append({"category": category.strip(), "count": count})

    totals.sort(key=lambda item: (-item["count"], item["category"]))
    return totals


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")


def main() -> None:
    SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)

    people = read_people(DATA_DIR / "output_remove_est.csv")
    write_json(SITE_DATA_DIR / "people_index.json", people)

    state_totals = read_state_totals(DATA_DIR / "counts_from_csv")
    state_totals_list = [
        {"state": state, "count": count}
        for state, count in sorted(state_totals.items())
    ]
    write_json(SITE_DATA_DIR / "state_totals.json", state_totals_list)

    state_city_counts = read_state_city_counts(DATA_DIR / "counts_from_csv", state_totals)
    write_json(SITE_DATA_DIR / "state_city_counts.json", state_city_counts)

    industry_totals = read_industry_totals(DATA_DIR / "all_states_industry_count.csv")
    write_json(SITE_DATA_DIR / "industry_totals.json", industry_totals)



if __name__ == "__main__":
    main()
