import { AUTHORS } from "./data";
import { WORLD_OVERVIEW_AUTHOR_IDS } from "./world-author-catalog";

const LANES = [
  "authors",
  "works",
  "rulers",
  "czech",
  "world",
  "tech",
  "monuments",
  "figures",
] as const;

type LaneName = (typeof LANES)[number];

const HEIGHTS: Record<LaneName, number> = {
  authors: 190,
  works: 168,
  rulers: 142,
  czech: 162,
  world: 162,
  tech: 162,
  monuments: 162,
  figures: 142,
};

const ORIGINAL_TOPS = LANES.reduce((result, lane) => {
  const previousLane = LANES[LANES.indexOf(lane) - 1];
  result[lane] = previousLane
    ? result[previousLane] + HEIGHTS[previousLane]
    : 24;
  return result;
}, {} as Record<LaneName, number>);

function valueAsNumber(value: string | undefined) {
  const number = Number.parseFloat(value || "");
  return Number.isFinite(number) ? number : 0;
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function applyRange(frame: HTMLElement, start: number, end: number) {
  const range = frame.querySelector<HTMLElement>(".sidebar-range");
  const inputs = range?.querySelectorAll<HTMLInputElement>("input");
  const apply = range?.querySelector<HTMLButtonElement>("button");
  if (!inputs || inputs.length < 2 || !apply) return;
  setReactInputValue(inputs[0], String(start));
  setReactInputValue(inputs[1], String(end));
  window.setTimeout(() => apply.click(), 35);
}

function getFilterRows(frame: HTMLElement) {
  const rows = [...frame.querySelectorAll<HTMLButtonElement>(".filter-row")];
  return new Map<LaneName, HTMLButtonElement>(
    LANES.map((lane, index) => [lane, rows[index]]),
  );
}

function recalculateRelations(canvas: HTMLElement) {
  const author = canvas.querySelector<HTMLElement>(".timeline-card.kind-author.is-focused");
  const works = [...canvas.querySelectorAll<HTMLElement>(".timeline-card.kind-work.is-focused")];
  const paths = [...canvas.querySelectorAll<SVGPathElement>(".relation-layer path")];
  if (!author || !works.length || !paths.length) return;

  const canvasRect = canvas.getBoundingClientRect();
  const authorRect = author.getBoundingClientRect();
  works.forEach((work, index) => {
    const path = paths[index];
    if (!path) return;
    const workRect = work.getBoundingClientRect();
    const x1 = authorRect.left - canvasRect.left + authorRect.width / 2;
    const y1 = authorRect.bottom - canvasRect.top;
    const x2 = workRect.left - canvasRect.left + workRect.width / 2;
    const y2 = workRect.top - canvasRect.top;
    const bend = y1 + (y2 - y1) * 0.52;
    path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${bend}, ${x2} ${bend}, ${x2} ${y2}`);
  });
}

function collapseInactiveLanes(frame: HTMLElement) {
  const canvas = frame.querySelector<HTMLElement>(".timeline-canvas");
  if (!canvas) return;

  const sections = [...canvas.querySelectorAll<HTMLElement>(".timeline-lane")];
  const filters = getFilterRows(frame);
  let nextTop = 24;

  LANES.forEach((lane, index) => {
    const section = sections[index];
    if (!section) return;
    section.dataset.lane = lane;
    const active = filters.get(lane)?.classList.contains("active") ?? true;
    section.dataset.collapsed = active ? "false" : "true";

    const cards = [...canvas.querySelectorAll<HTMLElement>(`.timeline-card.lane-${lane}`)];
    cards.forEach((card) => {
      card.dataset.collapsedLane = active ? "false" : "true";
    });

    if (!active) return;

    section.style.top = `${nextTop}px`;
    cards.forEach((card) => {
      if (!card.dataset.laneOffset) {
        const currentTop = valueAsNumber(card.style.top);
        card.dataset.laneOffset = String(currentTop - ORIGINAL_TOPS[lane]);
      }
      const offset = Number(card.dataset.laneOffset || 0);
      card.style.top = `${nextTop + offset}px`;
    });
    nextTop += HEIGHTS[lane];
  });

  canvas.style.height = `${Math.max(260, nextTop + 34)}px`;
  window.requestAnimationFrame(() => recalculateRelations(canvas));
}

function setLayerPreset(frame: HTMLElement, mode: "all" | "history") {
  const rows = getFilterRows(frame);
  const wanted: Record<LaneName, boolean> = mode === "all"
    ? {
        authors: true,
        works: true,
        rulers: true,
        czech: true,
        world: true,
        tech: true,
        monuments: true,
        figures: true,
      }
    : {
        authors: false,
        works: false,
        rulers: true,
        czech: true,
        world: true,
        tech: true,
        monuments: true,
        figures: true,
      };

  LANES.forEach((lane) => {
    const row = rows.get(lane);
    if (!row) return;
    if (row.classList.contains("active") !== wanted[lane]) row.click();
  });
}

function installLayerPresets(frame: HTMLElement) {
  const sidebarScroll = frame.querySelector<HTMLElement>(".sidebar-scroll");
  const layersLabel = sidebarScroll?.querySelector<HTMLElement>(".layers-label");
  if (!sidebarScroll || !layersLabel || sidebarScroll.querySelector(".layer-presets")) return;

  const presets = document.createElement("div");
  presets.className = "layer-presets";
  presets.innerHTML = `
    <button type="button" data-layer-mode="all">Všechny vrstvy</button>
    <button type="button" data-layer-mode="history">Jen historie</button>
  `;
  presets.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button[data-layer-mode]");
    if (!button) return;
    setLayerPreset(frame, button.dataset.layerMode === "history" ? "history" : "all");
  });
  layersLabel.insertAdjacentElement("beforebegin", presets);
}

function installFitOverview(frame: HTMLElement) {
  const zoomRow = frame.querySelector<HTMLElement>(".zoom-row");
  if (!zoomRow || zoomRow.querySelector(".fit-overview-control")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "fit-overview-control";
  button.textContent = "Oddálit na přehled";
  button.title = "Zobrazit přehled od roku 1000 do současnosti";
  button.addEventListener("click", () => applyRange(frame, 1000, 2026));
  zoomRow.insertBefore(button, zoomRow.lastElementChild);
}

function installCatalogHelp() {
  const dialog = document.querySelector<HTMLElement>(".author-dialog");
  if (!dialog) return;

  const actions = dialog.querySelector<HTMLElement>(".author-actions");
  if (actions && !actions.querySelector(".world-author-preset")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "world-author-preset";
    button.textContent = "Světový přehled";
    button.addEventListener("click", () => {
      const clear = [...actions.querySelectorAll<HTMLButtonElement>("button")].find(
        (candidate) => candidate.textContent?.includes("Vymazat"),
      );
      clear?.click();
      window.setTimeout(() => {
        const titles = new Set(
          AUTHORS.filter((item) => WORLD_OVERVIEW_AUTHOR_IDS.includes(item.id)).map((item) => item.title),
        );
        document.querySelectorAll<HTMLButtonElement>(".author-grid button").forEach((authorButton) => {
          const title = authorButton.querySelector("strong")?.textContent?.trim();
          if (title && titles.has(title) && !authorButton.classList.contains("selected")) authorButton.click();
        });
      }, 80);
    });
    actions.insertBefore(button, actions.lastElementChild);
  }

  if (!dialog.querySelector(".public-catalog-note")) {
    const note = document.createElement("p");
    note.className = "public-catalog-note";
    note.innerHTML = `<strong>Přes 100 autorů v katalogu.</strong> Kliknutím autora zapneš nebo vypneš; jeho známá díla se přidají na osu automaticky.`;
    actions?.insertAdjacentElement("afterend", note);
  }
}

function repairTimelineOnly(frame: HTMLElement) {
  const only = frame.classList.contains("timeline-only");
  frame.querySelector<HTMLElement>(".app-shell")?.classList.toggle("timeline-only", only);
}

function refresh() {
  const frame = document.querySelector<HTMLElement>(".timeline-frame");
  if (!frame) return;
  repairTimelineOnly(frame);
  installLayerPresets(frame);
  installFitOverview(frame);
  installCatalogHelp();
  collapseInactiveLanes(frame);
}

export function installAdaptiveTimeline() {
  if (document.documentElement.dataset.adaptiveTimeline === "true") return;
  document.documentElement.dataset.adaptiveTimeline = "true";

  let scheduled = false;
  const schedule = (delay = 0) => {
    window.setTimeout(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        refresh();
      });
    }, delay);
  };

  const observer = new MutationObserver(() => schedule());
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", () => {
    schedule(0);
    schedule(60);
    schedule(220);
  }, true);
  window.addEventListener("resize", () => schedule());
  schedule();
}
