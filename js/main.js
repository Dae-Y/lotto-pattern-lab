import {
  DEFAULT_GAME_ID,
  GAME_CONFIGS,
  detectGameIdFromCsvText,
  detectGameIdFromFileName,
  getGameConfig,
} from "./config/gameConfigs.js";

import { COUNTRIES } from "./config/countries.js";
import { getCopyForLocale } from "./i18n/index.js";

import { parseCsvLine } from "./parsers/csvParser.js";
import { parseCsvForGame } from "./parsers/parserRouter.js";

import { renderTabs } from "./renderers/tabsRenderer.js";
import { renderRecentResults } from "./renderers/gridRenderer.js";
import { renderStats } from "./renderers/statsRenderer.js";
import { renderPatternInsights } from "./renderers/patternInsightsRenderer.js";
import { renderGenerator } from "./renderers/generatorRenderer.js";
import { formatDateLong } from "./utils/dateUtils.js";

const PREF_KEY = "lottoPatternLab.preferences";

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
  
  tabs: document.querySelector("#tabs"),
  csvInput: document.querySelector("#csvInput"),
  loadSampleBtn: document.querySelector("#loadSampleBtn"),
  uploadCsvText: document.querySelector("#uploadCsvText"),
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

  recentEyebrow: document.querySelector("#recentEyebrow"),
  recentTitle: document.querySelector("#recentTitle"),
  recentCountText: document.querySelector("#recentCountText"),
  quickAnalysisEyebrow: document.querySelector("#quickAnalysisEyebrow"),
  quickAnalysisTitle: document.querySelector("#quickAnalysisTitle"),

  disclaimer1: document.querySelector("#disclaimer1"),
  disclaimer2: document.querySelector("#disclaimer2"),
  disclaimer3: document.querySelector("#disclaimer3"),
  disclaimer4: document.querySelector("#disclaimer4"),
  disclaimer5: document.querySelector("#disclaimer5"),
};

init();

async function init() {
  loadPreferences();
  validateState();

  updateStaticUiText();
  
  elements.countryBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.country === state.activeCountry);
  });

  renderAll();

  if (!state.drawsByGameId[state.activeGameId]) {
    await loadSampleCsvForActiveGame({ force: true });
  }

  // Bind events
  elements.countryBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setActiveCountry(btn.dataset.country);
    });
  });

  elements.loadSampleBtn.addEventListener("click", () => {
    loadSampleCsvForActiveGame({ force: true });
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
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return;
    const pref = JSON.parse(raw);
    
    if (pref.activeCountry) state.activeCountry = pref.activeCountry;
    if (pref.activeGameId) state.activeGameId = pref.activeGameId;
    if (pref.recentDrawLimit) state.recentDrawLimit = pref.recentDrawLimit;
    if (pref.recentViewMode) state.recentViewMode = pref.recentViewMode;
  } catch (e) {
    console.error("Failed to load preferences", e);
  }
}

function savePreferences() {
  try {
    const pref = {
      activeCountry: state.activeCountry,
      activeGameId: state.activeGameId,
      recentDrawLimit: state.recentDrawLimit,
      recentViewMode: state.recentViewMode,
    };
    localStorage.setItem(PREF_KEY, JSON.stringify(pref));
  } catch (e) {
    console.error("Failed to save preferences", e);
  }
}

function getCountry(countryId) {
  return COUNTRIES.find((country) => country.id === countryId);
}

function getDefaultGameIdForCountry(countryId) {
  const country = getCountry(countryId);
  return country?.defaultGameId ?? DEFAULT_GAME_ID;
}

function isValidCountry(countryId) {
  return COUNTRIES.some((country) => country.id === countryId);
}

function isGameInCountry(gameId, countryId) {
  const game = getGameConfig(gameId);
  return Boolean(game && game.country === countryId);
}

function validateState() {
  if (!isValidCountry(state.activeCountry)) {
    state.activeCountry = "australia";
  }

  if (!isGameInCountry(state.activeGameId, state.activeCountry)) {
    state.activeGameId = getDefaultGameIdForCountry(state.activeCountry);
  }

  if (!Number.isInteger(state.recentDrawLimit) || state.recentDrawLimit < 1) {
    state.recentDrawLimit = 10;
  }

  if (!["table", "compact"].includes(state.recentViewMode)) {
    state.recentViewMode = "table";
  }
}

function getVisibleGames() {
  return GAME_CONFIGS.filter((game) => game.country === state.activeCountry);
}

