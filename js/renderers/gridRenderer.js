import { formatDateShort } from "../utils/dateUtils.js";
import { range } from "../utils/numberUtils.js";

/**
 * Render recent draw results supporting table and compact view modes.
 * @param {HTMLElement} container
 * @param {Array} draws
 * @param {Object} config
 * @param {Object} options - { limit: number, viewMode: "table"|"compact" }
 */
export function renderRecentResults(container, draws, config, options = {}) {
  const { limit = 10, viewMode = "table" } = options;

  container.innerHTML = "";

  if (!draws || draws.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No draw data loaded yet. Upload a CSV or load one from the data folder.
      </div>
    `;
    return;
  }

  const effectiveLimit = Math.min(limit, draws.length);
  const recentDraws = draws.slice(0, effectiveLimit);

  // Warning if requested more than available
  if (limit > draws.length) {
    const warning = document.createElement("div");
    warning.className = "recent-warning";
    warning.textContent = `Showing ${draws.length.toLocaleString()} available current-format draws. Older rows may use unsupported historical formats.`;
    container.appendChild(warning);
  }

  // Scroll area wrapper
  const scrollArea = document.createElement("div");
  scrollArea.className = "recent-scroll-area";

  if (viewMode === "compact") {
    scrollArea.appendChild(renderCompactView(recentDraws, config));
  } else {
    const legend = createLegend(config);
    container.appendChild(legend);

    const wrapper = document.createElement("div");
    wrapper.className = "grid-wrapper";

    const table = document.createElement("table");
    table.className = "result-table";
    table.appendChild(createTableHead(config));
    table.appendChild(createTableBody(recentDraws, config));

    wrapper.appendChild(table);
    scrollArea.appendChild(wrapper);
  }

  container.appendChild(scrollArea);
}

/* ── Compact View ── */

function renderCompactView(draws, config) {
  const list = document.createElement("div");
  list.className = "compact-results";

  const secondaryClass = config.secondary.sharesMainGrid
    ? "supplementary-ball"
    : "powerball-ball";

  draws.forEach((draw) => {
    const row = document.createElement("article");
    row.className = "compact-draw-row";

    // Meta column
    const meta = document.createElement("div");
    meta.className = "compact-draw-meta";
    meta.innerHTML = `
      <div class="compact-draw-number">#${draw.drawNumber}</div>
      <div class="compact-draw-date">${formatDateShort(draw.drawDate)}</div>
    `;

    // Ball row
    const ballRow = document.createElement("div");
    ballRow.className = "compact-ball-row";

    draw.mainNumbers.forEach((number) => {
      const ball = document.createElement("span");
      ball.className = "lottery-ball compact-result-ball main-ball";
      ball.textContent = number;
      ballRow.appendChild(ball);
    });

    // Separator
    const separator = document.createElement("span");
    separator.className = "compact-separator";
    separator.textContent = config.secondary.label;
    ballRow.appendChild(separator);

    draw.secondaryNumbers.forEach((number) => {
      const ball = document.createElement("span");
      ball.className = `lottery-ball compact-result-ball ${secondaryClass}`;
      ball.textContent = number;
      ballRow.appendChild(ball);
    });

    row.appendChild(meta);
    row.appendChild(ballRow);
    list.appendChild(row);
  });

  return list;
}

/* ── Table View Helpers ── */

function createLegend(config) {
  const legend = document.createElement("div");
  legend.className = "legend";

  const mainItem = document.createElement("span");
  mainItem.className = "legend-item";
  mainItem.innerHTML = `
    <span class="legend-box main-hit"></span>
    ${config.display.mainMark} = ${config.main.label}
  `;

  const secondaryItem = document.createElement("span");
  secondaryItem.className = "legend-item";
  secondaryItem.innerHTML = `
    <span class="legend-box ${config.display.secondaryClass}"></span>
    ${config.display.secondaryMark} = ${config.secondary.label}
  `;

  legend.appendChild(mainItem);
  legend.appendChild(secondaryItem);

  return legend;
}

function createTableHead(config) {
  const thead = document.createElement("thead");

  const groupRow = document.createElement("tr");
  groupRow.appendChild(createHeaderCell("Draw", "sticky-col", 2));
  groupRow.appendChild(createHeaderCell("Date", "sticky-col second", 2));

  const mainHeader = createHeaderCell(
    `${config.main.label} Numbers 1-${config.main.range}`,
    "",
    1,
  );
  mainHeader.colSpan = config.main.range;
  groupRow.appendChild(mainHeader);

  if (!config.secondary.sharesMainGrid) {
    const secondaryHeader = createHeaderCell(
      `${config.secondary.label} 1-${config.secondary.range}`,
      "",
      1,
    );
    secondaryHeader.colSpan = config.secondary.range;
    groupRow.appendChild(secondaryHeader);
  }

  const numberRow = document.createElement("tr");

  range(1, config.main.range).forEach((number) => {
    numberRow.appendChild(createHeaderCell(number));
  });

  if (!config.secondary.sharesMainGrid) {
    range(1, config.secondary.range).forEach((number) => {
      numberRow.appendChild(createHeaderCell(number));
    });
  }

  thead.appendChild(groupRow);
  thead.appendChild(numberRow);

  return thead;
}

function createTableBody(draws, config) {
  const tbody = document.createElement("tbody");

  draws.forEach((draw) => {
    const row = document.createElement("tr");

    const drawCell = document.createElement("td");
    drawCell.className = "sticky-col";
    drawCell.textContent = draw.drawNumber;
    row.appendChild(drawCell);

    const dateCell = document.createElement("td");
    dateCell.className = "sticky-col second";
    dateCell.textContent = formatDateShort(draw.drawDate);
    row.appendChild(dateCell);

    range(1, config.main.range).forEach((number) => {
      const cell = createNumberCell();

      if (draw.mainNumbers.includes(number)) {
        cell.classList.add("main-hit");
        cell.textContent = config.display.mainMark;
      } else if (
        config.secondary.sharesMainGrid &&
        draw.secondaryNumbers.includes(number)
      ) {
        cell.classList.add(config.display.secondaryClass);
        cell.textContent = config.display.secondaryMark;
      }

      row.appendChild(cell);
    });

    if (!config.secondary.sharesMainGrid) {
      range(1, config.secondary.range).forEach((number) => {
        const cell = createNumberCell();

        if (draw.secondaryNumbers.includes(number)) {
          cell.classList.add(config.display.secondaryClass);
          cell.textContent = config.display.secondaryMark;
        }

        row.appendChild(cell);
      });
    }

    tbody.appendChild(row);
  });

  return tbody;
}

function createHeaderCell(text, className = "", rowSpan = 1) {
  const th = document.createElement("th");
  th.textContent = text;

  if (className) {
    th.className = className;
  }

  if (rowSpan > 1) {
    th.rowSpan = rowSpan;
  }

  return th;
}

function createNumberCell() {
  const cell = document.createElement("td");
  cell.className = "number-cell";
  return cell;
}