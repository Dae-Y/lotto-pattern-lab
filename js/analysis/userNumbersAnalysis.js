import {
  sum as calcSum,
  countOddEven,
  getSpread,
  countConsecutivePairs,
  countRepeatsFromPrevious,
  average
} from "../utils/numberUtils.js";
import { getFrequencyMap } from "./frequency.js";

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

  let recentDrawSums = [];
  let mainFrequencies = [];
  let secondaryFrequencies = [];

  if (draws && draws.length > 0) {
    const historicalSums = draws.map(d => calcSum(d.mainNumbers));
    const historicalSpreads = draws.map(d => getSpread(d.mainNumbers));
    const historicalConsecutivePairs = draws.map(d => countConsecutivePairs(d.mainNumbers));

    averageSum = average(historicalSums);
    averageSpread = average(historicalSpreads);
    averageConsecutivePairs = average(historicalConsecutivePairs);

    comparisonSum = getComparison(sumVal, averageSum);
    comparisonSpread = getComparison(spreadVal, averageSpread);

    // Extract recent 5 draws (chronological order: oldest first)
    const last5 = draws.slice(0, 5);
    recentDrawSums = [...last5].reverse().map(d => ({
      drawNumber: d.drawNumber,
      sum: calcSum(d.mainNumbers)
    }));

    // Historical frequency of each entered number
    const mainFreqMap = getFrequencyMap(draws, config, "main");
    mainFrequencies = sortedMain.map(num => ({
      number: num,
      count: mainFreqMap.get(num) ?? 0
    }));

    if (config.secondary) {
      const secFreqMap = getFrequencyMap(draws, config, "secondary");
      secondaryFrequencies = sortedSecondary.map(num => ({
        number: num,
        count: secFreqMap.get(num) ?? 0
      }));
    }
  } else {
    mainFrequencies = sortedMain.map(num => ({ number: num, count: 0 }));
    secondaryFrequencies = sortedSecondary.map(num => ({ number: num, count: 0 }));
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
    recentDrawSums,
    mainFrequencies,
    secondaryFrequencies,
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
