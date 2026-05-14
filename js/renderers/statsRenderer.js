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
    createSortableChipCard("Most frequent winning numbers", topMain, "times", "count"),
  );

  layout.appendChild(
    createSortableChipCard("Least frequent winning numbers", bottomMain, "times", "count"),
  );

  layout.appendChild(
    createSortableChipCard("Most overdue winning numbers", overdueMain, "draws ago", "drawsAgo"),
  );

  layout.appendChild(createPatternCard(patternSummary, config));

  const topSecondary = getTopFrequencies(draws, config, "secondary", 10);
  const overdueSecondary = getOverdueNumbers(draws, config, "secondary", 10);

  layout.appendChild(
    createSortableChipCard(`Most frequent ${config.secondary.label}`, topSecondary, "times", "count"),
  );

  layout.appendChild(
    createSortableChipCard(`Most overdue ${config.secondary.label}`, overdueSecondary, "draws ago", "drawsAgo"),
  );

  container.appendChild(layout);
}

/**
 * Creates a chip card with ▲▼ sort controls and ranking labels.
 * @param {string} title - Card heading text
 * @param {Array} items - Data items with number and count/drawsAgo
 * @param {string} suffix - Display suffix ("times" or "draws ago")
 * @param {string} sortKey - "count" or "drawsAgo"
 */
function createSortableChipCard(title, items, suffix, sortKey) {
  const card = document.createElement("article");
  card.className = "stat-card";

  // Header row: title + sort buttons
  const header = document.createElement("div");
  header.className = "stat-card-header";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const controls = document.createElement("span");
  controls.className = "sort-controls";

  const btnAsc = document.createElement("button");
  btnAsc.type = "button";
  btnAsc.className = "sort-btn";
  btnAsc.textContent = "\u25B2";
  btnAsc.title = "Sort ascending";
  btnAsc.setAttribute("aria-label", "Sort ascending");

  const btnDesc = document.createElement("button");
  btnDesc.type = "button";
  btnDesc.className = "sort-btn active";
  btnDesc.textContent = "\u25BC";
  btnDesc.title = "Sort descending";
  btnDesc.setAttribute("aria-label", "Sort descending");

  controls.appendChild(btnAsc);
  controls.appendChild(btnDesc);

  header.appendChild(heading);
  header.appendChild(controls);

  // Chip list
  const chipList = document.createElement("div");
  chipList.className = "chip-list";

  card.appendChild(header);
  card.appendChild(chipList);

  // Current sort direction: "desc" by default (matches initial data order)
  let currentDirection = "desc";

  function renderChips(direction) {
    const sorted = [...items].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);

      return direction === "asc" ? aVal - bVal : bVal - aVal;
    });

    chipList.innerHTML = "";

    sorted.forEach((item, index) => {
      const chip = document.createElement("span");
      chip.className = "number-chip";

      const displayValue =
        item.drawsAgo === null && sortKey === "drawsAgo"
          ? "never"
          : item.count ?? item.drawsAgo;

      const rank = index + 1;
      chip.innerHTML =
        `<span class="rank-label">#${rank}</span>` +
        `<strong>${item.number}</strong> · ${displayValue} ${suffix}`;

      chipList.appendChild(chip);
    });
  }

  // Initial render
  renderChips(currentDirection);

  // Sort button handlers
  btnAsc.addEventListener("click", () => {
    if (currentDirection === "asc") return;
    currentDirection = "asc";
    btnAsc.classList.add("active");
    btnDesc.classList.remove("active");
    renderChips("asc");
  });

  btnDesc.addEventListener("click", () => {
    if (currentDirection === "desc") return;
    currentDirection = "desc";
    btnDesc.classList.add("active");
    btnAsc.classList.remove("active");
    renderChips("desc");
  });

  return card;
}

/**
 * Extracts a numeric sort value from an item.
 * For overdue items, null drawsAgo → Infinity (most overdue).
 */
function getSortValue(item, sortKey) {
  if (sortKey === "drawsAgo") {
    return item.drawsAgo === null ? Infinity : item.drawsAgo;
  }

  return item.count ?? 0;
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