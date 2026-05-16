export const GAME_CONFIGS = {
  "5130": {
    id: "5130",
    name: "OZ Lotto",
    fileName: "5130-results.csv",
    currentFormatStartDraw: 1474,
    main: {
      label: "Winning",
      range: 47,
      count: 7,
      columnPrefix: "Winning Number",
    },
    secondary: {
      label: "Supplementary",
      range: 47,
      count: 3,
      columnPrefix: "Supplementary Number",
      sharesMainGrid: true,
    },
    display: {
      mainMark: "W",
      secondaryMark: "S",
      secondaryClass: "supplementary-hit",
    },
  },

  "5132": {
    id: "5132",
    name: "Powerball",
    fileName: "5132-results.csv",
    currentFormatStartDraw: 1144,
    main: {
      label: "Winning",
      range: 35,
      count: 7,
      columnPrefix: "Winning Number",
    },
    secondary: {
      label: "Powerball",
      range: 20,
      count: 1,
      columnPrefix: "Powerball Number",
      sharesMainGrid: false,
    },
    display: {
      mainMark: "W",
      secondaryMark: "P",
      secondaryClass: "secondary-hit",
    },
  },

  "5237": {
    id: "5237",
    name: "Set for Life",
    fileName: "5237-results.csv",
    currentFormatStartDraw: 1691,
    main: {
      label: "Winning",
      range: 44,
      count: 7,
      columnPrefix: "Winning Number",
    },
    secondary: {
      label: "Supplementary",
      range: 44,
      count: 2,
      columnPrefix: "Supplementary Number",
      sharesMainGrid: true,
    },
    display: {
      mainMark: "W",
      secondaryMark: "S",
      secondaryClass: "supplementary-hit",
    },
  },
};

export const DEFAULT_GAME_ID = "5130";

export function getGameConfig(gameId) {
  return GAME_CONFIGS[gameId] ?? GAME_CONFIGS[DEFAULT_GAME_ID];
}

export function detectGameIdFromFileName(fileName) {
  const lower = fileName.toLowerCase();

  for (const gameId of Object.keys(GAME_CONFIGS)) {
    if (lower.includes(gameId)) {
      return gameId;
    }
  }

  // Keyword-based fallback
  if (lower.includes("oz")) return "5130";
  if (lower.includes("powerball")) return "5132";
  if (lower.includes("setforlife") || lower.includes("set for life") || lower.includes("set_for_life")) return "5237";

  return null;
}

/**
 * Detect game ID by inspecting CSV header columns.
 * Uses parseCsvLine from csvParser.js for safe header parsing.
 *
 * Rules:
 *   - "Powerball Number" present => Powerball (5132)
 *   - "Supplementary Number 3" present => OZ Lotto (5130)
 *   - "Supplementary Number 1" and "Supplementary Number 2" present,
 *     but NOT "Supplementary Number 3" => Set for Life (5237)
 *   - Otherwise => null (unknown)
 */
export function detectGameIdFromCsvText(csvText, parseCsvLine) {
  if (!csvText) return null;

  const firstNewline = csvText.indexOf("\n");
  const headerLine = (firstNewline === -1 ? csvText : csvText.slice(0, firstNewline)).replace(/^\uFEFF/, "").trim();

  if (!headerLine) return null;

  const headers = parseCsvLine(headerLine).map((h) => h.trim());
  const headerSet = new Set(headers);

  if (headerSet.has("Powerball Number")) {
    return "5132";
  }

  if (headerSet.has("Supplementary Number 3")) {
    return "5130";
  }

  if (headerSet.has("Supplementary Number 1") && headerSet.has("Supplementary Number 2") && !headerSet.has("Supplementary Number 3")) {
    return "5237";
  }

  return null;
}