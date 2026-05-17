import fs from "node:fs/promises";

const LOTTERYWEST_GAMES = [
  {
    id: "5130",
    name: "OZ Lotto",
    url: "https://www.lotterywest.wa.gov.au/api/games/5130/results-csv",
    output: "data/5130-results.csv",
    requiredHeaderTokens: ["Draw number", "Draw date", "Winning Number 1"],
  },
  {
    id: "5132",
    name: "Powerball",
    url: "https://www.lotterywest.wa.gov.au/api/games/5132/results-csv",
    output: "data/5132-results.csv",
    requiredHeaderTokens: ["Draw number", "Draw date", "Winning Number 1", "Powerball Number"],
  },
  {
    id: "5237",
    name: "Set for Life",
    url: "https://www.lotterywest.wa.gov.au/api/games/5237/results-csv",
    output: "data/5237-results.csv",
    requiredHeaderTokens: ["Draw number", "Draw date", "Winning Number 1", "Supplementary Number 1"],
  },
];

function printUsage() {
  console.log("");
  console.log("Usage:");
  console.log("  node scripts/fetch-lotterywest.mjs all");
  console.log("  node scripts/fetch-lotterywest.mjs 5130");
  console.log("  node scripts/fetch-lotterywest.mjs 5132");
  console.log("  node scripts/fetch-lotterywest.mjs 5237");
  console.log("");
}

function getSelectedGames(target) {
  if (!target || target === "all") {
    return LOTTERYWEST_GAMES;
  }

  const game = LOTTERYWEST_GAMES.find((item) => item.id === target);

  if (!game) {
    printUsage();
    throw new Error(`Unknown Lotterywest game id: ${target}`);
  }

  return [game];
}

function validateCsv(csvText, game) {
  const trimmed = csvText.trim();

  if (!trimmed) {
    throw new Error(`${game.name}: received empty CSV`);
  }

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new Error(`${game.name}: expected CSV but received HTML`);
  }

  const firstLine = trimmed.split(/\r?\n/)[0];

  for (const token of game.requiredHeaderTokens) {
    if (!firstLine.includes(token)) {
      throw new Error(
        `${game.name}: CSV header does not include required token "${token}". Header was: ${firstLine}`,
      );
    }
  }

  const lineCount = trimmed.split(/\r?\n/).length;

  if (lineCount < 2) {
    throw new Error(`${game.name}: CSV has no data rows`);
  }

  return {
    header: firstLine,
    lineCount,
  };
}

async function fetchCsv(game) {
  console.log(`Fetching ${game.name} (${game.id})...`);
  console.log(`Source: ${game.url}`);

  const response = await fetch(game.url, {
    headers: {
      "User-Agent": "lotto-pattern-lab/1.0",
      Accept: "text/csv,text/plain,*/*",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${game.name}: HTTP ${response.status}. Body starts: ${text.slice(0, 120)}`);
  }

  const validation = validateCsv(text, game);

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(game.output, `${text.trim()}\n`, "utf8");

  console.log(`Saved ${game.output}`);
  console.log(`Rows including header: ${validation.lineCount}`);
  console.log("");
}

async function main() {
  const target = process.argv[2] ?? "all";
  const selectedGames = getSelectedGames(target);

  const failures = [];

  for (const game of selectedGames) {
    try {
      await fetchCsv(game);
    } catch (error) {
      failures.push({ game, error });
      console.error(`Failed ${game.name}: ${error.message}`);
      console.error("");
    }
  }

  if (failures.length > 0) {
    console.error("Some downloads failed:");
    failures.forEach(({ game, error }) => {
      console.error(`- ${game.name} (${game.id}): ${error.message}`);
    });
    process.exit(1);
  }

  console.log("Lotterywest CSV update complete.");
}

main().catch((error) => {
  console.error("");
  console.error("Fatal error:", error.message);
  process.exit(1);
});
