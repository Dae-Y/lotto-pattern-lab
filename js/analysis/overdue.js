import { range } from "../utils/numberUtils.js";

export function getOverdueNumbers(draws, config, type = "main", limit = 10) {
  const groupConfig = type === "secondary" ? config.secondary : config.main;
  const numbersKey = type === "secondary" ? "secondaryNumbers" : "mainNumbers";

  const overdueList = range(1, groupConfig.range).map((number) => {
    const lastSeenIndex = draws.findIndex((draw) => {
      return draw[numbersKey].includes(number);
    });

    return {
      number,
      drawsAgo: lastSeenIndex === -1 ? null : lastSeenIndex,
    };
  });

  return overdueList
    .sort((a, b) => {
      if (a.drawsAgo === null && b.drawsAgo !== null) return -1;
      if (a.drawsAgo !== null && b.drawsAgo === null) return 1;
      return b.drawsAgo - a.drawsAgo || a.number - b.number;
    })
    .slice(0, limit);
}