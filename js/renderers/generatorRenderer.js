import { generateRandomEntries } from "../generator/randomGenerator.js";

export function renderGenerator(container, config) {
  container.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "generator-header";

  const headerText = document.createElement("div");
  headerText.innerHTML = `
    <p class="eyebrow">Random picker</p>
    <h2>Random Draw Simulator</h2>
    <p class="generator-description">
      Generate random draw results based on the selected game rule.
    </p>
  `;

  const controls = document.createElement("div");
  controls.className = "generator-controls";

  // Scrollable results area
  const scrollArea = document.createElement("div");
  scrollArea.className = "generated-scroll-area";

  const resultList = document.createElement("div");
  resultList.className = "generated-list";

  scrollArea.appendChild(resultList);

  const generationOptions = [1, 5, 10, 30, 100];

  generationOptions.forEach((count) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "generator-btn";
    button.textContent = `Generate ${count}`;

    button.addEventListener("click", () => {
      renderResults(resultList, config, count);
      scrollArea.scrollTop = 0;
    });

    controls.appendChild(button);
  });

  header.appendChild(headerText);
  header.appendChild(controls);

  // Note
  const note = document.createElement("p");
  note.className = "generator-note";
  note.textContent =
    "Generated numbers are random and are for entertainment/reference only. They do not improve the odds of winning.";

  container.appendChild(header);
  container.appendChild(scrollArea);
  container.appendChild(note);
}

function renderResults(resultList, config, count) {
  const entries = generateRandomEntries(config, count);

  resultList.innerHTML = "";

  entries.forEach((entry, index) => {
    const set = document.createElement("article");
    set.className = "generated-set";

    const label = document.createElement("div");
    label.className = "set-label";
    label.textContent = `Set ${index + 1}`;

    const ballRow = document.createElement("div");
    ballRow.className = "ball-row";

    // Main numbers
    entry.mainNumbers.forEach((number) => {
      const ball = document.createElement("span");
      ball.className = "lottery-ball main-ball";
      ball.textContent = number;
      ballRow.appendChild(ball);
    });

    // Separator label
    const separator = document.createElement("span");
    separator.className = "ball-separator";
    separator.textContent = config.secondary.label;
    ballRow.appendChild(separator);

    // Secondary numbers
    const secondaryClass = config.secondary.sharesMainGrid
      ? "supplementary-ball"
      : "powerball-ball";

    entry.secondaryNumbers.forEach((number) => {
      const ball = document.createElement("span");
      ball.className = `lottery-ball ${secondaryClass}`;
      ball.textContent = number;
      ballRow.appendChild(ball);
    });

    set.appendChild(label);
    set.appendChild(ballRow);
    resultList.appendChild(set);
  });
}
