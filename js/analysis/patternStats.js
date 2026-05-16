import {
  average,
  countOddEven,
  countConsecutivePairs,
  countRepeatsFromPrevious,
  spread,
  sum,
} from "../utils/numberUtils.js";

import { getExpectedRandom } from "./randomBaseline.js";

export function getPatternSummary(draws, config) {
  const latestDraw = draws[0];

  // ── Sum ──
  const mainSums = draws.map((draw) => sum(draw.mainNumbers));

  // ── Odd / Even ──
  const oddEvenCounts = new Map();

  draws.forEach((draw) => {
    const { odd, even } = countOddEven(draw.mainNumbers);
    const key = `${odd} odd / ${even} even`;
    oddEvenCounts.set(key, (oddEvenCounts.get(key) ?? 0) + 1);
  });

  const mostCommonOddEven = Array.from(oddEvenCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const latestOddEvenCount = countOddEven(latestDraw.mainNumbers);

  // ── Spread ──
  const spreads = draws.map((draw) => spread(draw.mainNumbers));

  // ── Consecutive pairs ──
  const consecutiveCounts = draws.map((draw) =>
    countConsecutivePairs(draw.mainNumbers),
  );

  const consecutiveFreqs = new Map();
  consecutiveCounts.forEach((c) => {
    consecutiveFreqs.set(c, (consecutiveFreqs.get(c) ?? 0) + 1);
  });

  const mostCommonConsecutivePairCount = Array.from(consecutiveFreqs.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

  const drawsWithConsecutive = consecutiveCounts.filter((c) => c > 0).length;

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

  const repeatFreqs = new Map();
  repeatCounts.forEach((c) => {
    repeatFreqs.set(c, (repeatFreqs.get(c) ?? 0) + 1);
  });

  const mostCommonRepeatCount = repeatCounts.length > 0
    ? Array.from(repeatFreqs.entries()).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // ── Random baseline ──
  const expected = getExpectedRandom(config);

  return {
    // Dataset
    totalDraws: draws.length,
    mainRange: config.main.range,

    // Sum
    averageSum: round2(average(mainSums)),
    latestSum: sum(latestDraw.mainNumbers),
    minSum: Math.min(...mainSums),
    maxSum: Math.max(...mainSums),

    // Odd / Even
    mostCommonOddEven,
    latestOddEven: `${latestOddEvenCount.odd} odd / ${latestOddEvenCount.even} even`,

    // Spread
    averageSpread: round2(average(spreads)),
    latestSpread: spread(latestDraw.mainNumbers),
    minSpread: Math.min(...spreads),
    maxSpread: Math.max(...spreads),

    // Repeat from previous draw
    hasRepeatData,
    latestRepeatFromPrevious: hasRepeatData ? repeatCounts[0] : null,
    averageRepeatFromPrevious: hasRepeatData ? round2(average(repeatCounts)) : null,
    mostCommonRepeatCount,
    maxRepeatObserved: hasRepeatData ? Math.max(...repeatCounts) : null,

    // Consecutive numbers
    latestConsecutivePairs: consecutiveCounts[0],
    averageConsecutivePairs: round2(average(consecutiveCounts)),
    percentageOfDrawsWithConsecutiveNumbers: round2(
      (drawsWithConsecutive / draws.length) * 100,
    ),
    mostCommonConsecutivePairCount,

    // Random baseline
    expected,
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}