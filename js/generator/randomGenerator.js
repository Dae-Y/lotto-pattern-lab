export function generateRandomEntries(config, count = 5) {
  return Array.from({ length: count }, () => generateRandomEntry(config));
}

export function generateRandomEntry(config) {
  const mainNumbers = pickUniqueNumbers(config.main.range, config.main.count);

  let secondaryNumbers = [];

  if (config.secondary) {
    if (config.secondary.drawOnly) {
      secondaryNumbers = [];
    } else if (config.secondary.sharesMainGrid) {
      const excluded = new Set(mainNumbers);
      secondaryNumbers = pickUniqueNumbers(
        config.secondary.range,
        config.secondary.count,
        excluded,
      );
    } else {
      secondaryNumbers = pickUniqueNumbers(
        config.secondary.range,
        config.secondary.count,
      );
    }
  }

  return {
    mainNumbers: mainNumbers.sort((a, b) => a - b),
    secondaryNumbers: secondaryNumbers.sort((a, b) => a - b),
  };
}

function pickUniqueNumbers(max, count, excluded = new Set()) {
  const picked = new Set();

  while (picked.size < count) {
    const value = Math.floor(Math.random() * max) + 1;

    if (!excluded.has(value)) {
      picked.add(value);
    }
  }

  return Array.from(picked);
}
