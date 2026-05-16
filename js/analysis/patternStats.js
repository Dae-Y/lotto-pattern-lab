import {
  average,
  countOddEven,
  countConsecutivePairs,
  countRepeatsFromPrevious,
  getSpread,
  sum,
  getMode,
  formatNumber,
  formatPercent,
} from "../utils/numberUtils.js";

import { getRandomBaseline } from "./randomBaseline.js";

export function getPatternSummary(draws, config) {
  const latestDraw = draws[0];

  // ── Sum ──
  const mainSums = draws.map((draw) => sum(draw.mainNumbers));
  const avgSum = average(mainSums);

  // ── Odd / Even ──
  const oddEvenStrings = draws.map((draw) => {
    const { odd, even } = countOddEven(draw.mainNumbers);
    return `${odd} odd / ${even} even`;
  });

  const mostCommonOddEven = getMode(oddEvenStrings) ?? "N/A";
  const latestOddEvenCount = countOddEven(latestDraw.mainNumbers);

  // ── Spread ──
  const spreads = draws.map((draw) => getSpread(draw.mainNumbers));
  const avgSpread = average(spreads);

  // ── Consecutive pairs ──
  const consecutiveCounts = draws.map((draw) =>
    countConsecutivePairs(draw.mainNumbers),
  );
  const avgConsecutive = average(consecutiveCounts);

  const mostCommonConsecutivePairCount = getMode(consecutiveCounts) ?? 0;
  const drawsWithConsecutive = consecutiveCounts.filter((c) => c > 0).length;
  const percentConsecutive = draws.length > 0 ? drawsWithConsecutive / draws.length : 0;

  // ── Repeat from previous draw ──
  const hasRepeatData = draws.length >= 2;
  let repeatCounts = [];

  if (hasRepeatData) {
    for (let i = 0; i < draws.length - 1; i++) {
      repeatCounts.push(
        countRepeatsFromPrevious(
          draws[i].mainNumbers,
          draws[i + 1].mainNumbers,
        ),
      );
    }
  }

  const avgRepeat = hasRepeatData ? average(repeatCounts) : null;
  const mostCommonRepeatCount = hasRepeatData ? (getMode(repeatCounts) ?? 0) : null;

  // ── Random baseline ──
  const expected = getRandomBaseline(config);

  return {
    // Dataset
    totalDraws: draws.length,
    mainRange: config.main.range,

    // Sum
    averageSum: formatNumber(avgSum, 2),
    latestSum: sum(latestDraw.mainNumbers),
    minSum: Math.min(...mainSums),
    maxSum: Math.max(...mainSums),

    // Odd / Even
    mostCommonOddEven,
    latestOddEven: `${latestOddEvenCount.odd} odd / ${latestOddEvenCount.even} even`,

    // Spread
    averageSpread: formatNumber(avgSpread, 2),
    latestSpread: getSpread(latestDraw.mainNumbers),
    minSpread: Math.min(...spreads),
    maxSpread: Math.max(...spreads),

    // Repeat from previous draw
    latestRepeatFromPrevious: hasRepeatData ? repeatCounts[0] : null,
    averageRepeatFromPrevious: hasRepeatData ? formatNumber(avgRepeat, 2) : null,
    mostCommonRepeatCount,
    maxRepeatObserved: hasRepeatData ? Math.max(...repeatCounts) : null,

    // Consecutive numbers
    latestConsecutivePairs: consecutiveCounts[0],
    averageConsecutivePairs: formatNumber(avgConsecutive, 2),
    percentageOfDrawsWithConsecutiveNumbers: formatPercent(percentConsecutive),
    mostCommonConsecutivePairCount,

    // Observed vs expected random
    expectedAverageSum: formatNumber(expected.expectedAverageSum, 2),
    expectedRepeatFromPrevious: formatNumber(expected.expectedRepeatFromPrevious, 2),
    expectedSpread: formatNumber(expected.expectedSpread, 2),
    expectedConsecutivePairs: formatNumber(expected.expectedConsecutivePairs, 2),

    observedAverageSum: formatNumber(avgSum, 2),
    observedAverageRepeat: formatNumber(avgRepeat, 2),
    observedAverageSpread: formatNumber(avgSpread, 2),
    observedAverageConsecutivePairs: formatNumber(avgConsecutive, 2),
  };
}