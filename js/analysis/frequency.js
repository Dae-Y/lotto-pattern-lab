import { range } from "../utils/numberUtils.js";

export function getFrequencyMap(draws, config, type = "main") {
  const groupConfig = type === "secondary" ? config.secondary : config.main;
  const numbersKey = type === "secondary" ? "secondaryNumbers" : "mainNumbers";

  const frequencyMap = new Map();

  range(1, groupConfig.range).forEach((number) => {
    frequencyMap.set(number, 0);
  });

  draws.forEach((draw) => {
    draw[numbersKey].forEach((number) => {
      frequencyMap.set(number, (frequencyMap.get(number) ?? 0) + 1);
    });
  });

  return frequencyMap;
}

export function getTopFrequencies(draws, config, type = "main", limit = 10) {
  return mapToSortedFrequencyList(draws, config, type)
    .sort((a, b) => b.count - a.count || a.number - b.number)
    .slice(0, limit);
}

export function getBottomFrequencies(draws, config, type = "main", limit = 10) {
  return mapToSortedFrequencyList(draws, config, type)
    .sort((a, b) => a.count - b.count || a.number - b.number)
    .slice(0, limit);
}

function mapToSortedFrequencyList(draws, config, type) {
  const frequencyMap = getFrequencyMap(draws, config, type);

  return Array.from(frequencyMap.entries()).map(([number, count]) => {
    return { number, count };
  });
}