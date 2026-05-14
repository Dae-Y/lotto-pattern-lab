import {
  DEFAULT_GAME_ID,
  GAME_CONFIGS,
  detectGameIdFromFileName,
  getGameConfig,
} from "./config/gameConfigs.js";

import { parseLotteryCsv } from "./parsers/lotteryParser.js";
import { renderTabs } from "./renderers/tabsRenderer.js";
import { renderRecentGrid } from "./renderers/gridRenderer.js";
import { renderStats } from "./renderers/statsRenderer.js";
import { renderGenerator } from "./renderers/generatorRenderer.js";
import { formatDateLong } from "./utils/dateUtils.js";

const state = {
  activeGameId: DEFAULT_GAME_ID,
  drawsByGameId: {},
  sourceByGameId: {},
};

const elements = {
  tabs: document.querySelector("#tabs"),
  csvInput: document.querySelector("#csvInput"),
  loadSampleBtn: document.querySelector("#loadSampleBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  status: document.querySelector("#status"),
  compactMeta: document.querySelector("#compactMeta"),
  recentGrid: document.querySelector("#recentGrid"),
  stats: document.querySelector("#stats"),
  generator: document.querySelector("#generator"),
};

init();

function init() {
  renderAll();

  elements.loadSampleBtn.addEventListener("click", () => {
    loadSampleCsvForActiveGame();
  });

  elements.csvInput.addEventListener("change", handleCsvUpload);

  elements.clearBtn.addEventListener("click", () => {
    clearActiveGameData();
  });

  loadSampleCsvForActiveGame();
}

function renderAll() {
  const config = getGameConfig(state.activeGameId);
  const draws = state.drawsByGameId[state.activeGameId] ?? [];

  renderTabs(elements.tabs, GAME_CONFIGS, state.activeGameId, handleTabChange);
  renderCompactMeta(elements.compactMeta, draws, config);
  renderRecentGrid(elements.recentGrid, draws, config, 10);
  renderStats(elements.stats, draws, config);
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

  setStatus(`Loading ${config.fileName}...`);

  try {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Could not load ${path}`);
    }

    const csvText = await response.text();
    loadCsvText(csvText, config, `data/${config.fileName}`);
  } catch (error) {
    setStatus(
      `Could not load ${config.fileName}. Upload the CSV manually or run the project with a local server.`,
      true,
    );
  }
}

function handleCsvUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const detectedGameId = detectGameIdFromFileName(file.name);

  if (detectedGameId && detectedGameId !== state.activeGameId) {
    state.activeGameId = detectedGameId;
  }

  const config = getGameConfig(state.activeGameId);
  const reader = new FileReader();

  reader.onload = () => {
    loadCsvText(String(reader.result), config, file.name);
    elements.csvInput.value = "";
  };

  reader.onerror = () => {
    setStatus("Could not read the uploaded CSV file.", true);
  };

  reader.readAsText(file);
}

function loadCsvText(csvText, config, sourceName) {
  try {
    const draws = parseLotteryCsv(csvText, config);

    if (draws.length === 0) {
      throw new Error("No valid current-format draw rows found.");
    }

    state.drawsByGameId[config.id] = draws;
    state.sourceByGameId[config.id] = sourceName;

    setStatus(
      `${config.name}: loaded ${draws.length.toLocaleString()} current-format draws from ${sourceName}.`,
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