import { parseLotterywestCsv } from "./lotterywestParser.js";
import { parseKoreaLotto645Csv } from "./koreaLotto645Parser.js";

export function parseCsvForGame(csvText, config) {
  if (config.parserType === "korea-lotto-645") {
    return parseKoreaLotto645Csv(csvText, config);
  }

  if (config.parserType === "lotterywest") {
    return parseLotterywestCsv(csvText, config);
  }

  throw new Error(`Unsupported parser type: ${config.parserType}`);
}
