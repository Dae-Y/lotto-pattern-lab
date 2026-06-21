import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const CSV_PATH = "data/au-vic-tattslotto.csv";

function printUsage() {
  console.log("");
  console.log("Usage:");
  console.log("  node scripts/fetch-thelott.mjs");
  console.log("  node scripts/fetch-thelott.mjs tattslotto");
  console.log("  node scripts/fetch-thelott.mjs tattslotto --debug");
  console.log("  node scripts/fetch-thelott.mjs tattslotto --backfill");
  console.log("  node scripts/fetch-thelott.mjs tattslotto --backfill-months=24");
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
  // Handles ISO strings like 2026-06-20T00:00:00 or 2026-06-20T00:00:00Z
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
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload is not a valid JSON object.");
  }
  const draws = getFirstExistingValue(payload, ["DrawResults", "Draws", "results", "data", "draws"]);
  if (Array.isArray(draws)) {
    return draws;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  // If it's a map/object of draws keyed by number
  const values = Object.values(payload);
  if (values.length > 0 && values.every(val => typeof val === "object")) {
    return values;
  }
  throw new Error("Could not find an array of draw results in the JSON payload.");
}

function normaliseDraw(raw) {
  const drawNo = Number(
    getFirstExistingValue(raw, ["DrawNumber", "drawNo", "drawNumber", "round", "turn"])
  );
  const date = normaliseDate(
    getFirstExistingValue(raw, ["DrawDate", "drawDate", "date", "drwNoDate"], "")
  );
  
  const mainNumbersRaw = getFirstExistingValue(raw, [
    "PrimaryNumbers",
    "primaryNumbers",
    "numbers",
    "winningNumbers",
    "winning_numbers"
  ]);
  
  const suppNumbersRaw = getFirstExistingValue(raw, [
    "SecondaryNumbers",
    "secondaryNumbers",
    "supplementaryNumbers",
    "supplementary_numbers",
    "supps",
    "Supps"
  ]);

  const productId = getFirstExistingValue(raw, ["ProductId", "productId", "game"], "TattsLotto");

  let mainNumbers = [];
  if (Array.isArray(mainNumbersRaw)) {
    mainNumbers = mainNumbersRaw.map(Number).filter(n => Number.isFinite(n));
  }
  
  let suppNumbers = [];
  if (Array.isArray(suppNumbersRaw)) {
    suppNumbers = suppNumbersRaw.map(Number).filter(n => Number.isFinite(n));
  }

  if (!Number.isInteger(drawNo) || drawNo < 1) {
    throw new Error(`Invalid draw number: ${drawNo}`);
  }
  if (!date) {
    throw new Error(`Invalid or missing draw date for draw ${drawNo}`);
  }
  if (mainNumbers.length !== 6) {
    throw new Error(`Invalid main numbers count for draw ${drawNo}: expected 6, got ${mainNumbers.length}`);
  }
  if (suppNumbers.length !== 2) {
    throw new Error(`Invalid supplementary numbers count for draw ${drawNo}: expected 2, got ${suppNumbers.length}`);
  }

  return {
    drawNo,
    date,
    n1: mainNumbers[0],
    n2: mainNumbers[1],
    n3: mainNumbers[2],
    n4: mainNumbers[3],
    n5: mainNumbers[4],
    n6: mainNumbers[5],
    s1: suppNumbers[0],
    s2: suppNumbers[1],
    productId
  };
}

function printDebugInfo(payload, error = null) {
  console.log("=== DEBUG INFORMATION ===");
  if (payload && typeof payload === "object") {
    console.log("Top-level keys:", Object.keys(payload));
    
    let rawDraws = null;
    try {
      rawDraws = extractDrawArray(payload);
      console.log(`Found raw draws array with length: ${rawDraws.length}`);
    } catch (e) {
      console.log("Failed to locate raw draws array:", e.message);
    }
    
    if (rawDraws && rawDraws.length > 0) {
      const firstDraw = rawDraws[0];
      console.log("First draw object keys:", Object.keys(firstDraw));
      console.log("First draw JSON sample:");
      console.log(JSON.stringify(firstDraw, null, 2).slice(0, 500));
    } else {
      console.log("No draws found or draws array is empty.");
    }
  } else {
    console.log("Payload is not an object or is null/undefined:", payload);
  }
  if (error) {
    console.error("\nError Detail:", error.message);
  }
  console.log("=========================");
}

