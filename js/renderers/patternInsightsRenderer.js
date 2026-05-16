import { getPatternSummary } from "../analysis/patternStats.js";
import { 
  getOddEvenDistribution, 
  getSumDistribution, 
  getRepeatDistribution, 
  getConsecutiveDistribution 
} from "../analysis/patternDistributions.js";

export function renderPatternInsights(container, draws, config) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  try {
    if (!draws || draws.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          Pattern insights will appear after CSV data is loaded.
        </div>
      `;
      return;
    }

    const summary = getPatternSummary(draws, config);

    const wrapper = document.createElement("div");
    wrapper.className = "pattern-insights";

    // 1. Header
    const header = document.createElement("div");
    header.className = "insights-header";
    header.innerHTML = `
      <div>
        <p class="eyebrow">Deep analysis</p>
        <h2>Pattern Insights</h2>
        <p class="insights-description">
          A closer look at distribution, repetition, spread, and random-baseline behaviour.
        </p>
      </div>
    `;
    wrapper.appendChild(header);

    // 2. Metric Cards
    const cardGrid = document.createElement("div");
    cardGrid.className = "insight-card-grid";

    const cards = [
      {
        title: "Dataset",
        items: [
          { label: "Total draws", value: summary.totalDraws },
          { label: "Main range", value: `1\u2013${summary.mainRange}` },
          { label: "Main numbers per draw", value: config.main.count }
        ]
      },
      {
        title: "Sum",
        items: [
          { label: "Average", value: summary.averageSum },
          { label: "Latest", value: summary.latestSum },
          { label: "Lowest", value: summary.minSum },
          { label: "Highest", value: summary.maxSum }
        ]
      },
      {
        title: "Odd / Even",
        items: [
          { label: "Most common", value: summary.mostCommonOddEven },
          { label: "Latest", value: summary.latestOddEven }
        ]
      },
      {
        title: "Spread",
        items: [
          { label: "Average", value: summary.averageSpread },
          { label: "Latest", value: summary.latestSpread },
          { label: "Lowest", value: summary.minSpread },
          { label: "Highest", value: summary.maxSpread }
        ]
      },
      {
        title: "Repeat from Previous Draw",
        items: [
          { label: "Latest repeat", value: summary.latestRepeatFromPrevious ?? "N/A" },
          { label: "Average repeat", value: summary.averageRepeatFromPrevious ?? "N/A" },
          { label: "Most common", value: summary.mostCommonRepeatCount ?? "N/A" },
          { label: "Max observed", value: summary.maxRepeatObserved ?? "N/A" }
        ]
      },
      {
        title: "Consecutive Numbers",
        items: [
          { label: "Latest pairs", value: summary.latestConsecutivePairs },
          { label: "Average pairs", value: summary.averageConsecutivePairs },
          { label: "Draws with consecutive numbers", value: summary.percentageOfDrawsWithConsecutiveNumbers },
          { label: "Most common pair count", value: summary.mostCommonConsecutivePairCount }
        ]
      },
      {
        title: "Observed vs Expected Random",
        items: [
          { label: "Average sum", value: `${summary.observedAverageSum} / ${summary.expectedAverageSum} expected` },
          { label: "Average repeat", value: `${summary.observedAverageRepeat} / ${summary.expectedRepeatFromPrevious} expected` },
          { label: "Average spread", value: `${summary.observedAverageSpread} / ${summary.expectedSpread} expected` },
          { label: "Consecutive pairs", value: `${summary.observedAverageConsecutivePairs} / ${summary.expectedConsecutivePairs} expected` }
        ]
      }
    ];

    cards.forEach(cardData => {
      const card = document.createElement("div");
      card.className = "insight-card";
      
      const h3 = document.createElement("h3");
      h3.textContent = cardData.title;
      card.appendChild(h3);
      
      const list = document.createElement("div");
      list.className = "insight-metric-list";
      
      cardData.items.forEach(item => {
        const metric = document.createElement("div");
        metric.className = "insight-metric";
        metric.innerHTML = `
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        `;
        list.appendChild(metric);
      });
      
      card.appendChild(list);
      cardGrid.appendChild(card);
    });
    
    wrapper.appendChild(cardGrid);

    // 3. Mini Charts
    try {
      const chartGrid = document.createElement("div");
      chartGrid.className = "insight-chart-grid";

      const oddEvenDist = getOddEvenDistribution(draws);
      const sumDist = getSumDistribution(draws, 20);
      const repeatDist = getRepeatDistribution(draws);
      const consecutiveDist = getConsecutiveDistribution(draws);

      chartGrid.appendChild(createChartCard("Odd / Even Distribution", oddEvenDist));
      chartGrid.appendChild(createChartCard("Sum Distribution", sumDist));
      
      if (draws.length < 2) {
        chartGrid.appendChild(createEmptyChartCard("Repeat From Previous Draw Distribution", "Not enough draws to calculate repeat distribution."));
      } else {
        chartGrid.appendChild(createChartCard("Repeat From Previous Draw Distribution", repeatDist));
      }
      
      chartGrid.appendChild(createChartCard("Consecutive Pair Distribution", consecutiveDist));

      wrapper.appendChild(chartGrid);
    } catch (error) {
      console.error("Pattern Insights chart render failed:", error);
      const fallback = document.createElement("div");
      fallback.className = "empty-state";
      fallback.style.padding = "20px 0";
      fallback.textContent = "Chart visualisations could not be rendered, but metric insights are still available.";
      wrapper.appendChild(fallback);
    }

    container.appendChild(wrapper);

  } catch (error) {
    console.error("Pattern Insights render failed:", error);
    container.innerHTML = `
      <div class="empty-state">
        Pattern Insights could not be rendered. Check the browser console for details.
      </div>
    `;
  }
}

function createChartCard(title, items) {
  const card = document.createElement("article");
  card.className = "insight-chart-card";
  
  const h3 = document.createElement("h3");
  h3.textContent = title;
  card.appendChild(h3);
  
  if (!items || items.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.style.padding = "20px 0";
    emptyState.style.fontSize = "13px";
    emptyState.textContent = "Not enough data to render this chart.";
    card.appendChild(emptyState);
    return card;
  }

  card.appendChild(createMiniBarChart(items));
  return card;
}

function createEmptyChartCard(title, message) {
  const card = document.createElement("article");
  card.className = "insight-chart-card";
  
  const h3 = document.createElement("h3");
  h3.textContent = title;
  card.appendChild(h3);
  
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.style.padding = "20px 0";
  emptyState.style.fontSize = "13px";
  emptyState.textContent = message;
  card.appendChild(emptyState);
  
  return card;
}

function createMiniBarChart(items) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  const chart = document.createElement("div");
  chart.className = "mini-bar-chart";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = item.isLatest ? "mini-bar-row latest" : "mini-bar-row";

    const percent = (item.count / maxCount) * 100;

    row.innerHTML = `
      <div class="mini-bar-label">
        ${item.label}
        ${item.isLatest ? '<span class="latest-badge">Latest</span>' : ""}
      </div>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width: ${percent}%"></div>
      </div>
      <div class="mini-bar-value">${item.count}</div>
    `;

    chart.appendChild(row);
  });

  return chart;
}
