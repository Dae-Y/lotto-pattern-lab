import fs from "node:fs/promises";

const OUTPUT_JSON = "data/korea-lotto-645.json";
const OUTPUT_CSV = "data/korea-lotto-645.csv";

const MIRROR_ALL_URL = "https://smok95.github.io/lotto/results/all.json";
const MIRROR_LATEST_URL = "https://smok95.github.io/lotto/results/latest.json";

const OFFICIAL_API_URL =
  "https://www.dhlottery.co.kr/common.do?method=getLottoNumber";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function printUsage() {
  console.log("");
  console.log("Usage:");
  console.log("  node scripts/fetch-korea-lotto.mjs mirror");
  console.log("  node scripts/fetch-korea-lotto.mjs official <latestDrawNumber>");
  console.log("");
  console.log("Recommended for now:");
  console.log("  node scripts/fetch-korea-lotto.mjs mirror");
  console.log("");
}

function escapeCsvValue(value) {
  const text = String(value ?? "");

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function normaliseDate(value) {
  if (!value) {
    return "";
  }

  const text = String(value);

  // Handles ISO strings like 2020-09-19T00:00:00Z
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  return text;
}

function getFirstExistingValue(object, keys, fallback = null) {
  for (const key of keys) {
    if (object && object[key] !== undefined && object[key] !== null) {
      return object[key];
    }
  }

  return fallback;
}

function extractDrawArray(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.draws)) {
    return payload.draws;
  }

  // Some JSON datasets are keyed objects:
  // { "1": {...}, "2": {...} }
  if (payload && typeof payload === "object") {
    const values = Object.values(payload);

    if (values.length > 0 && values.every((value) => typeof value === "object")) {
      return values;
    }
  }

  throw new Error("Could not find an array of draw results in the JSON payload.");
}

function normaliseMirrorDraw(raw) {
  const drawNo = Number(
    getFirstExistingValue(raw, ["draw_no", "drawNo", "drwNo", "round", "turn"]),
  );

  const numbers =
    raw.numbers ??
    raw.winning_numbers ??
    raw.winningNumbers ??
    [
      raw.n1 ?? raw.drwtNo1,
      raw.n2 ?? raw.drwtNo2,
      raw.n3 ?? raw.drwtNo3,
      raw.n4 ?? raw.drwtNo4,
      raw.n5 ?? raw.drwtNo5,
      raw.n6 ?? raw.drwtNo6,
    ];

  const cleanNumbers = numbers.map(Number).filter((number) => Number.isFinite(number));

  const bonus = Number(
    getFirstExistingValue(raw, ["bonus_no", "bonusNo", "bonus", "bnusNo"]),
  );

  const date = normaliseDate(
    getFirstExistingValue(raw, ["date", "draw_date", "drawDate", "drwNoDate"], ""),
  );

  const divisions = Array.isArray(raw.divisions) ? raw.divisions : [];
  const firstDivision = divisions[0] ?? {};

  const totalSales = Number(
    getFirstExistingValue(raw, [
      "total_sales_amount",
      "totalSalesAmount",
      "totalSales",
      "totSellamnt",
    ], 0),
  );

  const firstPrizeAmount = Number(
    getFirstExistingValue(raw, [
      "firstPrizeAmount",
      "firstWinamnt",
      "first_prize_amount",
      "prize",
    ], firstDivision.prize ?? 0),
  );

  const firstPrizeWinners = Number(
    getFirstExistingValue(raw, [
      "firstPrizeWinners",
      "firstPrzwnerCo",
      "first_prize_winners",
      "winners",
    ], firstDivision.winners ?? 0),
  );

  const firstPrizeTotal = Number(
    getFirstExistingValue(raw, [
      "firstPrizeTotal",
      "firstAccumamnt",
      "first_prize_total",
    ], firstPrizeAmount && firstPrizeWinners ? firstPrizeAmount * firstPrizeWinners : 0),
  );

  if (!Number.isInteger(drawNo) || drawNo < 1) {
    throw new Error(`Invalid draw number in payload: ${JSON.stringify(raw).slice(0, 160)}`);
  }

  if (cleanNumbers.length !== 6) {
    throw new Error(`Invalid numbers for draw ${drawNo}: ${JSON.stringify(numbers)}`);
  }

  if (!Number.isFinite(bonus)) {
    throw new Error(`Invalid bonus number for draw ${drawNo}`);
  }

  return {
    game: "korea_lotto_645",
    drawNo,
    date,
    numbers: cleanNumbers,
    bonus,
    totalSales,
    firstPrizeAmount,
    firstPrizeWinners,
    firstPrizeTotal,
  };
}

function normaliseOfficialDraw(data) {
  if (data.returnValue !== "success") {
    return null;
  }

  return {
    game: "korea_lotto_645",
    drawNo: Number(data.drwNo),
    date: data.drwNoDate,
    numbers: [
      Number(data.drwtNo1),
      Number(data.drwtNo2),
      Number(data.drwtNo3),
      Number(data.drwtNo4),
      Number(data.drwtNo5),
      Number(data.drwtNo6),
    ],
    bonus: Number(data.bnusNo),
    totalSales: Number(data.totSellamnt),
    firstPrizeAmount: Number(data.firstWinamnt),
    firstPrizeWinners: Number(data.firstPrzwnerCo),
    firstPrizeTotal: Number(data.firstAccumamnt),
  };
}

