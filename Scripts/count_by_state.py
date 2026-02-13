#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
from collections import Counter, defaultdict
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATA_DIR = REPO_ROOT / "Data"


def detect_delimiter(sample_line: str) -> str:
    if "|" in sample_line:
        return "|"
    return ","


def find_column_index(headers: list[str], name: str) -> int | None:
    target = name.strip().lower()
    for idx, header in enumerate(headers):
        if header.strip().lower() == target:
            return idx
    return None


def read_counts(path: Path) -> tuple[Counter[str], Counter[tuple[str, str]]]:
    with path.open(newline="", encoding="utf-8") as f:
        first_line = f.readline()
        if not first_line:
            return Counter(), Counter()
        delimiter = detect_delimiter(first_line)
        f.seek(0)

        reader = csv.reader(f, delimiter=delimiter)
        headers = next(reader, None)
        if not headers:
            return Counter(), Counter()
        headers = [h.strip() for h in headers]

        state_idx = find_column_index(headers, "State")
        city_idx = find_column_index(headers, "City")
        if state_idx is None or city_idx is None:
            raise ValueError("Could not find 'State' and 'City' columns in header.")

        state_counts: Counter[str] = Counter()
        state_city_counts: Counter[tuple[str, str]] = Counter()

        for row in reader:
            if not row:
                continue
            if len(row) <= max(state_idx, city_idx):
                continue

            state = row[state_idx].strip()
            city = row[city_idx].strip()
            if not state:
                continue

            city_label = city if city else "(blank)"
            state_counts[state] += 1
            state_city_counts[(state, city_label)] += 1

    return state_counts, state_city_counts


def print_state_counts(state_counts: Counter[str], out) -> None:
    print("Counts by state", file=out)
    for state, count in sorted(state_counts.items(), key=lambda item: item[0]):
        print(f"{state}: {count}", file=out)


def print_state_city_counts(state_city_counts: Counter[tuple[str, str]], out) -> None:
    print("\nCounts by state and city", file=out)
    grouped: dict[str, list[tuple[str, int]]] = defaultdict(list)
    for (state, city), count in state_city_counts.items():
        grouped[state].append((city, count))

    for state in sorted(grouped):
        print(f"\n{state}", file=out)
        for city, count in sorted(grouped[state], key=lambda item: item[0]):
            print(f"  {city}: {count}", file=out)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Print counts by state and by state/city from a CSV file."
    )
    parser.add_argument(
        "csv_path",
        nargs="?",
        default=None,
        help=(
            "Path to the CSV file (default: Data/output_remove_est.csv)."
        ),
    )
    args = parser.parse_args()

    if args.csv_path is None:
        path = DATA_DIR / "output_remove_est.csv"
    else:
        path = Path(args.csv_path)
        if not path.exists():
            candidate = REPO_ROOT / args.csv_path
            if candidate.exists():
                path = candidate
    if not path.exists():
        raise SystemExit(f"File not found: {path}")

    state_counts, state_city_counts = read_counts(path)
    output_path = DATA_DIR / "counts_from_csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as out:
        print_state_counts(state_counts, out)
        print_state_city_counts(state_city_counts, out)


if __name__ == "__main__":
    main()
