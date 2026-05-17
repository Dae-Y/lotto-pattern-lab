import {
  DEFAULT_GAME_ID,
  GAME_CONFIGS,
  detectGameIdFromCsvText,
  detectGameIdFromFileName,
  getGameConfig,
} from "./config/gameConfigs.js";

import { parseCsvLine } from "./parsers/csvParser.js";

import { parseLotteryCsv } from "./parsers/lotteryParser.js";
import { renderTabs } from "./renderers/tabsRenderer.js";
import { renderRecentResults } from "./renderers/gridRenderer.js";
import { renderStats } from "./renderers/statsRenderer.js";
import { renderPatternInsights } from "./renderers/patternInsightsRenderer.js";
import { renderGenerator } from "./renderers/generatorRenderer.js";
import { formatDateLong } from "./utils/dateUtils.js";

const state = {
  activeCountry: "australia",
  activeGameId: DEFAULT_GAME_ID,
  drawsByGameId: {},
  sourceByGameId: {},
  recentDrawLimit: 10,
  recentViewMode: "table",
};

const elements = {
  headerEyebrow: document.querySelector("#headerEyebrow"),
  headerTitle: document.querySelector("#headerTitle"),
  headerSubtitle: document.querySelector("#headerSubtitle"),
  countryBtns: document.querySelectorAll(".country-btn"),
  australiaApp: document.querySelector("#australiaApp"),
  koreaPlaceholder: document.querySelector("#koreaPlaceholder"),
  
  tabs: document.querySelector("#tabs"),
  csvInput: document.querySelector("#csvInput"),
  loadSampleBtn: document.querySelector("#loadSampleBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  status: document.querySelector("#status"),
  compactMeta: document.querySelector("#compactMeta"),
  recentGrid: document.querySelector("#recentGrid"),
  recentDrawCount: document.querySelector("#recentDrawCount"),
  tableViewBtn: document.querySelector("#tableViewBtn"),
  compactViewBtn: document.querySelector("#compactViewBtn"),
  stats: document.querySelector("#stats"),
  patternInsights: document.querySelector("#patternInsights"),
  generator: document.querySelector("#generator"),
};

init();

function init() {
  renderAll();

  elements.countryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setActiveCountry(btn.dataset.country);
    });
  });

  elements.loadSampleBtn.addEventListener("click", () => {
    loadSampleCsvForActiveGame();
  });

  elements.csvInput.addEventListener("change", handleCsvUpload);

  elements.clearBtn.addEventListener("click", () => {
    clearActiveGameData();
  });

  elements.recentDrawCount.addEventListener("input", handleDrawCountChange);

  elements.tableViewBtn.addEventListener("click", () => {
    setViewMode("table");
  });

  elements.compactViewBtn.addEventListener("click", () => {
    setViewMode("compact");
  });

  loadSampleCsvForActiveGame();
}

function setActiveCountry(country) {
  state.activeCountry = country;

  // Update active button state
  elements.countryBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.country === country);
  });

  if (country === "australia") {
    elements.australiaApp.style.display = "block";
    elements.koreaPlaceholder.style.display = "none";
    
    elements.headerEyebrow.textContent = "Lotterywest CSV Visualiser";
    elements.headerTitle.textContent = "Lotto Pattern Lab";
    elements.headerSubtitle.textContent = "Upload lottery result CSV files, visualise recent draws, and explore simple number patterns.";
  } else if (country === "korea") {
    elements.australiaApp.style.display = "none";
    elements.koreaPlaceholder.style.display = "block";
    
    elements.headerEyebrow.textContent = "동행복권 분석기";
    elements.headerTitle.textContent = "한국 로또 6/45 Lab";
    elements.headerSubtitle.textContent = "한국 로또 6/45 분석 기능은 현재 제작 중입니다.";
  }
}

function handleDrawCountChange() {
  const parsed = parseInt(elements.recentDrawCount.value, 10);
  state.recentDrawLimit = parsed > 0 ? parsed : 1;
  renderRecent();
}

function setViewMode(mode) {
  state.recentViewMode = mode;

  elements.tableViewBtn.classList.toggle("active", mode === "table");
  elements.compactViewBtn.classList.toggle("active", mode === "compact");

  renderRecent();
}

function renderRecent() {
  const config = getGameConfig(state.activeGameId);
  const draws = state.drawsByGameId[state.activeGameId] ?? [];

  renderRecentResults(elements.recentGrid, draws, config, {
    limit: state.recentDrawLimit,
    viewMode: state.recentViewMode,
  });
}

