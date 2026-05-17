export function renderTabs(container, gameConfigs, activeGameId, onTabChange) {
  container.innerHTML = "";

  gameConfigs.forEach((config) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "tab-btn";
    button.textContent = config.name;
    button.dataset.gameId = config.id;

    if (config.id === activeGameId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      onTabChange(config.id);
    });

    container.appendChild(button);
  });
}