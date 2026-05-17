import { parseCsv } from "./csvParser.js";
import { parseDrawDate } from "../utils/dateUtils.js";

export function parseKoreaLotto645Csv(csvText, config) {
  const rows = parseCsv(csvText);

  const draws = rows
    .map((row) => parseKoreaRow(row, config))
    .filter((draw) => draw !== null)
    .sort((a, b) => b.drawNumber - a.drawNumber);

  return draws;
}

function parseKoreaRow(row, config) {
  const drawNumber = toInteger(row["drawNo"]);
  const rawDate = row["date"] || row["drawDate"];
  const drawDate = parseDrawDate(rawDate);

  if (!drawNumber || !drawDate) {
    return null;
  }

  const mainNumbers = [
    toInteger(row["n1"]),
    toInteger(row["n2"]),
    toInteger(row["n3"]),
    toInteger(row["n4"]),
    toInteger(row["n5"]),
    toInteger(row["n6"]),
  ].filter(n => n !== null);

  const bonus = toInteger(row["bonus"]);
  const secondaryNumbers = bonus !== null ? [bonus] : [];

  if (!isValidNumberGroup(mainNumbers, config.main)) {
    return null;
  }

  if (!isValidNumberGroup(secondaryNumbers, config.secondary)) {
    return null;
  }

  // Bonus should not overlap with main numbers
  if (mainNumbers.includes(bonus)) {
    return null;
  }

  // Check duplicates in main numbers
  if (new Set(mainNumbers).size !== mainNumbers.length) {
    return null;
  }

  return {
    gameId: config.id,
    drawNumber,
    drawDate,
    drawDateRaw: rawDate,
    mainNumbers,
    secondaryNumbers,
  };
}

function isValidNumberGroup(numbers, groupConfig) {
  if (numbers.length !== groupConfig.count) {
    return false;
  }

  return numbers.every((number) => {
    return number >= 1 && number <= groupConfig.range;
  });
}

function toInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? null : parsed;
}
