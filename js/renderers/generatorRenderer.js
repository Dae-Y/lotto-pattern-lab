import { generateRandomEntries } from "../generator/randomGenerator.js";

export function renderGenerator(container, config, copy) {
  container.innerHTML = "";

  const c = copy || { generator: {} };
  const gen = c.generator;

  // Header
  const header = document.createElement("div");
  header.className = "generator-header";

  const headerText = document.createElement("div");
  headerText.innerHTML = `
    <p class="eyebrow">${gen.eyebrow}</p>
    <h2>${gen.title}</h2>
    <p class="generator-description">
      ${gen.description}
    </p>
  `;

  const controls = document.createElement("div");
  controls.className = "generator-controls";

  const label = document.createElement("span");
  label.className = "generator-label";
  label.textContent = gen.generate || "Generate:";
  controls.appendChild(label);

  // Scrollable results area
  const scrollArea = document.createElement("div");
  scrollArea.className = "generated-scroll-area";

  const resultList = document.createElement("div");
  resultList.className = "generated-list";

  scrollArea.appendChild(resultList);

  const generationOptions = [1, 5, 10, 30];

  generationOptions.forEach((count) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "generator-btn";
    button.textContent = gen[`generate${count}`] || `Generate ${count}`;

    button.addEventListener("click", () => {
      renderResults(resultList, config, count, copy);
      scrollArea.scrollTop = 0;
    });

    controls.appendChild(button);
  });

  header.appendChild(headerText);
  header.appendChild(controls);

  // Note
  const note = document.createElement("p");
  note.className = "generator-note";
  note.textContent = gen.note;

  container.appendChild(header);
  container.appendChild(scrollArea);
  container.appendChild(note);
}

function renderResults(resultList, config, count, copy) {
  const entries = generateRandomEntries(config, count);

  resultList.innerHTML = "";
  
  const c = copy || { generator: { setLabel: "Set" } };

  entries.forEach((entry, index) => {
    const set = document.createElement("article");
    set.className = "generated-set";

    const label = document.createElement("div");
    label.className = "set-label";
    label.textContent = `${c.generator.setLabel} ${index + 1}`;

    const ballRow = document.createElement("div");
    ballRow.className = "ball-row";

    // Main numbers
    entry.mainNumbers.forEach((number) => {
      const ball = document.createElement("span");
      ball.className = "lottery-ball main-ball";
      ball.textContent = number;
      ballRow.appendChild(ball);
    });

    // Separator label & Secondary numbers
    if (config.secondary && !config.secondary.drawOnly) {
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
    }

    set.appendChild(label);
    set.appendChild(ballRow);
    resultList.appendChild(set);
  });
}