async function fetchLatestResults(apiProductFilter) {
  const url = "https://data.api.thelott.com/sales/vmax/web/data/lotto/latestresults";
  const payload = {
    CompanyId: "Tattersalls",
    MaxDrawCountPerProduct: 10,
    OptionalProductFilter: [apiProductFilter]
  };

  const body = JSON.stringify(payload);
  
  let response;
  let text = "";
  
  console.log(`Fetching latest results for ${apiProductFilter}...`);
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json"
      },
      body
    });
    
    text = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 150)}`);
    }
  } catch (error) {
    console.warn(`Initial request failed or was blocked. Retrying with extra headers... (Error: ${error.message})`);
    response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "origin": "https://www.thelott.com",
        "referer": "https://www.thelott.com/",
        "user-agent": "Mozilla/5.0"
      },
      body
    });
    
    text = await response.text();
    if (!response.ok) {
      throw new Error(`Retry HTTP ${response.status}: ${text.slice(0, 150)}`);
    }
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse response as JSON. Body start: ${text.slice(0, 150)}`);
  }

  return data;
}

async function fetchHistoricalResults(dateStart, dateEnd) {
  const url = "https://data.api.thelott.com/sales/vmax/web/data/lotto/results/search/daterange";
  const payload = {
    DateStart: dateStart,
    DateEnd: dateEnd,
    ProductFilter: ["TattsLotto"],
    CompanyFilter: ["Tattersalls"]
  };

  const body = JSON.stringify(payload);
  
  let response;
  let text = "";
  
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json"
      },
      body
    });
    
    text = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 150)}`);
    }
  } catch (error) {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "origin": "https://www.thelott.com",
        "referer": "https://www.thelott.com/",
        "user-agent": "Mozilla/5.0"
      },
      body
    });
    
    text = await response.text();
    if (!response.ok) {
      throw new Error(`Retry HTTP ${response.status}: ${text.slice(0, 150)}`);
    }
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse response as JSON. Body start: ${text.slice(0, 150)}`);
  }

  return data;
}

function getMelbourneOffsetHours(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Melbourne",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(date);
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  const melbUTC = Date.UTC(
    Number(partMap.year),
    Number(partMap.month) - 1,
    Number(partMap.day),
    Number(partMap.hour),
    Number(partMap.minute),
    Number(partMap.second)
  );
  return Math.round((melbUTC - date.getTime()) / (3600 * 1000));
}

function getMelbourneMonthUTCBounds(year, month) {
  const estDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const offsetHours = getMelbourneOffsetHours(estDate);
  const startUTC = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0) - offsetHours * 3600 * 1000);
  
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const estEndDate = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59));
  const endOffsetHours = getMelbourneOffsetHours(estEndDate);
  const endUTC = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59) - endOffsetHours * 3600 * 1000);
  
  return {
    DateStart: startUTC.toISOString().replace(".000Z", "Z"),
    DateEnd: endUTC.toISOString().replace(".000Z", "Z")
  };
}

function getCurrentMelbourneYearMonth() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "numeric"
  });
  const parts = formatter.formatToParts(new Date());
  const partMap = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  return {
    year: Number(partMap.year),
    month: Number(partMap.month)
  };
}

