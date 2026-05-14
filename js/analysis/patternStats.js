import {
  average,
  countOddEven,
  sum,
} from "../utils/numberUtils.js";

export function getPatternSummary(draws, config) {
  const mainSums = draws.map((draw) => sum(draw.mainNumbers));
  const latestDraw = draws[0];

  const oddEvenCounts = new Map();

  draws.forEach((draw) => {
    const { odd, even } = countOddEven(draw.mainNumbers);
    const key = `${odd} odd / ${even} even`;
    oddEvenCounts.set(key, (oddEvenCounts.get(key) ?? 0) + 1);
  });

  const mostCommonOddEven = Array.from(oddEvenCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const latestOddEvenCount = countOddEven(latestDraw.mainNumbers);

  return {
    totalDraws: draws.length,
    averageSum: Math.round(average(mainSums)),
    minSum: Math.min(...mainSums),
    maxSum: Math.max(...mainSums),
    mostCommonOddEven,
    latestOddEven: `${latestOddEvenCount.odd} odd / ${latestOddEvenCount.even} even`,
    latestSum: sum(latestDraw.mainNumbers),
    mainRange: config.main.range,
  };
}