function getActiveCopy() {
  const country = getCountry(state.activeCountry);
  return getCopyForLocale(country ? country.locale : "en-AU");
}

function setActiveCountry(countryId) {
  state.activeCountry = countryId;
  state.activeGameId = getDefaultGameIdForCountry(countryId);

  validateState();
  savePreferences();

  elements.countryBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.country === state.activeCountry);
  });

  updateStaticUiText();
  renderAll();

  if (!state.drawsByGameId[state.activeGameId]) {
    loadSampleCsvForActiveGame({ force: true });
  }
}

function handleTabChange(gameId) {
  const config = getGameConfig(gameId);

  if (!config) {
    console.error("Invalid game tab:", gameId);
    return;
  }

  state.activeGameId = gameId;
  state.activeCountry = config.country;

  validateState();
  savePreferences();
  renderAll();

  if (!state.drawsByGameId[gameId]) {
    loadSampleCsvForActiveGame({ force: true });
  }
}

function updateStaticUiText() {
  const copy = getActiveCopy();

  if (elements.headerEyebrow) elements.headerEyebrow.textContent = copy.header.eyebrow;
  if (elements.headerTitle) elements.headerTitle.textContent = copy.header.title;
  if (elements.headerSubtitle) elements.headerSubtitle.textContent = copy.header.subtitle;

  if (elements.loadSampleBtn) elements.loadSampleBtn.textContent = copy.controls.loadData;
  if (elements.uploadCsvText) elements.uploadCsvText.textContent = copy.controls.uploadCsv;
  if (elements.clearBtn) elements.clearBtn.textContent = copy.controls.clear;

  if (elements.recentEyebrow) elements.recentEyebrow.textContent = copy.recent.eyebrow;
  if (elements.recentTitle) elements.recentTitle.textContent = copy.recent.title;
  if (elements.recentCountText) elements.recentCountText.textContent = copy.recent.drawCount;
  if (elements.tableViewBtn) elements.tableViewBtn.textContent = copy.recent.tableView;
  if (elements.compactViewBtn) elements.compactViewBtn.textContent = copy.recent.compactView;

  if (elements.quickAnalysisEyebrow) elements.quickAnalysisEyebrow.textContent = copy.quickAnalysis.eyebrow;
  if (elements.quickAnalysisTitle) elements.quickAnalysisTitle.textContent = copy.quickAnalysis.title;

  if (copy.footer) {
    if (elements.disclaimer1) elements.disclaimer1.textContent = copy.footer.disclaimer1;
    if (elements.disclaimer2) elements.disclaimer2.textContent = copy.footer.disclaimer2;
    if (elements.disclaimer3) elements.disclaimer3.textContent = copy.footer.disclaimer3;
    if (elements.disclaimer4) elements.disclaimer4.textContent = copy.footer.disclaimer4;
    if (elements.disclaimer5) elements.disclaimer5.textContent = copy.footer.disclaimer5;
  }
}

function handleDrawCountChange() {
  const parsed = parseInt(elements.recentDrawCount.value, 10);
  state.recentDrawLimit = parsed > 0 ? parsed : 1;
  savePreferences();
  renderRecent();
}

function setViewMode(mode) {
  state.recentViewMode = mode;
  savePreferences();

  elements.tableViewBtn.classList.toggle("active", mode === "table");
  elements.compactViewBtn.classList.toggle("active", mode === "compact");

  renderRecent();
}

function renderRecent() {
  const config = getGameConfig(state.activeGameId);
  if (!config) return;

  const draws = state.drawsByGameId[state.activeGameId] ?? [];
  const copy = getActiveCopy();

  renderRecentResults(elements.recentGrid, draws, config, {
    limit: state.recentDrawLimit,
    viewMode: state.recentViewMode,
  }, copy);
}

