# Lotto Pattern Lab

A universal lottery data analyzer and pattern exploration tool. Designed to support multiple lottery formats through dynamic CSV parsing. Features historical trend visualization, statistical insights, and a sandbox for testing machine learning predictions.

## Supported CSV Files

Currently configured to support Western Australian Lotterywest formats:

| Game ID | Game | File |
|---|---|---|
| 5130 | OZ Lotto | `5130-results.csv` |
| 5132 | Powerball | `5132-results.csv` |
| 5237 | Set for Life | `5237-results.csv` |

## Features

- **Game Tabs:** Seamlessly switch between different lottery types.
- **CSV Handling:** Upload your own CSV or load pre-existing data directly from the `data/` folder.
- **Visualizations:** Recent 10-draw grid visualization highlighting winning, powerball, and supplementary numbers.
- **Statistical Analysis:**
  - Frequency analysis (most/least common numbers).
  - Overdue number analysis.
  - Basic odd/even and sum pattern summaries.

## Run Locally

Because this project uses JavaScript ES modules, you must run it with a local web server (opening the HTML file directly will cause CORS errors).

Using Python:

```bash
python -m http.server 5500
```

Then open your browser and navigate to: `http://localhost:5500`

## Project Structure

```text
lotto-pattern-lab/
│
├── index.html
├── README.md
│
├── css/
│   └── style.css
│
├── js/
│   ├── main.js
│   ├── config/
│   │   └── gameConfigs.js
│   ├── parsers/
│   │   ├── csvParser.js
│   │   └── lotteryParser.js
│   ├── renderers/
│   │   ├── tabsRenderer.js
│   │   ├── gridRenderer.js
│   │   └── statsRenderer.js
│   ├── analysis/
│   │   ├── frequency.js
│   │   ├── overdue.js
│   │   └── patternStats.js
│   └── utils/
│       ├── dateUtils.js
│       └── numberUtils.js
│
├── data/
│   ├── 5130-results.csv
│   ├── 5132-results.csv
│   └── 5237-results.csv
│
└── models/
    └── README.md
```

## Disclaimer & Data Attribution

**Data Source:** The lottery draw data (CSV files) used in this repository are sourced from Lotterywest.

**Copyright Notice:** The copyright for the draw results and related lottery data resides with the State of Western Australia / Lotterywest. The data is used in this project strictly for personal, non-commercial, educational, and research purposes under the fair dealing provisions.

**Not Affiliated:** This project is an independent, open-source portfolio project and is not affiliated with, endorsed by, or associated with Lotterywest or the Western Australian Government in any way. This tool does not guarantee any winnings and is built purely for statistical analysis and programming demonstration.

## License

**Source Code:** MIT License.

**Dataset:** Subject to Lotterywest's copyright and terms of use. Please do not use the provided datasets for commercial purposes.