async function main() {
  const args = process.argv.slice(2);
  const debugMode = args.includes("--debug");

  let backfillMonths = 0;
  const backfillFlag = args.includes("--backfill");
  const backfillMonthsArg = args.find(arg => arg.startsWith("--backfill-months="));

  if (backfillMonthsArg) {
    const match = backfillMonthsArg.match(/^--backfill-months=(\d+)$/);
    if (!match) {
      throw new Error(`Invalid --backfill-months argument format. Expected --backfill-months=N`);
    }
    backfillMonths = parseInt(match[1], 10);
  } else if (backfillFlag) {
    backfillMonths = 72;
  }

  if (backfillMonths > 120) {
    throw new Error(`Maximum backfill limit is 120 months. Requested: ${backfillMonths}`);
  }

  const nonFlagArgs = args.filter(arg => 
    arg !== "--debug" && 
    arg !== "--backfill" && 
    !arg.startsWith("--backfill-months=")
  );
  const productArg = nonFlagArgs[0] || "tattslotto";

  // Validate productArg or map it
  if (productArg.toLowerCase() !== "tattslotto") {
    printUsage();
    throw new Error(`Unsupported game: ${productArg}`);
  }

  const apiProductFilter = "TattsLotto";
  const data = await fetchLatestResults(apiProductFilter);

  // Validate success field
  if (data && data.Success === false) {
    throw new Error(`API returned success: false. ErrorInfo: ${JSON.stringify(data.ErrorInfo)}`);
  }

  let rawDraws;
  try {
    rawDraws = extractDrawArray(data);
  } catch (error) {
    printDebugInfo(data, error);
    process.exit(1);
  }

  if (rawDraws.length === 0) {
    printDebugInfo(data, new Error("No draws returned in the API response."));
    process.exit(1);
  }

  const normalisedDraws = [];
  for (const rawDraw of rawDraws) {
    try {
      const normalised = normaliseDraw(rawDraw);
      normalisedDraws.push(normalised);
    } catch (error) {
      printDebugInfo(data, new Error(`Failed to parse draw object: ${error.message}`));
      process.exit(1);
    }
  }

  if (normalisedDraws.length === 0) {
    printDebugInfo(data, new Error("Zero draws were successfully normalized."));
    process.exit(1);
  }

  let skippedFailedMonths = 0;
  const historicalDraws = [];

  if (backfillMonths > 0) {
    const { year: currentYear, month: currentMonth } = getCurrentMelbourneYearMonth();
    console.log(`Backfill requested: ${backfillMonths} months from ${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    
    // Generate list of months
    const targetMonths = [];
    let y = currentYear;
    let m = currentMonth;
    for (let i = 0; i < backfillMonths; i++) {
      targetMonths.push({ year: y, month: m });
      m--;
      if (m === 0) {
        m = 12;
        y--;
      }
    }

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const target of targetMonths) {
      const { DateStart, DateEnd } = getMelbourneMonthUTCBounds(target.year, target.month);
      console.log(`Fetching historical draws for ${target.year}-${String(target.month).padStart(2, '0')} (${DateStart} to ${DateEnd})...`);
      
      try {
        const histData = await fetchHistoricalResults(DateStart, DateEnd);
        
        if (histData && histData.Success === false) {
          throw new Error(`API returned Success: false. ErrorInfo: ${JSON.stringify(histData.ErrorInfo)}`);
        }
        
        const rawDraws = extractDrawArray(histData);
        let monthDrawsFetched = 0;
        
        for (const rawDraw of rawDraws) {
          try {
            const normalised = normaliseDraw(rawDraw);
            historicalDraws.push(normalised);
            monthDrawsFetched++;
          } catch (err) {
            console.warn(`Warning: Skipped invalid draw row in ${target.year}-${String(target.month).padStart(2, '0')}: ${err.message}`);
          }
        }
        
        console.log(`Fetched ${monthDrawsFetched} draw(s) for ${target.year}-${String(target.month).padStart(2, '0')}`);
      } catch (err) {
        console.warn(`Warning: Failed to fetch/parse historical data for ${target.year}-${String(target.month).padStart(2, '0')}: ${err.message}`);
        skippedFailedMonths++;
      }
      
      // Delay around 200ms
      await delay(200);
    }
  }

  const allNewDraws = [...normalisedDraws, ...historicalDraws];

  if (debugMode) {
    printDebugInfo(data);
    console.log("\nNormalized Rows Preview (Success):");
    console.log(JSON.stringify(allNewDraws.map(d => ({
      drawNo: d.drawNo,
      date: d.date,
      numbers: [d.n1, d.n2, d.n3, d.n4, d.n5, d.n6],
      supps: [d.s1, d.s2]
    })), null, 2));
    console.log("\nDebug mode active: Exiting without writing CSV file.");
    process.exit(0);
  }

  // Normal mode: Load, merge, sort, and save to CSV
  const existingDraws = new Map();

  try {
    const content = await fs.readFile(CSV_PATH, "utf8");
    const lines = content.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(",");
      if (parts.length < 10) {
        continue;
      }
      
      const drawNo = Number(parts[0]);
      const date = parts[1];
      const n1 = Number(parts[2]);
      const n2 = Number(parts[3]);
      const n3 = Number(parts[4]);
      const n4 = Number(parts[5]);
      const n5 = Number(parts[6]);
      const n6 = Number(parts[7]);
      const s1 = Number(parts[8]);
      const s2 = Number(parts[9]);
      
      if (Number.isInteger(drawNo) && drawNo > 0) {
        existingDraws.set(drawNo, { drawNo, date, n1, n2, n3, n4, n5, n6, s1, s2 });
      }
    }
    console.log(`Loaded ${existingDraws.size} existing draws from ${CSV_PATH}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Warning: Failed to read existing CSV: ${error.message}`);
    }
  }

  // Merge new draws
  for (const draw of allNewDraws) {
    existingDraws.set(draw.drawNo, {
      drawNo: draw.drawNo,
      date: draw.date,
      n1: draw.n1,
      n2: draw.n2,
      n3: draw.n3,
      n4: draw.n4,
      n5: draw.n5,
      n6: draw.n6,
      s1: draw.s1,
      s2: draw.s2
    });
  }

  // Sort by drawNo ascending
  const sortedDraws = Array.from(existingDraws.values()).sort((a, b) => a.drawNo - b.drawNo);

  // Write CSV
  const csvLines = ["drawNo,date,n1,n2,n3,n4,n5,n6,s1,s2"];
  for (const draw of sortedDraws) {
    csvLines.push(`${draw.drawNo},${draw.date},${draw.n1},${draw.n2},${draw.n3},${draw.n4},${draw.n5},${draw.n6},${draw.s1},${draw.s2}`);
  }

  await fs.mkdir(path.dirname(CSV_PATH), { recursive: true });
  await fs.writeFile(CSV_PATH, csvLines.join("\n") + "\n", "utf8");

  // Log concise summary
  const fetchedSorted = [...allNewDraws].sort((a, b) => b.drawNo - a.drawNo);
  const latest = fetchedSorted[0] || {};

  console.log("\n=== TattsLotto Fetch Summary ===");
  console.log(`Product:                 ${latest.productId || "TattsLotto"}`);
  console.log(`Latest Draws Returned:   ${normalisedDraws.length}`);
  if (backfillMonths > 0) {
    console.log(`Backfill Months Req:     ${backfillMonths}`);
    console.log(`Hist Draws Fetched:      ${historicalDraws.length}`);
    console.log(`Skipped/Failed Months:   ${skippedFailedMonths}`);
  }
  console.log(`Latest Draw Number:      ${latest.drawNo || "N/A"}`);
  console.log(`Latest Draw Date:        ${latest.date || "N/A"}`);
  if (latest.drawNo) {
    console.log(`Winning Numbers:         ${[latest.n1, latest.n2, latest.n3, latest.n4, latest.n5, latest.n6].join(", ")}`);
    console.log(`Supplementary Numbers:   ${[latest.s1, latest.s2].join(", ")}`);
  }
  console.log("================================\n");
  console.log(`Saved merged and sorted results to ${CSV_PATH} (Total draws: ${sortedDraws.length})`);
}

main().catch(error => {
  console.error("\nFatal Error:", error.message);
  process.exit(1);
});
