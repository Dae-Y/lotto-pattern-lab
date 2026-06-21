import { countOddEven, sum, countConsecutivePairs, countRepeatsFromPrevious } from "../utils/numberUtils.js";

export function getOddEvenDistribution(draws) {
  if (!draws || draws.length === 0) return [];
  const totalCount = draws[0].mainNumbers.length;
  const counts = new Map();

  draws.forEach((draw, index) => {
    const { odd, even } = countOddEven(draw.mainNumbers);
    const label = `${odd} odd / ${even} even`;
    
    if (!counts.has(label)) {
      counts.set(label, { count: 0, isLatest: false, oddCount: odd });
    }
    
    counts.get(label).count++;
    
    if (index === 0) {
      counts.get(label).isLatest = true;
    }
  });

  return Array.from(counts.values()).map(item => ({
    label: `${item.oddCount} odd / ${totalCount - item.oddCount} even`,
    count: item.count,
    isLatest: item.isLatest,
    sortKey: item.oddCount
  })).sort((a, b) => a.sortKey - b.sortKey);
}

export function getSumDistribution(draws, binSize = 20) {
  if (!draws || draws.length === 0) return [];
  
  const sums = draws.map(draw => sum(draw.mainNumbers));
  const minSum = Math.min(...sums);
  const maxSum = Math.max(...sums);
  
  const startBin = Math.floor(minSum / binSize) * binSize;
  const bins = new Map();
  
  for (let i = startBin; i <= maxSum; i += binSize) {
    bins.set(i, { count: 0, isLatest: false, start: i, end: i + binSize - 1 });
  }

  sums.forEach((s, index) => {
    const binKey = Math.floor(s / binSize) * binSize;
    if (bins.has(binKey)) {
      bins.get(binKey).count++;
      if (index === 0) {
        bins.get(binKey).isLatest = true;
      }
    }
  });

  return Array.from(bins.values()).map(bin => ({
    label: `${bin.start}\u2013${bin.end}`,
    count: bin.count,
    isLatest: bin.isLatest,
    sortKey: bin.start
  })).sort((a, b) => a.sortKey - b.sortKey);
}

export function getRepeatDistribution(draws) {
  if (!draws || draws.length < 2) return [];

  const counts = new Map();

  for (let i = 0; i < draws.length - 1; i++) {
    const repeats = countRepeatsFromPrevious(draws[i].mainNumbers, draws[i + 1].mainNumbers);
    const label = `${repeats} repeat${repeats === 1 ? '' : 's'}`;
    
    if (!counts.has(label)) {
      counts.set(label, { label, count: 0, isLatest: false, repeatCount: repeats });
    }
    
    counts.get(label).count++;
    
    if (i === 0) {
      counts.get(label).isLatest = true;
    }
  }

  return Array.from(counts.values()).map(item => ({
    label: item.label,
    count: item.count,
    isLatest: item.isLatest,
    sortKey: item.repeatCount
  })).sort((a, b) => a.sortKey - b.sortKey);
}

export function getConsecutiveDistribution(draws) {
  const counts = new Map();

  draws.forEach((draw, index) => {
    const pairs = countConsecutivePairs(draw.mainNumbers);
    const label = `${pairs} pair${pairs === 1 ? '' : 's'}`;
    
    if (!counts.has(label)) {
      counts.set(label, { label, count: 0, isLatest: false, pairCount: pairs });
    }
    
    counts.get(label).count++;
    
    if (index === 0) {
      counts.get(label).isLatest = true;
    }
  });

  return Array.from(counts.values()).map(item => ({
    label: item.label,
    count: item.count,
    isLatest: item.isLatest,
    sortKey: item.pairCount
  })).sort((a, b) => a.sortKey - b.sortKey);
}
