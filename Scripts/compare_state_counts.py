#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATA_DIR = REPO_ROOT / "Data"


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


def read_counts_file(path: Path) -> dict[str, int]:
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


def read_location_totals(path: Path) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        parts = stripped.split("|")
        if len(parts) < 3:
            continue
        state_raw, category_raw, count_raw = parts[0], parts[1], parts[2]
        if category_raw.strip().lower() != "total":
            continue
        try:
            count = int(count_raw.strip())
        except ValueError:
            continue

        state_label = normalize_state(state_raw)
        if " AND " in state_label and count == 0:
            for part in state_label.split(" AND "):
                totals[normalize_state(part)] += count
        else:
            totals[state_label] += count

    return dict(totals)


def format_table(rows: list[tuple[str, int | None, int | None, int | None]]) -> str:
    def fmt(value: int | None) -> str:
        return "MISSING" if value is None else str(value)

    def fmt_diff(value: int | None) -> str:
        return "NA" if value is None else str(value)

    state_w = max(len("STATE"), max((len(row[0]) for row in rows), default=5))
    count_w = max(len("COUNTS"), max((len(fmt(row[1])) for row in rows), default=6))
    total_w = max(
        len("LOCATION_TOTAL"), max((len(fmt(row[2])) for row in rows), default=14)
    )
    diff_w = max(len("DIFF"), max((len(fmt_diff(row[3])) for row in rows), default=4))

    header = (
        f"{'STATE':<{state_w}}  {'COUNTS':>{count_w}}  "
        f"{'LOCATION_TOTAL':>{total_w}}  {'DIFF':>{diff_w}}"
    )
    lines = [header]
    for state, count, total, diff in rows:
        lines.append(
            f"{state:<{state_w}}  {fmt(count):>{count_w}}  "
            f"{fmt(total):>{total_w}}  {fmt_diff(diff):>{diff_w}}"
        )
    return "\n".join(lines)


def compare_counts(
    counts_path: Path, totals_path: Path, show_all: bool
) -> list[tuple[str, int | None, int | None, int | None]]:
    counts = read_counts_file(counts_path)
    totals = read_location_totals(totals_path)

    all_states = sorted(set(counts) | set(totals))
    rows: list[tuple[str, int | None, int | None, int | None]] = []
    for state in all_states:
        count = counts.get(state)
        total = totals.get(state)
        diff = count - total if count is not None and total is not None else None
        if show_all or count != total:
            rows.append((state, count, total, diff))

    return rows


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Compare state totals from 'Data/counts_from_csv' against "
            "'Data/location_counts_OCR.csv'."
        )
    )
    parser.add_argument(
        "--counts-file",
        default=None,
        help=(
            "Path to the counts file (default: Data/counts_from_csv)."
        ),
    )
    parser.add_argument(
        "--location-file",
        default=None,
        help=(
            "Path to the location totals file (default: Data/location_counts_OCR.csv)."
        ),
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Show all states, not just differences.",
    )
    args = parser.parse_args()

    if args.counts_file is None:
        counts_path = DATA_DIR / "counts_from_csv"
    else:
        counts_path = Path(args.counts_file)
        if not counts_path.exists():
            candidate = REPO_ROOT / args.counts_file
            if candidate.exists():
                counts_path = candidate

    if args.location_file is None:
        totals_path = DATA_DIR / "location_counts_OCR.csv"
    else:
        totals_path = Path(args.location_file)
        if not totals_path.exists():
            candidate = REPO_ROOT / args.location_file
            if candidate.exists():
                totals_path = candidate
    if not counts_path.exists():
        raise SystemExit(f"Counts file not found: {counts_path}")
    if not totals_path.exists():
        raise SystemExit(f"Location file not found: {totals_path}")

    rows = compare_counts(counts_path, totals_path, args.all)
    if not rows:
        print("No differences found.")
        return

    print(format_table(rows))


if __name__ == "__main__":
    main()