function renderAll() {
  const visibleGames = getVisibleGames();
  
  if (visibleGames.length === 0) {
    console.error("No visible games for country:", state.activeCountry);
    state.activeCountry = "australia";
    state.activeGameId = getDefaultGameIdForCountry("australia");
    return renderAll();
  }

  const config = getGameConfig(state.activeGameId);
  if (!config) {
    state.activeCountry = "australia";
    state.activeGameId = DEFAULT_GAME_ID;
    savePreferences();
    return renderAll();
  }

  const draws = state.drawsByGameId[state.activeGameId] ?? [];
  const copy = getActiveCopy();

  renderTabs(elements.tabs, visibleGames, state.activeGameId, handleTabChange);
  renderCompactMeta(elements.compactMeta, draws, config, copy);
  renderRecentResults(elements.recentGrid, draws, config, {
    limit: state.recentDrawLimit,
    viewMode: state.recentViewMode,
  }, copy);
  renderStats(elements.stats, draws, config, copy);

  try {
    renderPatternInsights(elements.patternInsights, draws, config, copy);
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

  renderGenerator(elements.generator, config, copy);
}

async function loadSampleCsvForActiveGame({ force = false } = {}) {
  validateState();

  const config = getGameConfig(state.activeGameId);

  if (!config) {
    setStatus("No valid game selected.", true);
    return;
  }

  if (!force && state.drawsByGameId[state.activeGameId]) {
    renderAll();
    return;
  }

  const path = `./data/${config.fileName}`;
  const cacheBustedPath = `${path}?v=${Date.now()}`;
  const copy = getActiveCopy();
  
  // Try to use a loading message from copy or fallback
  const isKorean = state.activeCountry === "korea";
  const loadingMsg = isKorean ? `${config.name} 데이터를 불러오는 중...` : `Loading ${config.name} data...`;
  setStatus(loadingMsg);

  try {
    const response = await fetch(cacheBustedPath, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Could not load ${path}`);
    }

    const csvText = await response.text();
    const sourceLabel = config.sourceLabel || "Uploaded CSV";
    loadCsvText(csvText, config, sourceLabel);
  } catch (error) {
    console.error("Failed to load CSV from data folder:", error);
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
        "Could not detect the lottery game from this CSV.",
        true,
      );
      elements.csvInput.value = "";
      return;
    }

    if (detectedGameId !== state.activeGameId) {
      state.activeGameId = detectedGameId;
      // also change the country tab if needed
      const detectedConfig = getGameConfig(detectedGameId);
      if (detectedConfig && detectedConfig.country !== state.activeCountry) {
        state.activeCountry = detectedConfig.country;
        savePreferences();
        
        elements.countryBtns.forEach(btn => {
          btn.classList.toggle("active", btn.dataset.country === state.activeCountry);
        });
        updateStaticUiText();
      }
    }

    const config = getGameConfig(state.activeGameId);
    const sourceLabel = config.sourceLabel || "Uploaded CSV";
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
    const draws = parseCsvForGame(csvText, config);

    if (draws.length === 0) {
      throw new Error("No valid current-format draw rows found.");
    }

    state.drawsByGameId[config.id] = draws;
    state.sourceByGameId[config.id] = sourceLabel;

    const isKorean = state.activeCountry === "korea";
    const msg = isKorean
      ? `${config.name}: ${draws.length.toLocaleString()}개 회차 데이터를 불러왔습니다.`
      : `${config.name}: loaded ${draws.length.toLocaleString()} current-format draws from ${sourceLabel.toLowerCase()}.`;
    
    setStatus(msg);

    renderAll();
  } catch (error) {
    setStatus(`${config.name}: ${error.message}`, true);
  }
}

function clearActiveGameData() {
  delete state.drawsByGameId[state.activeGameId];
  delete state.sourceByGameId[state.activeGameId];

  const config = getGameConfig(state.activeGameId);

  const isKorean = state.activeCountry === "korea";
  setStatus(isKorean ? `${config.name} 데이터가 초기화되었습니다.` : `${config.name} data cleared.`);
  renderAll();
}

function renderCompactMeta(container, draws, config, copy) {
  if (!draws || draws.length === 0) {
    const isKorean = state.activeCountry === "korea";
    container.innerHTML = `
      <div class="meta-main">${isKorean ? "데이터가 없습니다" : "No data loaded"}</div>
      <div class="meta-source">${isKorean ? "CSV 파일을 불러와주세요." : "Load a CSV file to begin."}</div>
    `;
    return;
  }

  const latestDraw = draws[0];
  const source = state.sourceByGameId[config.id] ?? "-";
  const isKorean = state.activeCountry === "korea";

  container.innerHTML = `
    <div class="meta-main">
      <strong>${draws.length.toLocaleString()}</strong> ${isKorean ? "회차" : "draws"} ·
      ${isKorean ? "최신" : "Latest"} <strong>#${latestDraw.drawNumber}</strong> ·
      ${formatDateLong(latestDraw.drawDate, copy?.locale ?? config.locale ?? "en-AU")}
    </div>
    <div class="meta-source">
      ${isKorean ? "출처:" : "Source:"} ${source}
    </div>
  `;
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "var(--danger)" : "var(--muted)";
}