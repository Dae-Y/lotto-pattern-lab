import { GAME_CONFIGS_ARRAY } from "./games/index.js";

export const GAME_CONFIGS = GAME_CONFIGS_ARRAY;

export const DEFAULT_GAME_ID = "5130";

export function getGameConfig(gameId) {
  return GAME_CONFIGS.find((g) => g.id === gameId) ?? GAME_CONFIGS.find((g) => g.id === DEFAULT_GAME_ID);
}

export function detectGameIdFromFileName(fileName) {
  const lower = fileName.toLowerCase();

  for (const game of GAME_CONFIGS) {
    if (lower.includes(game.id)) {
      return game.id;
    }
  }

  // Keyword-based fallback
  if (lower.includes("oz")) return "5130";
  if (lower.includes("powerball")) return "5132";
  if (lower.includes("setforlife") || lower.includes("set for life") || lower.includes("set_for_life")) return "5237";
  if (lower.includes("korea-lotto") || lower.includes("lotto-645") || lower.includes("korea_lotto_645")) return "korea_lotto_645";

  return null;
}

/**
 * Detect game ID by inspecting CSV header columns.
 * Uses parseCsvLine from csvParser.js for safe header parsing.
 */
export function detectGameIdFromCsvText(csvText, parseCsvLine) {
  if (!csvText) return null;

  const firstNewline = csvText.indexOf("\n");
  const headerLine = (firstNewline === -1 ? csvText : csvText.slice(0, firstNewline)).replace(/^\uFEFF/, "").trim();

  if (!headerLine) return null;

  const headers = parseCsvLine(headerLine).map((h) => h.trim());
  const headerSet = new Set(headers);

  // Korea Lotto 6/45
  if (
    headerSet.has("drawNo") &&
    headerSet.has("date") &&
    headerSet.has("n1") &&
    headerSet.has("bonus")
  ) {
    return "korea_lotto_645";
  }

  // Australia Games
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