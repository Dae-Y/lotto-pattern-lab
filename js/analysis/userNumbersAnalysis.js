import {
  sum as calcSum,
  countOddEven,
  getSpread,
  countConsecutivePairs,
  countRepeatsFromPrevious,
  average
} from "../utils/numberUtils.js";

/**
 * Analyzes the user's selected numbers against the active game configuration and historical draws.
 * 
 * @param {Object} params
 * @param {number[]} params.mainNumbers - The entered main numbers
 * @param {number[]} [params.secondaryNumbers=[]] - The entered secondary numbers
 * @param {Object[]} [params.draws=[]] - The historical draws loaded for the current game
 * @param {Object} params.config - The active game configuration
 * @returns {Object} The statistical analysis result
 */
export function analyzeUserNumbers({ mainNumbers, secondaryNumbers = [], draws = [], config }) {
  const sortedMain = [...mainNumbers].sort((a, b) => a - b);
  const sortedSecondary = [...secondaryNumbers].sort((a, b) => a - b);

  const sumVal = calcSum(sortedMain);
  const { odd, even } = countOddEven(sortedMain);
  const spreadVal = getSpread(sortedMain);
  const consecutivePairsVal = countConsecutivePairs(sortedMain);

  const latestDraw = draws && draws.length > 0 ? draws[0] : null;
  const repeatWithLatestVal = latestDraw 
    ? countRepeatsFromPrevious(sortedMain, latestDraw.mainNumbers) 
    : 0;

  let averageSum = null;
  let averageSpread = null;
  let averageConsecutivePairs = null;
  let comparisonSum = null;
  let comparisonSpread = null;

  if (draws && draws.length > 0) {
    const historicalSums = draws.map(d => calcSum(d.mainNumbers));
    const historicalSpreads = draws.map(d => getSpread(d.mainNumbers));
    const historicalConsecutivePairs = draws.map(d => countConsecutivePairs(d.mainNumbers));

    averageSum = average(historicalSums);
    averageSpread = average(historicalSpreads);
    averageConsecutivePairs = average(historicalConsecutivePairs);

    comparisonSum = getComparison(sumVal, averageSum);
    comparisonSpread = getComparison(spreadVal, averageSpread);
  }

  return {
    mainNumbers: sortedMain,
    secondaryNumbers: sortedSecondary,
    sum: sumVal,
    oddCount: odd,
    evenCount: even,
    spread: spreadVal,
    consecutivePairs: consecutivePairsVal,
    repeatWithLatest: repeatWithLatestVal,
    historical: {
      averageSum: averageSum !== null ? Number(averageSum.toFixed(2)) : null,
      averageSpread: averageSpread !== null ? Number(averageSpread.toFixed(2)) : null,
      averageConsecutivePairs: averageConsecutivePairs !== null ? Number(averageConsecutivePairs.toFixed(2)) : null,
    },
    comparison: {
      sum: comparisonSum,
      spread: comparisonSpread,
    },
  };
}

/**
 * Compares a user metric to the historical average.
 * - "close" if within 10% of the historical average
 * - "lower" if below that range
 * - "higher" if above that range
 * 
 * @param {number} value 
 * @param {number} avg 
 * @returns {string|null} "close" | "lower" | "higher" | null
 */
function getComparison(value, avg) {
  if (avg === null || avg === undefined || avg === 0) return null;
  const margin = 0.10 * avg;
  if (Math.abs(value - avg) <= margin) {
    return "close";
  } else if (value < avg) {
    return "lower";
  } else {
    return "higher";
  }
}
