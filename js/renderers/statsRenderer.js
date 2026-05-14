import { getTopFrequencies, getBottomFrequencies } from "../analysis/frequency.js";
import { getOverdueNumbers } from "../analysis/overdue.js";
import { getPatternSummary } from "../analysis/patternStats.js";

export function renderStats(container, draws, config) {
  container.innerHTML = "";

  if (!draws || draws.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        Stats will appear after CSV data is loaded.
      </div>
    `;
    return;
  }

  const topMain = getTopFrequencies(draws, config, "main", 10);
  const bottomMain = getBottomFrequencies(draws, config, "main", 10);
  const overdueMain = getOverdueNumbers(draws, config, "main", 10);
  const patternSummary = getPatternSummary(draws, config);

  const layout = document.createElement("div");
  layout.className = "stats-layout";

  layout.appendChild(
    createChipCard("Most frequent winning numbers", topMain, "times"),
  );

  layout.appendChild(
    createChipCard("Least frequent winning numbers", bottomMain, "times"),
  );

  layout.appendChild(
    createChipCard("Most overdue winning numbers", overdueMain, "draws ago"),
  );

  layout.appendChild(createPatternCard(patternSummary, config));

  const topSecondary = getTopFrequencies(draws, config, "secondary", 10);
  const overdueSecondary = getOverdueNumbers(draws, config, "secondary", 10);

  layout.appendChild(
    createChipCard(`Most frequent ${config.secondary.label}`, topSecondary, "times"),
  );

  layout.appendChild(
    createChipCard(`Most overdue ${config.secondary.label}`, overdueSecondary, "draws ago"),
  );

  container.appendChild(layout);
}

function createChipCard(title, items, suffix) {
  const card = document.createElement("article");
  card.className = "stat-card";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const chipList = document.createElement("div");
  chipList.className = "chip-list";

  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "number-chip";

    const value =
      item.drawsAgo === null
        ? "never"
        : item.count ?? item.drawsAgo;

    chip.innerHTML = `<strong>${item.number}</strong> ${value} ${suffix}`;
    chipList.appendChild(chip);
  });

  card.appendChild(heading);
  card.appendChild(chipList);

  return card;
}

function createPatternCard(summary, config) {
  const card = document.createElement("article");
  card.className = "stat-card";

  card.innerHTML = `
    <h3>Pattern summary</h3>
    <ul class="pattern-list">
      <li>Total draws used: <strong>${summary.totalDraws}</strong></li>
      <li>Average sum: <strong>${summary.averageSum}</strong></li>
      <li>Lowest sum: <strong>${summary.minSum}</strong></li>
      <li>Highest sum: <strong>${summary.maxSum}</strong></li>
      <li>Most common odd/even: <strong>${summary.mostCommonOddEven}</strong></li>
      <li>Latest draw odd/even: <strong>${summary.latestOddEven}</strong></li>
      <li>Latest draw sum: <strong>${summary.latestSum}</strong></li>
      <li>Main range: <strong>1-${config.main.range}</strong></li>
    </ul>
  `;

  return card;
}