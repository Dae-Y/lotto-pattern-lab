/**
 * Theoretical expected values for a uniformly random lottery draw.
 *
 * Formulas use:
 *   n = range (e.g. 1–47 → n = 47)
 *   k = count of main numbers drawn per draw
 *
 * These are analytical expectations — no simulation involved.
 */

export function getRandomBaseline(config) {
  const n = config.main.range;
  const k = config.main.count;

  return {
    expectedAverageSum: k * (n + 1) / 2,
    expectedRepeatFromPrevious: (k * k) / n,
    expectedSpread: ((k - 1) * (n + 1)) / (k + 1),
    expectedConsecutivePairs: (k * (k - 1)) / n,
  };
}
