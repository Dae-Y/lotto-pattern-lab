import { analyzeUserNumbers } from "../analysis/userNumbersAnalysis.js";
import { getFrequencyMap } from "../analysis/frequency.js";

/**
 * Renders the My Numbers Analyser panel and sets up its interaction handlers.
 * 
 * @param {HTMLElement} container - The element where the analyser is rendered
 * @param {Object[]} draws - The historical draws for the current game
 * @param {Object} config - The active game configuration
 * @param {Object} copy - The current translation copy
 */
export function renderUserNumbersAnalyser(container, draws, config, copy) {
  if (!container) return;

  const isKorean = copy.locale === "ko-KR";
  const userCopy = copy.userNumbers || {};

  const showSecondary = Boolean(
    config.secondary &&
    config.secondary.count === 1 &&
    config.secondary.sharesMainGrid === false
  );

  // Build placeholder dynamically based on counts
  const mainSampleNumbers = [3, 12, 18, 27, 34, 45, 2, 7];
  const sampleList = Array.from({ length: config.main.count }, (_, i) => mainSampleNumbers[i] || (i + 1));
  const mainPlaceholder = isKorean
    ? `예: ${sampleList.join(", ")}`
    : `Example: ${sampleList.join(", ")}`;

  const secondaryPlaceholder = isKorean
    ? `예: 8`
    : `Example: 8`;

  // 1. Render core HTML structure
  container.innerHTML = `
    <div class="user-numbers-card">
      <div class="user-numbers-header">
        <h2>${userCopy.title || "My Numbers Analyser"}</h2>
        <p class="user-numbers-description">${userCopy.description || ""}</p>
      </div>

      <form class="user-numbers-form" novalidate>
        <div class="user-numbers-field">
          <label for="user-numbers-main-input">${userCopy.mainInputLabel || "Main numbers"}</label>
          <input 
            type="text" 
            id="user-numbers-main-input" 
            class="user-numbers-input" 
            placeholder="${mainPlaceholder}"
            autocomplete="off"
          />
        </div>

        ${showSecondary ? `
          <div class="user-numbers-field">
            <label for="user-numbers-secondary-input">${userCopy.secondaryInputLabel || "Powerball"}</label>
            <input 
              type="text" 
              id="user-numbers-secondary-input" 
              class="user-numbers-input" 
              placeholder="${secondaryPlaceholder}"
              autocomplete="off"
            />
          </div>
        ` : ""}

        <div class="user-numbers-error" style="display: none;"></div>

        <div class="user-numbers-actions">
          <button type="button" class="secondary-btn user-numbers-random-btn">
            ${userCopy.randomFillButton || "Random fill"}
          </button>
          <button type="submit" class="primary-btn user-numbers-analyze-btn">
            ${userCopy.analyzeButton || "Analyze numbers"}
          </button>
          <button type="button" class="secondary-btn user-numbers-clear-btn">
            ${userCopy.clearButton || "Clear"}
          </button>
        </div>
      </form>

      <div class="user-numbers-result" style="display: none;"></div>
    </div>
  `;

  // 2. Query elements
  const form = container.querySelector(".user-numbers-form");
  const mainInput = container.querySelector("#user-numbers-main-input");
  const secondaryInput = container.querySelector("#user-numbers-secondary-input");
  const errorAlert = container.querySelector(".user-numbers-error");
  const resultContainer = container.querySelector(".user-numbers-result");
  const randomBtn = container.querySelector(".user-numbers-random-btn");
  const clearBtn = container.querySelector(".user-numbers-clear-btn");

  // 3. Bind event listeners
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleAnalyze();
  });

  randomBtn.addEventListener("click", handleRandomFill);
  clearBtn.addEventListener("click", handleClear);

  // 4. Handle Clear
  function handleClear() {
    mainInput.value = "";
    if (secondaryInput) {
      secondaryInput.value = "";
    }
    hideError();
    resultContainer.style.display = "none";
    resultContainer.innerHTML = "";
  }

  // 5. Handle Random Fill
  function handleRandomFill() {
    hideError();

    // Generate main numbers
    const mainSet = new Set();
    while (mainSet.size < config.main.count) {
      const rand = Math.floor(Math.random() * config.main.range) + 1;
      mainSet.add(rand);
    }
    const mainNumbersSorted = Array.from(mainSet).sort((a, b) => a - b);
    mainInput.value = mainNumbersSorted.join(", ");

    // Generate secondary number if required
    if (showSecondary) {
      const secRand = Math.floor(Math.random() * config.secondary.range) + 1;
      secondaryInput.value = String(secRand);
    }

    resultContainer.style.display = "none";
  }

  // 6. Handle Analyze
  function handleAnalyze() {
    hideError();

    const mainText = mainInput.value.trim();
    if (!mainText) {
      showError(userCopy.validationCount || "Please enter the correct number of values.");
      return;
    }

    // Parse main numbers (flexible split on spaces, commas, slashes, semicolons)
    const mainTokens = mainText.split(/[,\s\/;]+/).filter(t => t !== "");
    const mainNumbers = mainTokens.map(t => {
      const val = Number.parseInt(t, 10);
      return Number.isNaN(val) ? null : val;
    });

    // Main count check
    if (mainNumbers.length !== config.main.count || mainNumbers.some(n => n === null)) {
      showError(userCopy.validationCount || "Please enter the correct number of values.");
      return;
    }

    // Range check
    const isMainInRange = mainNumbers.every(n => n >= 1 && n <= config.main.range);
    if (!isMainInRange) {
      showError(`${userCopy.validationRange || "Numbers must be within the allowed range."} (1–${config.main.range})`);
      return;
    }

    // Duplicate check
    const hasDuplicates = new Set(mainNumbers).size !== mainNumbers.length;
    if (hasDuplicates) {
      showError(userCopy.validationDuplicate || "Duplicate numbers are not allowed.");
      return;
    }

    // Secondary number parsing and checks
    let secondaryNumbers = [];
    if (showSecondary) {
      const secText = secondaryInput.value.trim();
      if (!secText) {
        showError(userCopy.validationSecondary || "Please enter a valid secondary number.");
        return;
      }

      const secVal = Number.parseInt(secText, 10);
      if (Number.isNaN(secVal) || secVal < 1 || secVal > config.secondary.range) {
        showError(`${userCopy.validationSecondary || "Please enter a valid secondary number."} (1–${config.secondary.range})`);
        return;
      }
      secondaryNumbers = [secVal];
    }

    // Call business logic analyser
    const analysis = analyzeUserNumbers({
      mainNumbers,
      secondaryNumbers,
      draws,
      config
    });

    renderResult(analysis);
  }

  // 7. Show / Hide error helpers
  function showError(msg) {
    errorAlert.textContent = msg;
    errorAlert.style.display = "block";
    resultContainer.style.display = "none";
  }

  function hideError() {
    errorAlert.textContent = "";
    errorAlert.style.display = "none";
  }

  // 8. Render analysis results card
  function renderResult(data) {
    const hasDraws = draws && draws.length > 0;

    // Header
    let html = `
      <div class="user-numbers-result-card">
        <h3>${userCopy.resultTitle || "Number profile"}</h3>
        
        <div class="user-number-balls">
    `;

    // Main balls
    data.mainNumbers.forEach(n => {
      html += `<span class="user-number-ball">${n}</span>`;
    });

    // Secondary balls
    data.secondaryNumbers.forEach(n => {
      html += `<span class="user-number-ball secondary">${n}</span>`;
    });

    html += `
        </div>

        <div class="user-numbers-metrics">
          <div class="user-number-metric">
            <span>${userCopy.sum || "Sum"}</span>
            <strong>${data.sum}</strong>
          </div>
          <div class="user-number-metric">
            <span>${userCopy.oddEven || "Odd / Even"}</span>
            <strong>${data.oddCount}${isKorean ? "홀" : "o"} / ${data.evenCount}${isKorean ? "짝" : "e"}</strong>
          </div>
          <div class="user-number-metric">
            <span>${userCopy.spread || "Spread"}</span>
            <strong>${data.spread}</strong>
          </div>
          <div class="user-number-metric">
            <span>${userCopy.consecutivePairs || "Consecutive pairs"}</span>
            <strong>${data.consecutivePairs}</strong>
          </div>
          <div class="user-number-metric">
            <span>${userCopy.repeatWithLatest || "Repeat with latest draw"}</span>
            <strong>${hasDraws ? data.repeatWithLatest : "N/A"}</strong>
          </div>
        </div>
    `;

    // Dataset comparisons
    html += `
        <div class="user-numbers-comparison">
          <h4>${userCopy.datasetComparison || "Dataset comparison"}</h4>
    `;

    if (hasDraws) {
      const getComparisonText = (type) => {
        if (type === "close") return userCopy.closeToAverage || "Close to average";
        if (type === "lower") return userCopy.lowerThanAverage || "Lower than average";
        if (type === "higher") return userCopy.higherThanAverage || "Higher than average";
        return "-";
      };

      const sumCompare = getComparisonText(data.comparison.sum);
      const spreadCompare = getComparisonText(data.comparison.spread);

      html += `
          <p>
            <strong>${userCopy.sum || "Sum"}:</strong> ${sumCompare} 
            <span class="user-avg-span">(${userCopy.historicalAverage || "Historical avg"}: ${data.historical.averageSum})</span>
          </p>
          <p>
            <strong>${userCopy.spread || "Spread"}:</strong> ${spreadCompare} 
            <span class="user-avg-span">(${userCopy.historicalAverage || "Historical avg"}: ${data.historical.averageSpread})</span>
          </p>
      `;
    } else {
      html += `
          <p class="user-numbers-no-data">${userCopy.noData || "Historical data has not been loaded yet."}</p>
      `;
    }

    html += `
        </div>
    `;

    if (hasDraws) {
      // 1. Build Recent 5 Draws vs My Sum SVG Line Chart
      const recentSums = data.recentDrawSums || [];
      const userSum = data.sum;
      const allSums = [...recentSums.map(d => d.sum), userSum];
      const minSum = Math.min(...allSums);
      const maxSum = Math.max(...allSums);

      const sumRange = maxSum - minSum;
      const padding = sumRange === 0 ? 15 : Math.max(10, sumRange * 0.2);
      const yMin = Math.max(0, minSum - padding);
      const yMax = maxSum + padding;

      const svgW = 400;
      const svgH = 150;
      const padL = 40;
      const padR = 20;
      const padT = 25;
      const padB = 25;

      const plotW = svgW - padL - padR;
      const plotH = svgH - padT - padB;

      const getX = (index, total) => {
        if (total <= 1) return padL + plotW / 2;
        return padL + (index / (total - 1)) * plotW;
      };

      const getY = (val) => {
        return padT + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
      };

      const points = recentSums.map((d, i) => ({
        x: getX(i, recentSums.length),
        y: getY(d.sum),
        sum: d.sum,
        drawNumber: d.drawNumber
      }));

      // Grid Lines
      const gridValues = [yMin, (yMin + yMax) / 2, yMax];
      let gridHtml = "";
      gridValues.forEach(val => {
        const y = getY(val);
        gridHtml += `
          <line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="var(--border, #e2e8f0)" stroke-width="1" stroke-dasharray="3 3" />
          <text x="${padL - 8}" y="${y + 3}" fill="var(--muted, #64748b)" font-size="9" text-anchor="end">${Math.round(val)}</text>
        `;
      });

      // User threshold line
      const userY = getY(userSum);
      const textY = userY < padT + 15 ? userY + 12 : userY - 4;
      const thresholdHtml = `
        <line x1="${padL}" y1="${userY}" x2="${svgW - padR}" y2="${userY}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 3" />
        <text x="${padL + 6}" y="${textY}" fill="#ef4444" font-size="9" font-weight="800">${userCopy.mySumLabel || "My sum"}: ${userSum}</text>
      `;

      // Draw path and dots
      let lineHtml = "";
      if (points.length > 1) {
        const polyPoints = points.map(p => `${p.x},${p.y}`).join(" ");
        lineHtml += `<polyline points="${polyPoints}" fill="none" stroke="var(--primary, #2563eb)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;
      }

      let dotsHtml = "";
      let xLabelsHtml = "";
      points.forEach(p => {
        dotsHtml += `
          <circle cx="${p.x}" cy="${p.y}" r="4" fill="#ffffff" stroke="var(--primary, #2563eb)" stroke-width="2" class="user-chart-dot" />
          <text x="${p.x}" y="${p.y - 8}" fill="var(--text, #1e293b)" font-size="9" font-weight="700" text-anchor="middle" class="user-chart-value">${p.sum}</text>
        `;
        xLabelsHtml += `
          <text x="${p.x}" y="${svgH - 6}" fill="var(--muted, #64748b)" font-size="9" text-anchor="middle">#${p.drawNumber}</text>
        `;
      });

      const lineChartSvg = `
        <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="${svgH}">
          ${gridHtml}
          ${thresholdHtml}
          ${lineHtml}
          ${dotsHtml}
          ${xLabelsHtml}
        </svg>
      `;

      // 2. Build Frequency HTML Bars
      const mainFreqMap = getFrequencyMap(draws, config, "main");
      const maxMainCount = Math.max(1, ...Array.from(mainFreqMap.values()));

      let freqHtml = "";
      if (config.secondary) {
        freqHtml += `<div class="user-freq-section-title">${userCopy.mainInputLabel || "Main numbers"}</div>`;
      }
      freqHtml += `<div class="user-freq-bars">`;
      data.mainFrequencies.forEach(n => {
        const pct = (n.count / maxMainCount) * 100;
        freqHtml += `
          <div class="user-frequency-row">
            <span class="user-number-ball mini">${n.number}</span>
            <div class="user-frequency-bar-track">
              <div class="user-frequency-bar-fill" style="width: ${pct}%"></div>
            </div>
            <span class="user-frequency-count">${n.count}${userCopy.timesLabel || " times"}</span>
          </div>
        `;
      });
      freqHtml += `</div>`;

      if (config.secondary && data.secondaryFrequencies.length > 0) {
        const secFreqMap = getFrequencyMap(draws, config, "secondary");
        const maxSecCount = Math.max(1, ...Array.from(secFreqMap.values()));

        freqHtml += `
          <div class="user-freq-section-title secondary">${userCopy.secondaryInputLabel || "Powerball"}</div>
          <div class="user-freq-bars">
        `;
        data.secondaryFrequencies.forEach(n => {
          const pct = (n.count / maxSecCount) * 100;
          freqHtml += `
            <div class="user-frequency-row">
              <span class="user-number-ball mini secondary">${n.number}</span>
              <div class="user-frequency-bar-track">
                <div class="user-frequency-bar-fill secondary" style="width: ${pct}%"></div>
              </div>
              <span class="user-frequency-count">${n.count}${userCopy.timesLabel || " times"}</span>
            </div>
          `;
        });
        freqHtml += `</div>`;
      }

      // Append Both Charts to HTML
      html += `
        <div class="user-numbers-charts">
          <div class="user-chart-box">
            <h4>${userCopy.chartRecentSumsTitle || "Recent 5 Draws vs My Sum"}</h4>
            <div class="user-chart-content">
              ${lineChartSvg}
            </div>
          </div>
          <div class="user-chart-box">
            <h4>${userCopy.chartFreqTitle || "Selected Number Frequency"}</h4>
            <div class="user-chart-content">
              ${freqHtml}
            </div>
          </div>
        </div>
      `;
    }

    html += `
        <p class="user-numbers-note">
          ${userCopy.note || ""}
        </p>
      </div>
    `;

    resultContainer.innerHTML = html;
    resultContainer.style.display = "block";
  }
}
