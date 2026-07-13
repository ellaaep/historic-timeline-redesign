function localizeLayerSwitches() {
  document.querySelectorAll<HTMLButtonElement>(".lane-toggle-list button").forEach((button) => {
    const state = button.querySelector<HTMLElement>("i");
    if (!state) return;
    const active = button.classList.contains("active");
    state.textContent = active ? "Zapnuto" : "Vypnuto";
    button.setAttribute("aria-pressed", String(active));
    const label = button.querySelector<HTMLElement>("strong")?.textContent?.trim();
    if (label) button.setAttribute("aria-label", `${label}: ${active ? "zapnuto" : "vypnuto"}`);
  });
}

export function installTimelineLocalizationV5() {
  if (document.documentElement.dataset.timelineLocalizationV5 === "true") return;
  document.documentElement.dataset.timelineLocalizationV5 = "true";

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      localizeLayerSwitches();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  document.addEventListener("click", schedule, true);
  schedule();
}
