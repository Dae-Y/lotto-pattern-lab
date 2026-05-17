# Lotto Pattern Lab

![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-yellow.svg)
![Built with](https://img.shields.io/badge/Built%20with-HTML%20%7C%20CSS%20%7C%20Vanilla%20JS-blue.svg)
![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-green.svg)
![Data Scripts](https://img.shields.io/badge/Data%20Scripts-Node.js-339933.svg)
![License](https://img.shields.io/badge/License-MIT-orange.svg)
![Status](https://img.shields.io/badge/Status-MVP%20Complete-brightgreen.svg)

**Lotto Pattern Lab** is a personal lottery data visualisation and pattern exploration web app.

It currently supports multi-country lottery analysis for:

- **Australia** — Lotterywest draw games
- **Korea** — Lotto 6/45 / 로또 6/45

The project is built as a static GitHub Pages app using vanilla JavaScript modules. It focuses on historical draw visualisation, descriptive statistics, pattern insights, and random draw simulation.

> **Important notice**  
> This is an independent, student-made data visualisation and pattern exploration tool.  
> It is not affiliated with, endorsed by, or operated by Lotterywest or Donghaeng Lottery.  
> It does not sell lottery products, process payments, or guarantee outcomes.  
> Users should verify official results, rules, prizes, and eligibility on the official websites.  
> This project is for personal, educational, and non-commercial data visualisation purposes only.

---

## Features

### Multi-country mode

Switch between Australia and Korea from the page header.

- Australia mode renders English UI and Lotterywest games.
- Korea mode renders Korean UI and Lotto 6/45 analysis.
- The selected country, game, recent draw count, and view mode are saved locally using `localStorage`.

### Recent draw visualisation

- Configurable recent draw count
- Table view for full number-grid inspection
- Compact view with lottery-ball style results
- Main numbers, bonus numbers, supplementary numbers, and Powerball-style numbers are displayed according to each game configuration

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

- Australia Powerball: 7 main numbers + 1 Powerball
- Korea Lotto 6/45: 6 main numbers + 1 bonus number

Generated numbers are random and are intended only for simulation and entertainment.

---

## Supported Lottery Data

The app currently supports:

| Country | Games |
|---|---|
| Australia | OZ Lotto, Powerball, Set for Life |
| Korea | Lotto 6/45 / 로또 6/45 |

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

### Update Australia / Lotterywest data

```bash
node scripts/fetch-lotterywest.mjs all
```

This updates the Australia datasets used by:

- OZ Lotto
- Powerball
- Set for Life

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
node scripts/fetch-korea-lotto.mjs mirror

git status
git add data/*.csv data/*.json
git commit -m "Update lottery result datasets"
git push
```

If the update scripts or `.gitignore` were also changed, include them in the commit:

```bash
git add data/*.csv data/*.json scripts/*.mjs .gitignore
git commit -m "Update lottery result datasets and scripts"
git push
```

You can quickly check whether the latest results were written correctly with:

```bash
head -3 data/5132-results.csv
head -3 data/korea-lotto-645.csv
```

The generated CSV/JSON files are intentionally tracked in Git because GitHub Pages needs to serve them directly from the repository.

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
│   └── responsive.css
│
├── data/
│   ├── australia result datasets
│   └── korea lotto 6/45 datasets
│
├── js/
│   ├── main.js
│   ├── config/
│   │   ├── countries.js
│   │   ├── gameConfigs.js
│   │   └── games/
│   ├── i18n/
│   ├── parsers/
│   ├── renderers/
│   ├── analysis/
│   ├── generator/
│   └── utils/
│
├── scripts/
│   ├── fetch-lotterywest.mjs
│   └── fetch-korea-lotto.mjs
│
└── models/
    └── README.md
```

---

## Architecture Notes

The app is designed around configuration-driven lottery games.

Each game defines:

- country
- locale
- display name
- data file
- parser type
- main number range/count
- secondary number range/count
- display labels and markers

The shared renderers and analysis modules then reuse the same logic across different countries and game formats.

This makes it easier to add more lottery games later without duplicating the whole UI.

---

## Data Attribution

### Australia

Australia lottery result data used in this project is based on publicly available Lotterywest result data.

### Korea

Korea Lotto 6/45 data used in this project is based on publicly available Lotto 6/45 draw result data.

Users should always verify official results, prize details, rules, and eligibility requirements through the official Donghaeng Lottery website.

---

## Disclaimer

This project is an independent, student-made data visualisation and pattern exploration tool.

It is not affiliated with, endorsed by, sponsored by, or officially operated by Lotterywest, Donghaeng Lottery, or any lottery operator/government body.

This project does not sell lottery products, process payments, facilitate lottery purchases, or provide gambling services.

Lottery numbers are random by nature. Any analysis, chart, statistic, pattern insight, or generated number suggestion shown by this project is for reference, learning, and entertainment purposes only.

This project does not guarantee winnings, does not improve lottery odds, and should not be used as financial, gambling, legal, or investment advice.

The creator is not legally responsible for any loss, decision, transaction, gambling activity, or misunderstanding that may occur from using this website or its generated results.

All lottery names, game names, result data, and related materials belong to their respective owners.

---

## License

**Source code:** MIT License.

**Lottery datasets:** Subject to the terms, copyright, and usage policies of the relevant data owners and lottery operators. The included data is used for personal, educational, non-commercial, and portfolio demonstration purposes.

© 2026 Daehwan Yeo. All rights reserved.