function renderAll() {
  const config = getGameConfig(state.activeGameId);
  const draws = state.drawsByGameId[state.activeGameId] ?? [];

  renderTabs(elements.tabs, GAME_CONFIGS, state.activeGameId, handleTabChange);
  renderCompactMeta(elements.compactMeta, draws, config);
  renderRecentResults(elements.recentGrid, draws, config, {
    limit: state.recentDrawLimit,
    viewMode: state.recentViewMode,
  });
  renderStats(elements.stats, draws, config);

  try {
    renderPatternInsights(elements.patternInsights, draws, config);
  } catch (error) {
    console.error("Pattern Insights failed:", error);
  
    if (elements.patternInsights) {
      elements.patternInsights.innerHTML = `
        <div class="empty-state">
          Pattern Insights could not be rendered.
        </div>
      `;
    }
  }

  renderGenerator(elements.generator, config);
}

function handleTabChange(gameId) {
  state.activeGameId = gameId;
  renderAll();

  if (!state.drawsByGameId[gameId]) {
    loadSampleCsvForActiveGame();
  }
}

async function loadSampleCsvForActiveGame() {
  const config = getGameConfig(state.activeGameId);
  const path = `./data/${config.fileName}`;
  const sourceLabel = "Lotterywest public results data";

  setStatus(`Loading ${config.name} data...`);

  try {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Could not load ${config.name} data.`);
    }

    const csvText = await response.text();
    loadCsvText(csvText, config, sourceLabel);
  } catch (error) {
    setStatus(
      `Could not load ${config.name} data. Upload the CSV manually or run the project with a local server.`,
      true,
    );
  }
}

function handleCsvUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const sourceLabel = "Uploaded CSV";
  const reader = new FileReader();

  reader.onload = () => {
    const csvText = String(reader.result);

    // Detect game type from CSV headers first, fall back to file name
    let detectedGameId = detectGameIdFromCsvText(csvText, parseCsvLine);

    if (!detectedGameId) {
      detectedGameId = detectGameIdFromFileName(file.name);
    }

    if (!detectedGameId) {
      setStatus(
        "Could not detect the lottery game from this CSV. Please use an official Lotterywest-style CSV with Winning Number and Powerball/Supplementary columns.",
        true,
      );
      elements.csvInput.value = "";
      return;
    }

    if (detectedGameId !== state.activeGameId) {
      state.activeGameId = detectedGameId;
    }

    const config = getGameConfig(state.activeGameId);
    loadCsvText(csvText, config, sourceLabel);
    elements.csvInput.value = "";
  };

  reader.onerror = () => {
    setStatus("Could not read the uploaded CSV file.", true);
  };

  reader.readAsText(file);
}

function loadCsvText(csvText, config, sourceLabel) {
  try {
    const draws = parseLotteryCsv(csvText, config);

    if (draws.length === 0) {
      throw new Error("No valid current-format draw rows found.");
    }

    state.drawsByGameId[config.id] = draws;
    state.sourceByGameId[config.id] = sourceLabel;

    setStatus(
      `${config.name}: loaded ${draws.length.toLocaleString()} current-format draws from ${sourceLabel.toLowerCase()}.`,
    );

    renderAll();
  } catch (error) {
    setStatus(`${config.name}: ${error.message}`, true);
  }
}

function clearActiveGameData() {
  delete state.drawsByGameId[state.activeGameId];
  delete state.sourceByGameId[state.activeGameId];

  const config = getGameConfig(state.activeGameId);

  setStatus(`${config.name} data cleared.`);
  renderAll();
}

function renderCompactMeta(container, draws, config) {
  if (!draws || draws.length === 0) {
    container.innerHTML = `
      <div class="meta-main">No data loaded</div>
      <div class="meta-source">Load a CSV file to begin.</div>
    `;
    return;
  }

  const latestDraw = draws[0];
  const source = state.sourceByGameId[config.id] ?? "-";

  container.innerHTML = `
    <div class="meta-main">
      <strong>${draws.length.toLocaleString()}</strong> draws ·
      Latest <strong>#${latestDraw.drawNumber}</strong> ·
      ${formatDateLong(latestDraw.drawDate)}
    </div>
    <div class="meta-source">
      Source: ${source}
    </div>
  `;
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "var(--danger)" : "var(--muted)";
}