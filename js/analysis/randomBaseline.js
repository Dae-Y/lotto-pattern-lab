/**
 * Theoretical expected values for a uniformly random lottery draw.
 *
 * Formulas use:
 *   n = range (e.g. 1–47 → n = 47)
 *   k = count of main numbers drawn per draw
 *
 * These are analytical expectations — no simulation involved.
 */

export function getExpectedRandom(config) {
  const n = config.main.range;
  const k = config.main.count;

  return {
    expectedSum: round2(k * (n + 1) / 2),
    expectedRepeat: round2((k * k) / n),
    expectedSpread: round2(((k - 1) * (n + 1)) / (k + 1)),
    expectedConsecutivePairs: round2((k * (k - 1)) / n),
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
