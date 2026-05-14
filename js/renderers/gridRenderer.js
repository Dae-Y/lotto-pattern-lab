import { formatDateShort } from "../utils/dateUtils.js";
import { range } from "../utils/numberUtils.js";

export function renderRecentGrid(container, draws, config, limit = 10) {
  container.innerHTML = "";

  if (!draws || draws.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        No draw data loaded yet. Upload a CSV or load one from the data folder.
      </div>
    `;
    return;
  }

  const recentDraws = draws.slice(0, limit);

  const legend = createLegend(config);
  const wrapper = document.createElement("div");
  wrapper.className = "grid-wrapper";

  const table = document.createElement("table");
  table.className = "result-table";

  table.appendChild(createTableHead(config));
  table.appendChild(createTableBody(recentDraws, config));

  wrapper.appendChild(table);

  container.appendChild(legend);
  container.appendChild(wrapper);
}

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