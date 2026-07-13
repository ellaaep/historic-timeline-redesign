const V6_IMAGE_CACHE = new Map<string, string | null>();

function normalizeV6(value: unknown) {
  return String(value || "")
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stableHashV6(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

async function resolveWikiImageV6(title: string): Promise<string | null> {
  if (!title) return null;
  if (V6_IMAGE_CACHE.has(title)) return V6_IMAGE_CACHE.get(title) ?? null;

  const storageKey = `casovrstvy-image-v6:${title}`;
  const cached = sessionStorage.getItem(storageKey);
  if (cached) {
    V6_IMAGE_CACHE.set(title, cached);
    return cached;
  }

  for (const language of ["cs", "en"] as const) {
    try {
      const summary = await fetch(
        `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          title.replace(/ /g, "_"),
        )}`,
      );
      if (summary.ok) {
        const data = await summary.json();
        const source = data.thumbnail?.source || data.originalimage?.source;
        if (source) {
          sessionStorage.setItem(storageKey, source);
          V6_IMAGE_CACHE.set(title, source);
          return source;
        }
      }
    } catch {
      // Fall through to the search endpoint.
    }

    try {
      const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
      Object.entries({
        action: "query",
        generator: "search",
        gsrsearch: title,
        gsrlimit: "1",
        prop: "pageimages",
        piprop: "thumbnail",
        pithumbsize: "420",
        format: "json",
        formatversion: "2",
        origin: "*",
      }).forEach(([key, value]) => url.searchParams.set(key, value));
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      const source = data.query?.pages?.[0]?.thumbnail?.source;
      if (source) {
        sessionStorage.setItem(storageKey, source);
        V6_IMAGE_CACHE.set(title, source);
        return source;
      }
    } catch {
      // Continue with the next language.
    }
  }

  V6_IMAGE_CACHE.set(title, null);
  return null;
}

function itemTitleV6(item: HTMLElement) {
  const title = item.getAttribute("title") || "";
  const separator = title.indexOf(" · ");
  if (separator > 0) return title.slice(0, separator).trim();
  return item.querySelector<HTMLElement>(".item-copy strong")?.textContent?.trim() || "";
}

function laneKeyFromLabel(label: string) {
  const value = normalizeV6(label);
  if (value.includes("autori")) return "authors";
  if (value === "dila" || value.includes("literarni dila")) return "works";
  if (value.includes("vladci") || value.includes("prezidenti")) return "rulers";
  if (value.includes("ceske dejiny")) return "czech";
  if (value.includes("svet") || value.includes("valky")) return "world";
  if (value.includes("vynalezy") || value.includes("veda")) return "tech";
  if (value.includes("stavby") || value.includes("hrady")) return "monuments";
  if (value.includes("vyznamne osobnosti")) return "figures";
  return "unknown";
}

function decorateLanesV6() {
  document.querySelectorAll<HTMLElement>(".timeline-lane").forEach((lane) => {
    const label = lane.querySelector<HTMLElement>("header strong")?.textContent || "";
    const key = laneKeyFromLabel(label);
    lane.dataset.lane = key;

    const countText = lane.querySelector<HTMLElement>("header small")?.textContent || "";
    const visibleCount = Number.parseInt(countText, 10);
    lane.classList.toggle("is-empty-lane", Number.isFinite(visibleCount) && visibleCount === 0);

    const items = [...lane.querySelectorAll<HTMLElement>(".timeline-item")];
    const rows = key === "authors" ? 3 : key === "rulers" || key === "figures" ? 2 : 2;
    const rowStep = key === "authors" ? 72 : key === "works" ? 48 : key === "rulers" || key === "figures" ? 68 : 56;
    const baseTop = key === "authors" ? 8 : 7;

    items.forEach((item) => {
      const title = itemTitleV6(item);
      const row = stableHashV6(`${key}:${title}`) % rows;
      item.style.top = `${baseTop + row * rowStep}px`;
      item.dataset.v6Row = String(row);

      if (key === "works") item.classList.add("compact-work-item");
      if (["czech", "world", "tech", "monuments"].includes(key)) item.classList.add("visual-marker-item");
      if (["rulers", "figures"].includes(key)) item.classList.add("person-item");
    });
  });
}

function ensureWikiImagesV6() {
  document.querySelectorAll<HTMLElement>(".timeline-item").forEach((item) => {
    if (item.dataset.v6ImageRequested === "true") return;
    const title = itemTitleV6(item);
    if (!title) return;

    const host = item.querySelector<HTMLElement>(
      ".timeline-cutout, .person-portrait, .item-icon, .item-media",
    );
    if (!host) return;

    item.dataset.v6ImageRequested = "true";
    host.classList.add("v6-wiki-media");
    void resolveWikiImageV6(title).then((source) => {
      if (!source || !host.isConnected) return;
      const image = document.createElement("img");
      image.src = source;
      image.alt = title;
      image.loading = "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      host.replaceChildren(image);
      host.classList.add("has-wiki-image");
    });
  });
}

function localizeSwitchesV6() {
  document.querySelectorAll<HTMLButtonElement>(".lane-toggle-list button").forEach((button) => {
    const state = button.querySelector<HTMLElement>("i");
    if (!state) return;
    const active = button.classList.contains("active");
    state.textContent = active ? "Zapnuto" : "Vypnuto";
    button.setAttribute("aria-pressed", String(active));
  });
}

function compactPeriodsV6() {
  const track = document.querySelector<HTMLElement>(".period-track");
  if (!track) return;

  const trackRect = track.getBoundingClientRect();
  const rowEnds = [-Infinity, -Infinity, -Infinity, -Infinity];
  const buttons = [...track.querySelectorAll<HTMLButtonElement>("button")]
    .map((button) => ({ button, rect: button.getBoundingClientRect() }))
    .sort((a, b) => a.rect.left - b.rect.left || a.rect.width - b.rect.width);

  buttons.forEach(({ button, rect }) => {
    const left = rect.left - trackRect.left;
    const width = Math.max(126, Math.min(260, rect.width));
    let row = rowEnds.findIndex((end) => left >= end + 7);
    if (row < 0) {
      row = rowEnds.reduce((best, value, index) => (value < rowEnds[best] ? index : best), 0);
    }
    rowEnds[row] = left + width;
    button.style.top = `${7 + row * 38}px`;
    button.style.height = "34px";
    button.style.zIndex = String(10 + row);
    const title = button.querySelector("strong")?.textContent?.trim();
    const years = button.querySelector("small")?.textContent?.trim();
    if (title) button.title = years ? `${title} · ${years}` : title;
  });
}

function addEmbeddedExperienceV6() {
  const app = document.querySelector<HTMLElement>(".timeline-app");
  const section = app?.closest<HTMLElement>(".timeline-section-redesign");
  if (!app || !section || section.querySelector(".timeline-embed-actions")) return;

  const panel = document.createElement("div");
  panel.className = "timeline-embed-actions";
  panel.innerHTML = `
    <div>
      <strong>Prohlížej osu pohodlněji</strong>
      <span>Otevři ji přes celou obrazovku, zhušti řádky nebo skoč rovnou k ovládání.</span>
    </div>
    <div class="timeline-embed-buttons">
      <button type="button" data-action="fullscreen">Celá obrazovka</button>
      <button type="button" data-action="compact">Zobrazit více řádků</button>
      <button type="button" data-action="controls">Přejít k ovládání</button>
    </div>
  `;

  panel.querySelector<HTMLButtonElement>('[data-action="fullscreen"]')?.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await app.requestFullscreen();
    } catch {
      app.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  panel.querySelector<HTMLButtonElement>('[data-action="compact"]')?.addEventListener("click", () => {
    const fit = app.querySelector<HTMLButtonElement>(".fit-rows-button");
    if (fit) fit.click();
    else app.dataset.fitRows = app.dataset.fitRows === "true" ? "false" : "true";
  });

  panel.querySelector<HTMLButtonElement>('[data-action="controls"]')?.addEventListener("click", () => {
    app.querySelector<HTMLElement>(".timeline-controls")?.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  app.insertAdjacentElement("beforebegin", panel);
}

function improveScaleCopyV6() {
  const control = document.querySelector<HTMLElement>(".timeline-scale-control");
  if (!control) return;
  const title = control.querySelector<HTMLElement>(":scope > strong");
  if (title) title.textContent = "Velikost řádků a obrázků";
  const slider = control.querySelector<HTMLInputElement>('input[type="range"]');
  if (slider) slider.title = "Zmenší nebo zvětší celé řádky, obrázky i text";
}

function refreshV6() {
  decorateLanesV6();
  ensureWikiImagesV6();
  localizeSwitchesV6();
  compactPeriodsV6();
  addEmbeddedExperienceV6();
  improveScaleCopyV6();
}

export function installTimelineCleanupV6() {
  if (document.documentElement.dataset.timelineCleanupV6 === "true") return;
  document.documentElement.dataset.timelineCleanupV6 = "true";

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      refreshV6();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  document.addEventListener("click", schedule, true);
  document.addEventListener("input", schedule, true);
  window.addEventListener("resize", schedule);
  schedule();
}
