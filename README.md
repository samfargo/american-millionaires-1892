# American Millionaires (1892)

This project digitizes and structures the The Tribune Monthly's 1892 directory-style publication "American
Millionaires" into clean, searchable data and a lightweight static website.

## What's included
- Cleaned, normalized people records in `Data/output_remove_est.csv`.
- Scans and raw OCR artifacts in `Scans/` and `Archive/`.
- Python scripts to generate derived counts and web indices in `Scripts/`.
- A static website in `site/` that reads JSON indices.

## Data schema (core)
Each person record is normalized into:

STATE | CITY | PERSON NAME | DESCRIPTION

## Quickstart (local)
Requirements: Python 3.

Build website JSON indices:
```bash
python3 Scripts/build_site_data.py
```
This generates JSON files in `site/assets/records/` for the static site.

Optional derived counts:
```bash
python3 Scripts/count_by_state.py
```

## Explore the site
Open `site/index.html` in a browser or deploy the `site/` folder to any static host.

## More details
Developer notes, comparison logic, and website implementation specifics live in
`DEVELOPMENT.md`.