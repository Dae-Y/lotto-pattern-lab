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