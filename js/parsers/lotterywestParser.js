import { parseCsv } from "./csvParser.js";
import { parseDrawDate } from "../utils/dateUtils.js";

export function parseLotterywestCsv(csvText, config) {
  const rows = parseCsv(csvText);

  const draws = rows
    .map((row) => parseLotteryRow(row, config))
    .filter((draw) => draw !== null)
    .sort((a, b) => b.drawNumber - a.drawNumber);

  return draws;
}

function parseLotteryRow(row, config) {
  const drawNumber = toInteger(row["Draw number"]);
  const drawDate = parseDrawDate(row["Draw date"]);

  if (!drawNumber || !drawDate) {
    return null;
  }

  if (
    config.currentFormatStartDraw &&
    drawNumber < config.currentFormatStartDraw
  ) {
    return null;
  }

  const mainNumbers = readNumberGroup(row, config.main);
  const secondaryNumbers = readNumberGroup(row, config.secondary);

  if (!isValidNumberGroup(mainNumbers, config.main)) {
    return null;
  }

  if (!isValidNumberGroup(secondaryNumbers, config.secondary)) {
    return null;
  }

  return {
    gameId: config.id,
    drawNumber,
    drawDate,
    drawDateRaw: row["Draw date"],
    mainNumbers,
    secondaryNumbers,
  };
}

function readNumberGroup(row, groupConfig) {
  const numbers = [];

  for (let i = 1; i <= groupConfig.count; i += 1) {
    const columnName = getColumnName(row, groupConfig, i);
    const value = toInteger(row[columnName]);

    if (value !== null) {
      numbers.push(value);
    }
  }

  return numbers;
}

function getColumnName(row, groupConfig, index) {
  const directColumnName = groupConfig.columnPrefix;
  const numberedColumnName = `${groupConfig.columnPrefix} ${index}`;

  if (groupConfig.count === 1 && Object.hasOwn(row, directColumnName)) {
    return directColumnName;
  }

  return numberedColumnName;
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