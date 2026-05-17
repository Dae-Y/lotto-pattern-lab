import { getPatternSummary } from "../analysis/patternStats.js";
import {
  getOddEvenDistribution,
  getSumDistribution,
  getRepeatDistribution,
  getConsecutiveDistribution
} from "../analysis/patternDistributions.js";

import { formatDateLong } from "../utils/dateUtils.js";

export function renderPatternInsights(container, draws, config, copy) {
  container.innerHTML = "";

  if (!draws || draws.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        Pattern insights will appear after CSV data is loaded.
      </div>
    `;
    return;
  }

  const summary = getPatternSummary(draws, config);
  const c = copy || { insights: {} }; // Fallback
  const ins = c.insights;

  const header = document.createElement("div");
  header.className = "insights-header";

  const isKorean = copy && copy.header && copy.header.title.includes("한국");

  header.innerHTML = `
    <div>
      <p class="eyebrow" id="insightsEyebrow">${ins.eyebrow}</p>
      <h2 id="insightsTitle">${ins.title}</h2>
      <p class="insights-description">
        ${ins.subtitle}
      </p>
      <div class="insights-meta-row">
        <span class="insights-meta-pill">
          <strong>${summary.totalDraws}</strong> ${isKorean ? '회차' : 'draws'}
        </span>
        <span class="insights-meta-pill">
          ${isKorean ? '당첨번호 범위' : 'Main range'} <strong>1\u2013${summary.mainRange}</strong>
        </span>
        <span class="insights-meta-pill">
          ${isKorean ? `회당 당첨번호 <strong>${config.main.count}</strong>개` : `<strong>${config.main.count}</strong> main numbers per draw`}
        </span>
      </div>
    </div>
  `;
  container.appendChild(header);

  // Render Metric Cards
  const cardGrid = document.createElement("div");
  cardGrid.className = "insight-card-grid";

  const cards = [
    {
      title: ins.sumTitle,
      items: [
        { label: isKorean ? "평균" : "Average", value: summary.averageSum },
        { label: isKorean ? "최근" : "Latest", value: summary.latestSum },
        { label: isKorean ? "최소" : "Lowest", value: summary.minSum },
        { label: isKorean ? "최대" : "Highest", value: summary.maxSum }
      ]
    },
    {
      title: ins.oddEvenTitle,
      items: [
        { label: isKorean ? "가장 흔한 비율" : "Most common", value: summary.mostCommonOddEven },
        { label: isKorean ? "최근" : "Latest", value: summary.latestOddEven }
      ]
    },
    {
      title: ins.spreadTitle,
      items: [
        { label: isKorean ? "평균" : "Average", value: summary.averageSpread },
        { label: isKorean ? "최근" : "Latest", value: summary.latestSpread },
        { label: isKorean ? "최소" : "Lowest", value: summary.minSpread },
        { label: isKorean ? "최대" : "Highest", value: summary.maxSpread }
      ]
    },
    {
      title: ins.repeatTitle,
      items: [
        { label: isKorean ? "최근 반복 수" : "Latest repeat", value: summary.latestRepeatFromPrevious ?? "N/A" },
        { label: isKorean ? "평균 반복 수" : "Average repeat", value: summary.averageRepeatFromPrevious ?? "N/A" },
        { label: isKorean ? "가장 흔한 반복 수" : "Most common", value: summary.mostCommonRepeatCount ?? "N/A" },
        { label: isKorean ? "최대 관측 수" : "Max observed", value: summary.maxRepeatObserved ?? "N/A" }
      ]
    },
    {
      title: ins.consecutiveTitle,
      items: [
        { label: isKorean ? "최근 연속 쌍" : "Latest pairs", value: summary.latestConsecutivePairs },
        { label: isKorean ? "평균 연속 쌍" : "Average pairs", value: summary.averageConsecutivePairs },
        { label: isKorean ? "연속 번호 포함 회차 비중" : "Draws with consecutive numbers", value: summary.percentageOfDrawsWithConsecutiveNumbers },
        { label: isKorean ? "가장 흔한 쌍 개수" : "Most common pair count", value: summary.mostCommonConsecutivePairCount }
      ]
    },
    {
      title: ins.expectedTitle,
      items: [
        { label: isKorean ? "평균 합계" : "Average sum", value: `${summary.observedAverageSum} / ${isKorean ? '기대값' : 'expected'} ${summary.expectedAverageSum}` },
        { label: isKorean ? "평균 반복" : "Average repeat", value: `${summary.observedAverageRepeat} / ${isKorean ? '기대값' : 'expected'} ${summary.expectedRepeatFromPrevious}` },
        { label: isKorean ? "평균 범위" : "Average spread", value: `${summary.observedAverageSpread} / ${isKorean ? '기대값' : 'expected'} ${summary.expectedSpread}` },
        { label: isKorean ? "연속 번호 쌍" : "Consecutive pairs", value: `${summary.observedAverageConsecutivePairs} / ${isKorean ? '기대값' : 'expected'} ${summary.expectedConsecutivePairs}` }
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

  container.appendChild(cardGrid);

  // Render Chart Section Header
  const latestDraw = draws[0];
  const locale = copy && copy.locale ? copy.locale : (config.locale || "en-AU");
  const formattedDate = formatDateLong(latestDraw.drawDate, locale);
  const chartSectionHeader = document.createElement("div");
  chartSectionHeader.className = "insight-chart-section-header";
  chartSectionHeader.innerHTML = `
    <div>
      <p class="eyebrow">${ins.visualEyebrow}</p>
      <div class="insight-chart-section-title-row">
        <h3>${ins.barCharts}</h3>
        <p class="insight-chart-section-description">
          <span class="latest-badge">${ins.latestBadgeText}</span>
          <span>${ins.latestExplanationPrefix}</span>
          <strong>#${latestDraw.drawNumber}</strong>
          <span>&middot;</span>
          <strong>${formattedDate}</strong>
          <span>${ins.latestExplanationSuffix}</span>
        </p>
      </div>
    </div>
  `;
  container.appendChild(chartSectionHeader);

  // Render Mini Charts
  const chartGrid = document.createElement("div");
  chartGrid.className = "insight-chart-grid";

  const oddEvenDist = getOddEvenDistribution(draws);
  const sumDist = getSumDistribution(draws, 20);
  const repeatDist = getRepeatDistribution(draws);
  const consecutiveDist = getConsecutiveDistribution(draws);

  chartGrid.appendChild(
    createChartCard(
      ins.oddEvenDistribution,
      ins.oddEvenDistributionDescription,
      oddEvenDist,
      ins
    )
  );

  chartGrid.appendChild(
    createChartCard(
      ins.sumDistribution,
      ins.sumDistributionDescription,
      sumDist,
      ins
    )
  );

  if (draws.length < 2) {
    chartGrid.appendChild(
      createEmptyChartCard(
        ins.repeatDistribution,
        ins.repeatDistributionDescription,
        isKorean ? "반복 분포를 계산하기 위한 회차 데이터가 부족합니다." : "Not enough draws to calculate repeat distribution."
      )
    );
  } else {
    chartGrid.appendChild(
      createChartCard(
        ins.repeatDistribution,
        ins.repeatDistributionDescription,
        repeatDist,
        ins
      )
    );
  }

  chartGrid.appendChild(
    createChartCard(
      ins.consecutiveDistribution,
      ins.consecutiveDistributionDescription,
      consecutiveDist,
      ins
    )
  );

  container.appendChild(chartGrid);
}

function createChartCard(title, description, items, ins) {
  const card = document.createElement("div");
  card.className = "insight-chart-card";

  const h3 = document.createElement("h3");
  h3.textContent = title;
  card.appendChild(h3);

  const desc = document.createElement("p");
  desc.className = "insight-chart-description";
  desc.textContent = description;
  card.appendChild(desc);

  if (!items || items.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.style.padding = "20px 0";
    emptyState.style.fontSize = "13px";
    emptyState.textContent = "No data available.";
    card.appendChild(emptyState);
    return card;
  }

  card.appendChild(createMiniBarChart(items, ins));
  return card;
}

function createEmptyChartCard(title, description, message) {
  const card = document.createElement("div");
  card.className = "insight-chart-card";

  const h3 = document.createElement("h3");
  h3.textContent = title;
  card.appendChild(h3);

  const desc = document.createElement("p");
  desc.className = "insight-chart-description";
  desc.textContent = description;
  card.appendChild(desc);

  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.style.padding = "20px 0";
  emptyState.style.fontSize = "13px";
  emptyState.textContent = message;
  card.appendChild(emptyState);

  return card;
}

function createMiniBarChart(items, ins) {
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
        ${item.isLatest ? `<span class="latest-badge">${ins.latestBadgeText}</span>` : ""}
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