function toCsv(draws) {
  const header = [
    "drawNo",
    "date",
    "n1",
    "n2",
    "n3",
    "n4",
    "n5",
    "n6",
    "bonus",
    "totalSales",
    "firstPrizeAmount",
    "firstPrizeWinners",
    "firstPrizeTotal",
  ];

  const rows = draws.map((draw) => [
    draw.drawNo,
    draw.date,
    ...draw.numbers,
    draw.bonus,
    draw.totalSales,
    draw.firstPrizeAmount,
    draw.firstPrizeWinners,
    draw.firstPrizeTotal,
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "lotto-pattern-lab/1.0",
      Accept: "application/json,text/plain,*/*",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}. Body starts: ${text.slice(0, 120)}`);
  }

  const trimmed = text.trim();

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    throw new Error(`Expected JSON from ${url}. Body starts: ${trimmed.slice(0, 120)}`);
  }

  return JSON.parse(trimmed);
}

async function fetchFromMirror() {
  console.log("Fetching Korea Lotto 6/45 data from public JSON mirror...");
  console.log(`Source: ${MIRROR_ALL_URL}`);
  console.log("Note: This is not the official Donghaeng Lottery site. Verify important data with the official site.");
  console.log("");

  const payload = await fetchJson(MIRROR_ALL_URL);
  const rawDraws = extractDrawArray(payload);

  const draws = rawDraws
    .map(normaliseMirrorDraw)
    .sort((a, b) => b.drawNo - a.drawNo);

  return draws;
}

async function fetchOfficialDraw(drawNo) {
  const url = `${OFFICIAL_API_URL}&drwNo=${drawNo}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: "https://www.dhlottery.co.kr/lt645/result",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed.startsWith("{")) {
    await fs.mkdir("data", { recursive: true });
    await fs.writeFile(`data/debug-dhlottery-draw-${drawNo}.html`, text, "utf8");
    throw new Error(
      `Official endpoint returned HTML, not JSON. Saved data/debug-dhlottery-draw-${drawNo}.html`,
    );
  }

  return normaliseOfficialDraw(JSON.parse(trimmed));
}

async function fetchFromOfficial(latestDraw) {
  console.log("Trying official Donghaeng Lottery endpoint...");
  console.log("This may fail if the site returns a waiting/block page to scripts.");
  console.log("");

  const draws = [];
  const failed = [];

  for (let drawNo = 1; drawNo <= latestDraw; drawNo += 1) {
    try {
      const draw = await fetchOfficialDraw(drawNo);

      if (draw) {
        draws.push(draw);
        console.log(`Fetched official draw ${drawNo}`);
      } else {
        console.log(`No official data for draw ${drawNo}`);
      }

      await sleep(350);
    } catch (error) {
      failed.push(drawNo);
      console.error(`Failed official draw ${drawNo}: ${error.message}`);
      break;
    }
  }

  if (draws.length === 0) {
    throw new Error(
      "No official draws fetched. Use mirror mode for now: node scripts/fetch-korea-lotto.mjs mirror",
    );
  }

  if (failed.length > 0) {
    console.warn(`Official fetch stopped after failure at draw(s): ${failed.join(", ")}`);
  }

  return draws.sort((a, b) => b.drawNo - a.drawNo);
}

async function saveOutputs(draws) {
  await fs.mkdir("data", { recursive: true });

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(draws, null, 2), "utf8");
  await fs.writeFile(OUTPUT_CSV, `${toCsv(draws)}\n`, "utf8");

  console.log("");
  console.log(`Saved ${draws.length} draws.`);
  console.log(`JSON: ${OUTPUT_JSON}`);
  console.log(`CSV:  ${OUTPUT_CSV}`);

  if (draws.length > 0) {
    const latest = draws[0];
    const oldest = draws[draws.length - 1];

    console.log("");
    console.log(
      `Latest: #${latest.drawNo} ${latest.date} — ${latest.numbers.join(", ")} + ${latest.bonus}`,
    );
    console.log(
      `Oldest: #${oldest.drawNo} ${oldest.date} — ${oldest.numbers.join(", ")} + ${oldest.bonus}`,
    );
  }
}

async function main() {
  const mode = process.argv[2] ?? "mirror";

  let draws;

  if (mode === "mirror") {
    draws = await fetchFromMirror();
  } else if (mode === "official") {
    const latestDraw = Number(process.argv[3]);

    if (!Number.isInteger(latestDraw) || latestDraw < 1) {
      printUsage();
      process.exit(1);
    }

    draws = await fetchFromOfficial(latestDraw);
  } else {
    printUsage();
    process.exit(1);
  }

  await saveOutputs(draws);
}

main().catch((error) => {
  console.error("");
  console.error("Fatal error:", error.message);
  process.exit(1);
});