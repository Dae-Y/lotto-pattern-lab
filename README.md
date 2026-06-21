# Lotto Pattern Lab

<!-- Replace this placeholder with your current app screenshot in GitHub README editor. -->
<!-- Suggested position: directly under the title/badges, before the project description. -->
<!-- Example:
<p align="center">
  <img src="YOUR_SCREENSHOT_URL_OR_RELATIVE_PATH" alt="Lotto Pattern Lab screenshot" width="900">
</p>
-->

![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-yellow)
![Static App](https://img.shields.io/badge/Built%20with-Vanilla%20JS-blue)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen)
![Data Scripts](https://img.shields.io/badge/Data-Scripts-informational)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

**Lotto Pattern Lab** is a personal lottery data visualisation and pattern exploration web app.

It currently supports multi-country and multi-operator lottery analysis for:

- **Australia — WA / Lotterywest**
  - OZ Lotto
  - Powerball
  - Set for Life
- **Australia — VIC / The Lott / Tatts**
  - TattsLotto
- **Korea — Donghaeng Lottery**
  - Lotto 6/45 / 로또 6/45

The project is built as a static GitHub Pages app using vanilla JavaScript modules. It focuses on historical draw visualisation, descriptive statistics, pattern insights, and random draw simulation.

---

## Important Notice

This is an independent, student-made data visualisation and pattern exploration tool.

It is **not affiliated with, endorsed by, sponsored by, or operated by Lotterywest, The Lott, Tatts, Donghaeng Lottery, or any lottery operator/government body**.

This project does not sell lottery products, process payments, facilitate lottery purchases, or guarantee outcomes. Users should always verify official results, rules, prizes, and eligibility through the relevant official lottery websites.

This project is for personal, educational, non-commercial, and portfolio demonstration purposes only.

---

## Features

### Multi-country and region/operator mode

Switch between Australia and Korea from the page header.

Australia mode supports region/operator switching:

- **WA** — Lotterywest datasets
- **VIC** — The Lott / Tatts datasets

Korea mode renders Korean UI and Lotto 6/45 analysis.

The selected country, region, game, recent draw count, and view mode are saved locally using `localStorage`.

### Recent draw visualisation

- Configurable recent draw count
- Table view for full number-grid inspection
- Compact view with lottery-ball style results
- Main numbers, bonus numbers, supplementary numbers, and Powerball-style numbers displayed according to each game configuration

### Quick analysis

- Most frequent main numbers
- Least frequent main numbers
- Most overdue main numbers
- Most frequent bonus / secondary numbers
- Most overdue bonus / secondary numbers

### Pattern insights

The advanced analysis section includes:

- Sum analysis
- Odd / even patterns
- Number spread
- Repeat count from the previous draw
- Consecutive number pairs
- Observed vs theoretical random baseline comparison
- Bar-chart style distribution summaries

### Random draw simulator

Generate random entries based on the selected game rule.

Examples:

- **Australia Powerball**: 7 main numbers + 1 Powerball
- **Australia TattsLotto**: 6 main numbers
- **Korea Lotto 6/45**: 6 main numbers + 1 bonus number

Generated numbers are random and are intended only for simulation and entertainment.

---

## Supported Lottery Data

| Country | Region / Operator | Games | Data source style |
|---|---|---|---|
| Australia | WA / Lotterywest | OZ Lotto, Powerball, Set for Life | Public Lotterywest result datasets |
| Australia | VIC / The Lott / Tatts | TattsLotto | Public The Lott website data endpoints |
| Korea | Donghaeng Lottery | Lotto 6/45 / 로또 6/45 | Public Lotto 6/45 result data |

The internal data files are stored in the `data/` directory and are loaded by the app through configuration. End users do not need to know the internal dataset filenames.

---

## Run Locally

Because this project uses JavaScript ES modules, it must be served through a local web server. Opening `index.html` directly may cause module/CORS issues.

From the project root:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

---

## Update Lottery Datasets

This project uses static CSV/JSON files inside the `data/` folder because the GitHub Pages app serves lottery results as static assets.

The repository includes scripts for manually refreshing those data files.

### Update Australia / WA / Lotterywest data

```bash
node scripts/fetch-lotterywest.mjs all
```

This updates the Australia WA datasets used by:

- OZ Lotto
- Powerball
- Set for Life

### Update Australia / VIC / The Lott / TattsLotto data

```bash
node scripts/fetch-thelott.mjs tattslotto
```

This updates the VIC TattsLotto dataset using the latest public The Lott result data and merges it into:

```text
data/au-vic-tattslotto.csv
```

The latest-results endpoint is limited to the most recent 10 draws, so this mode is designed for regular weekly updates.

### One-time TattsLotto historical backfill

The script also supports historical backfill using The Lott’s public historical date-range endpoint.

Example:

```bash
node scripts/fetch-thelott.mjs tattslotto --backfill-months=120
```

This fetches TattsLotto results month-by-month and merges them into the same CSV file.

A 120-month backfill was used to seed the current TattsLotto dataset with several hundred historical draws. Future GitHub Actions updates can then use the normal latest-update mode and continue growing the dataset over time.

### Update Korea Lotto 6/45 data

```bash
node scripts/fetch-korea-lotto.mjs mirror
```

This updates the Korea Lotto 6/45 CSV and JSON files used by the Korean analysis mode.

### Typical data update workflow

When only refreshing lottery result data:

```bash
cd ~/projects/lotto-pattern-lab

node scripts/fetch-lotterywest.mjs all
node scripts/fetch-thelott.mjs tattslotto
node scripts/fetch-korea-lotto.mjs mirror

git status
git add data/*.csv data/*.json
git commit -m "Update lottery result datasets"
git push
```

If the update scripts or workflow files were also changed, include them in the commit:

```bash
git add data/*.csv data/*.json scripts/*.mjs .github/workflows/*.yml
git commit -m "Update lottery result datasets and scripts"
git push
```

You can quickly check whether the latest results were written correctly with:

```bash
head -3 data/5132-results.csv
head -3 data/au-vic-tattslotto.csv
head -3 data/korea-lotto-645.csv
```

The generated CSV/JSON files are intentionally tracked in Git because GitHub Pages needs to serve them directly from the repository.

---

## Automated Data Updates

The repository includes a GitHub Actions workflow for scheduled dataset refreshes.

```text
.github/workflows/update-lottery-data.yml
```

The workflow runs on a weekly schedule and updates:

- Lotterywest datasets
- The Lott / TattsLotto dataset
- Korea Lotto 6/45 dataset

The action commits changed static data files back into the repository when new results are available.

---

## Data Source Discovery Notes

This project intentionally keeps the data-fetching scripts in `scripts/` as readable examples for students, junior developers, and anyone learning how static data-driven web apps can be maintained.

The scripts are not just “download helpers”; they document the process of discovering public result data sources, validating response shapes, normalising different formats, and maintaining static CSV/JSON assets for GitHub Pages.

### WA / Lotterywest

Lotterywest datasets are fetched using public Lotterywest result CSV endpoints.

The script:

```text
scripts/fetch-lotterywest.mjs
```

updates the WA game datasets:

```text
data/5130-results.csv
data/5132-results.csv
data/5237-results.csv
```

### VIC / The Lott / TattsLotto

The TattsLotto integration was developed by manually inspecting The Lott’s website with browser DevTools, especially the Network tab.

The current script:

```text
scripts/fetch-thelott.mjs
```

uses two public The Lott website data endpoints:

1. Latest results endpoint

```text
https://data.api.thelott.com/sales/vmax/web/data/lotto/latestresults
```

This endpoint returns the latest TattsLotto draw results but is limited to the most recent 10 draws.

2. Historical date-range endpoint

```text
https://data.api.thelott.com/sales/vmax/web/data/lotto/results/search/daterange
```

This endpoint was manually verified on **2026-06-22** by using browser DevTools / Network inspection on The Lott TattsLotto results page.

Example historical request payload:

```json
{
  "DateStart": "2025-12-31T13:00:00Z",
  "DateEnd": "2026-01-31T12:59:59Z",
  "ProductFilter": ["TattsLotto"],
  "CompanyFilter": ["Tattersalls"]
}
```

Confirmed response fields include:

- `DrawNumber`
- `DrawDate`
- `PrimaryNumbers`
- `SecondaryNumbers`

The script deliberately **does not** use S3/Vimeo draw video metadata as draw result data. URLs such as:

```text
https://s3-ap-southeast-2.amazonaws.com/lott-draw-videos/tattslotto/{draw}.json
```

only contain video/embed metadata and are not suitable as number result data.

### Korea / Donghaeng Lotto 6/45

The Korea Lotto 6/45 script:

```text
scripts/fetch-korea-lotto.mjs
```

updates:

```text
data/korea-lotto-645.csv
data/korea-lotto-645.json
```

The Korean analysis mode uses public Lotto 6/45 result data and presents the UI in Korean.

---

## Project Structure

```text
lotto-pattern-lab/
├── index.html
├── favicon.svg
├── favicon.ico
├── README.md
├── LICENSE
│
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── grid.css
│   ├── stats.css
│   ├── insights.css
│   ├── generator.css
│   ├── footer.css
│   ├── responsive.css
│   └── userNumbers.css
│
├── data/
│   ├── 5130-results.csv
│   ├── 5132-results.csv
│   ├── 5237-results.csv
│   ├── au-vic-tattslotto.csv
│   ├── korea-lotto-645.csv
│   └── korea-lotto-645.json
│
├── js/
│   ├── main.js
│   ├── config/
│   ├── i18n/
│   ├── parsers/
│   ├── renderers/
│   ├── analysis/
│   ├── generator/
│   └── utils/
│
├── scripts/
│   ├── fetch-lotterywest.mjs
│   ├── fetch-thelott.mjs
│   └── fetch-korea-lotto.mjs
│
└── models/
    └── README.md
```

Local virtual environments such as `venv/` are development-only and should not be considered part of the project structure.

---

## Architecture Notes

The app is designed around configuration-driven lottery games.

Each game defines:

- country
- region/operator where applicable
- locale
- display name
- data file
- parser type
- main number range/count
- secondary number range/count
- display labels and markers
- source attribution and official result links

The shared renderers and analysis modules then reuse the same logic across different countries, operators, and game formats.

This makes it easier to add more lottery games later without duplicating the whole UI.

---

## Data Attribution

### Australia — WA / Lotterywest

Australia WA lottery result data used in this project is based on publicly available Lotterywest result data.

Users should always verify official results, prize details, rules, and eligibility requirements through official Lotterywest sources.

### Australia — VIC / The Lott / Tatts

Victoria TattsLotto result data used in this project is based on publicly available The Lott website result data.

Users should always verify official results, prize details, rules, and eligibility requirements through official The Lott / Tatts sources.

### Korea — Donghaeng Lottery

Korea Lotto 6/45 data used in this project is based on publicly available Lotto 6/45 draw result data.

Users should always verify official results, prize details, rules, and eligibility requirements through the official Donghaeng Lottery website.

---

## Disclaimer

This project is an independent, student-made data visualisation and pattern exploration tool.

It is not affiliated with, endorsed by, sponsored by, or officially operated by Lotterywest, The Lott, Tatts, Donghaeng Lottery, or any lottery operator/government body.

This project does not sell lottery products, process payments, facilitate lottery purchases, or provide gambling services.

Lottery numbers are random by nature. Any analysis, chart, statistic, pattern insight, or generated number suggestion shown by this project is for reference, learning, and entertainment purposes only.

This project does not guarantee winnings, does not improve lottery odds, and should not be used as financial, gambling, legal, or investment advice.

The creator is not legally responsible for any loss, decision, transaction, gambling activity, or misunderstanding that may occur from using this website or its generated results.

All lottery names, game names, result data, and related materials belong to their respective owners.

---

## License

Source code: MIT License.

Lottery datasets: Subject to the terms, copyright, and usage policies of the relevant data owners and lottery operators. The included data is used for personal, educational, non-commercial, and portfolio demonstration purposes.

© 2026 Daehwan Yeo. All rights reserved.
