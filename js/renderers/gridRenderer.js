import { formatDateShort } from "../utils/dateUtils.js";
import { range } from "../utils/numberUtils.js";

/**
 * Render recent draw results supporting table and compact view modes.
 * @param {HTMLElement} container
 * @param {Array} draws
 * @param {Object} config
 * @param {Object} options - { limit: number, viewMode: "table"|"compact" }
 */
export function renderRecentResults(container, draws, config, options = {}, copy) {
  const { limit = 10, viewMode = "table", orderAscending = false } = options;

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

  if (viewMode === "compact") {
    const legend = createLegend(config, copy);
    container.appendChild(legend);

    const scrollArea = document.createElement("div");
    scrollArea.className = "recent-scroll-area";
    scrollArea.appendChild(renderCompactView(recentDraws, config, copy, orderAscending));
    container.appendChild(scrollArea);
  } else {
    const legend = createLegend(config, copy);
    container.appendChild(legend);

    if (copy?.recent?.scrollHelper || true) {
      const helper = document.createElement("div");
      helper.className = "recent-scroll-helper";
      helper.style.fontSize = "13px";
      helper.style.color = "var(--muted)";
      helper.style.marginBottom = "8px";
      helper.textContent = copy?.recent?.scrollHelper ?? "Tip: Scroll horizontally to view all number columns.";
      container.appendChild(helper);
    }

    const wrapper = document.createElement("div");
    wrapper.className = "grid-wrapper";

    const table = document.createElement("table");
    table.className = "result-table";
    table.appendChild(createTableHead(config, copy));
    table.appendChild(createTableBody(recentDraws, config, copy));

    wrapper.appendChild(table);
    container.appendChild(wrapper);
  }
}

/* ── Compact View ── */

function renderCompactView(draws, config, copy, orderAscending = false) {
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
      <div class="compact-draw-date">${formatDateShort(draw.drawDate, copy?.locale ?? config.locale ?? "en-AU")}</div>
    `;

    // Ball row
    const ballRow = document.createElement("div");
    ballRow.className = "compact-ball-row";

    let mainNumbers = draw.mainNumbers;
    let secondaryNumbers = draw.secondaryNumbers;

    if (orderAscending) {
      mainNumbers = [...mainNumbers].sort((a, b) => a - b);
      secondaryNumbers = [...secondaryNumbers].sort((a, b) => a - b);
    }

    mainNumbers.forEach((number) => {
      const ball = document.createElement("span");
      ball.className = "lottery-ball compact-result-ball main-ball";
      ball.textContent = number;
      ballRow.appendChild(ball);
    });

    // Separator
    const separator = document.createElement("span");
    separator.className = "compact-separator";
    separator.textContent = config.display?.compactSecondaryLabel || config.secondary.label;
    ballRow.appendChild(separator);

    secondaryNumbers.forEach((number) => {
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

function createLegend(config, copy) {
  const legend = document.createElement("div");
  legend.className = "legend";

  const mainItem = document.createElement("span");
  mainItem.className = "legend-item";
  mainItem.innerHTML = `
    <span class="legend-box main-hit"></span>
    ${copy ? copy.recent.legendMain : `${config.display.mainMark} = ${config.main.label}`}
  `;

  const secondaryItem = document.createElement("span");
  secondaryItem.className = "legend-item";
  secondaryItem.innerHTML = `
    <span class="legend-box ${config.display.secondaryClass}"></span>
    ${copy ? copy.recent.legendSecondary : `${config.display.secondaryMark} = ${config.secondary.label}`}
  `;

  legend.appendChild(mainItem);
  legend.appendChild(secondaryItem);

  return legend;
}

function createTableHead(config, copy) {
  const thead = document.createElement("thead");

  const groupRow = document.createElement("tr");
  const drawLabel = copy ? copy.recent.draw : "Draw";
  const dateLabel = copy ? copy.recent.date : "Date";
  
  groupRow.appendChild(createHeaderCell(drawLabel, "sticky-col sticky-corner", 2));
  groupRow.appendChild(createHeaderCell(dateLabel, "sticky-col second sticky-corner", 2));

  const mainHeaderStr = copy && copy.recent.draw === "회차" ? `${config.main.label} 1\u2013${config.main.range}` : `${config.main.label} Numbers 1-${config.main.range}`;
  const mainHeader = createHeaderCell(
    "",
    "number-group-header",
    1,
  );
  mainHeader.innerHTML = `<span class="group-header-label">${mainHeaderStr}</span>`;
  mainHeader.colSpan = config.main.range;
  groupRow.appendChild(mainHeader);

  if (!config.secondary.sharesMainGrid) {
    const secondaryHeaderStr = copy && copy.recent.draw === "회차" ? `${config.secondary.label} 1\u2013${config.secondary.range}` : `${config.secondary.label} 1-${config.secondary.range}`;
    const secondaryHeader = createHeaderCell(
      "",
      "number-group-header",
      1,
    );
    secondaryHeader.innerHTML = `<span class="group-header-label">${secondaryHeaderStr}</span>`;
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

function createTableBody(draws, config, copy) {
  const tbody = document.createElement("tbody");

  draws.forEach((draw) => {
    const row = document.createElement("tr");

    const drawCell = document.createElement("td");
    drawCell.className = "sticky-col";
    drawCell.textContent = draw.drawNumber;
    row.appendChild(drawCell);

    const dateCell = document.createElement("td");
    dateCell.className = "sticky-col second";
    dateCell.textContent = formatDateShort(draw.drawDate, copy?.locale ?? config.locale ?? "en-AU");
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