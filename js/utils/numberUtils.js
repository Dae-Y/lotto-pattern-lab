export function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function sum(numbers) {
  return numbers.reduce((total, number) => total + number, 0);
}

export function average(numbers) {
  if (!numbers || numbers.length === 0) {
    return 0;
  }

  return sum(numbers) / numbers.length;
}

export function countOddEven(numbers) {
  return numbers.reduce(
    (result, number) => {
      if (number % 2 === 0) {
        result.even += 1;
      } else {
        result.odd += 1;
      }

      return result;
    },
    { odd: 0, even: 0 },
  );
}

/**
 * Returns the spread (max − min) of a number array.
 */
export function spread(numbers) {
  return Math.max(...numbers) - Math.min(...numbers);
}

/**
 * Counts adjacent consecutive pairs in a sorted-ascending number array.
 * Example: [7, 8, 12, 18, 19, 28, 29] → 3  (7-8, 18-19, 28-29)
 */
export function countConsecutivePairs(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  let pairs = 0;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) {
      pairs++;
    }
  }

  return pairs;
}

/**
 * Counts how many numbers in `current` also appear in `previous`.
 */
export function countRepeatsFromPrevious(current, previous) {
  const prevSet = new Set(previous);
  return current.filter((n) => prevSet.has(n)).length;
}