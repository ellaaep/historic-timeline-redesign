import { AUTHORS, WORKS } from "./data";

const AUTHOR_STORAGE = "casovrstvy-v3-authors";
const CUSTOM_STORAGE = "casovrstvy-v3-custom";
const EXACT_WORK_STORAGE = "casovrstvy-v3-exact-works";
const DEFAULT_AUTHOR_IDS = [
  "shakespeare",
  "komensky",
  "austen",
  "dostoevsky",
  "kafka",
  "capek",
  "orwell",
  "tolkien",
  "coelho",
  "mornstajnova",
];

const imageCache = new Map<string, string | null>();

function normalize(value: unknown) {
  return String(value || "")
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatYear(year: number) {
  return year < 0 ? `${Math.abs(Math.round(year)).toLocaleString("cs-CZ")} př. n. l.` : String(Math.round(year));
}

function formatRange(item: any) {
  if (item.living) return `${formatYear(item.start)}–dnes`;
  return Math.round(item.start) === Math.round(item.end)
    ? formatYear(item.start)
    : `${formatYear(item.start)}–${formatYear(item.end)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function resolveWikiImage(title: string): Promise<string | null> {
  if (!title) return null;
  if (imageCache.has(title)) return imageCache.get(title) ?? null;

  const storageKey = `casovrstvy-image:${title}`;
  const cached = sessionStorage.getItem(storageKey);
  if (cached) {
    imageCache.set(title, cached);
    return cached;
  }

  for (const language of ["cs", "en"] as const) {
    try {
      const response = await fetch(
        `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          title.replace(/ /g, "_"),
        )}`,
      );
      if (!response.ok) continue;
      const data = await response.json();
      const source = data.thumbnail?.source || data.originalimage?.source;
      if (source) {
        sessionStorage.setItem(storageKey, source);
        imageCache.set(title, source);
        return source;
      }
    } catch {
      // Keep the original icon when no image can be loaded.
    }
  }

  imageCache.set(title, null);
  return null;
}

function itemTitle(button: HTMLElement) {
  const title = button.getAttribute("title") || "";
  const separator = title.indexOf(" · ");
  if (separator > 0) return title.slice(0, separator).trim();
  return button.querySelector<HTMLElement>(".item-copy strong")?.textContent?.trim() || "";
}

function enhanceTimelineImages() {
  document.querySelectorAll<HTMLElement>(".timeline-item").forEach((button) => {
    if (button.classList.contains("author-item") || button.classList.contains("person-item")) return;
    if (button.dataset.wikiMediaRequested === "true") return;

    const host = button.querySelector<HTMLElement>(".item-icon, .item-media");
    const title = itemTitle(button);
    if (!host || !title) return;

    button.dataset.wikiMediaRequested = "true";
    host.classList.add("wiki-media");
    void resolveWikiImage(title).then((source) => {
      if (!source || !host.isConnected) return;
      const image = document.createElement("img");
      image.src = source;
      image.alt = title;
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      host.replaceChildren(image);
    });
  });
}

function keepLongLifePortraitsVisible() {
  document.querySelectorAll<HTMLElement>(".author-item, .person-item").forEach((item) => {
    const canvas = item.closest<HTMLElement>(".lane-canvas");
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    let offset = 0;

    if (itemRect.left < canvasRect.left + 10 && itemRect.right > canvasRect.left + 90) {
      offset = canvasRect.left + 12 - itemRect.left;
      offset = Math.max(0, Math.min(offset, Math.max(0, itemRect.width - 92)));
    }

    const next = `${Math.round(offset)}px`;
    if (item.style.getPropertyValue("--visible-anchor-offset") !== next) {
      item.style.setProperty("--visible-anchor-offset", next);
    }
  });
}

function layoutPeriods() {
  const track = document.querySelector<HTMLElement>(".period-track");
  if (!track) return;

  const trackRect = track.getBoundingClientRect();
  const rowEnds = [-Infinity, -Infinity, -Infinity, -Infinity];
  const buttons = [...track.querySelectorAll<HTMLButtonElement>("button")]
    .map((button) => ({ button, rect: button.getBoundingClientRect() }))
    .sort((a, b) => a.rect.left - b.rect.left || a.rect.width - b.rect.width);

  buttons.forEach(({ button, rect }) => {
    const left = rect.left - trackRect.left;
    const width = Math.max(118, Math.min(300, rect.width));
    let row = rowEnds.findIndex((end) => left >= end + 8);
    if (row < 0) {
      row = rowEnds.reduce((best, value, index) => (value < rowEnds[best] ? index : best), 0);
    }
    rowEnds[row] = left + width;
    const top = 9 + row * 47;
    button.style.top = `${top}px`;
    button.style.height = "40px";
    button.style.zIndex = String(10 + row);
    const strong = button.querySelector("strong")?.textContent?.trim();
    const small = button.querySelector("small")?.textContent?.trim();
    if (strong) button.title = small ? `${strong} · ${small}` : strong;
  });
}

function createChoiceImage(title: string, work = false) {
  const host = document.createElement("span");
  host.className = "choice-fallback";
  host.textContent = work ? "📖" : "👤";
  void resolveWikiImage(title).then((source) => {
    if (!source || !host.isConnected) return;
    const image = document.createElement("img");
    image.src = source;
    image.alt = title;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    host.replaceWith(image);
  });
  return host;
}

function getCatalog() {
  const custom = readJson<any>(CUSTOM_STORAGE, { authors: [], works: [] });
  const authors = [...AUTHORS, ...(Array.isArray(custom.authors) ? custom.authors : [])];
  const works = [...WORKS, ...(Array.isArray(custom.works) ? custom.works : [])];
  return {
    authors: [...new Map(authors.map((item: any) => [item.id, item])).values()],
    works: [...new Map(works.map((item: any) => [item.id, item])).values()],
  };
}

function findImportButton() {
  return [...document.querySelectorAll<HTMLButtonElement>(".sidebar-action")].find((button) => {
    const text = normalize(button.querySelector("strong")?.textContent || "");
    return text.includes("importovat") || text.includes("nahrat vlastni seznam");
  });
}

function openLiteraturePicker() {
  document.querySelector(".literature-picker-backdrop")?.remove();

  const { authors, works } = getCatalog();
  const selectedAuthors = new Set<string>(readJson<string[]>(AUTHOR_STORAGE, DEFAULT_AUTHOR_IDS));
  const storedExact = readJson<string[] | null>(EXACT_WORK_STORAGE, null);
  let allWorks = storedExact === null;
  let selectedWorks = new Set<string>(storedExact || []);
  let search = "";

  const backdrop = document.createElement("div");
  backdrop.className = "literature-picker-backdrop";
  backdrop.innerHTML = `
    <section class="literature-picker" role="dialog" aria-modal="true" aria-label="Výběr autorů a literárních děl">
      <header class="literature-picker-head">
        <div><h2>Vyber autory a jejich díla</h2><p>Vyber konkrétní autory, potom zvol všechna nebo jen některá jejich díla.</p></div>
        <button type="button" class="literature-picker-close" aria-label="Zavřít">×</button>
      </header>
      <div class="literature-picker-toolbar">
        <input class="literature-picker-search" type="search" placeholder="Hledat autora nebo dílo…" />
        <button type="button" data-action="recommended">Doporučený výběr</button>
        <button type="button" class="primary" data-action="import">Nahrát vlastní seznam četby</button>
      </div>
      <div class="literature-picker-body">
        <section class="literature-picker-column">
          <header><strong>Autoři</strong><small class="author-count"></small></header>
          <div class="literature-picker-list author-list"></div>
        </section>
        <section class="literature-picker-column">
          <header><strong>Díla vybraných autorů</strong><small class="work-count"></small></header>
          <label class="literature-work-options"><input type="checkbox" class="all-works-toggle" /> Zobrazit všechna díla vybraných autorů</label>
          <div class="literature-picker-list work-list"></div>
        </section>
      </div>
      <footer class="literature-picker-foot">
        <span class="literature-picker-summary"></span>
        <div><button type="button" data-action="cancel">Zrušit</button> <button type="button" class="primary" data-action="save">Použít výběr</button></div>
      </footer>
    </section>
  `;

  const authorList = backdrop.querySelector<HTMLElement>(".author-list")!;
  const workList = backdrop.querySelector<HTMLElement>(".work-list")!;
  const authorCount = backdrop.querySelector<HTMLElement>(".author-count")!;
  const workCount = backdrop.querySelector<HTMLElement>(".work-count")!;
  const summary = backdrop.querySelector<HTMLElement>(".literature-picker-summary")!;
  const allWorksToggle = backdrop.querySelector<HTMLInputElement>(".all-works-toggle")!;
  const searchInput = backdrop.querySelector<HTMLInputElement>(".literature-picker-search")!;

  const worksForSelectedAuthors = () => works.filter((work: any) => selectedAuthors.has(work.authorId));

  const render = () => {
    const normalizedSearch = normalize(search);
    const filteredAuthors = authors
      .filter((author: any) => !normalizedSearch || normalize(author.title).includes(normalizedSearch))
      .sort((a: any, b: any) => a.start - b.start)
      .slice(0, 220);

    authorList.replaceChildren();
    filteredAuthors.forEach((author: any) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `literature-choice${selectedAuthors.has(author.id) ? " selected" : ""}`;
      button.appendChild(createChoiceImage(author.wikiTitle || author.title));
      const copy = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = author.title;
      const small = document.createElement("small");
      small.textContent = formatRange(author);
      copy.append(strong, small);
      const check = document.createElement("span");
      check.className = "choice-check";
      check.textContent = "✓";
      button.append(copy, check);
      button.addEventListener("click", () => {
        if (selectedAuthors.has(author.id)) selectedAuthors.delete(author.id);
        else selectedAuthors.add(author.id);
        if (!allWorks) {
          selectedWorks = new Set(
            [...selectedWorks].filter((title) => works.some((work: any) => normalize(work.title) === title && selectedAuthors.has(work.authorId))),
          );
        }
        render();
      });
      authorList.appendChild(button);
    });

    const availableWorks = worksForSelectedAuthors();
    const filteredWorks = availableWorks
      .filter((work: any) => !normalizedSearch || normalize(`${work.title} ${authors.find((a: any) => a.id === work.authorId)?.title || ""}`).includes(normalizedSearch))
      .sort((a: any, b: any) => a.start - b.start);

    workList.replaceChildren();
    filteredWorks.forEach((work: any) => {
      const normalizedTitle = normalize(work.title);
      const selected = allWorks || selectedWorks.has(normalizedTitle);
      const author = authors.find((item: any) => item.id === work.authorId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `literature-choice work-choice${selected ? " selected" : ""}`;
      button.disabled = allWorks;
      button.appendChild(createChoiceImage(work.wikiTitle || work.title, true));
      const copy = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = work.title;
      const small = document.createElement("small");
      small.textContent = `${author?.title || "Neznámý autor"} · ${formatYear(work.start)}`;
      copy.append(strong, small);
      const check = document.createElement("span");
      check.className = "choice-check";
      check.textContent = "✓";
      button.append(copy, check);
      button.addEventListener("click", () => {
        if (allWorks) return;
        if (selectedWorks.has(normalizedTitle)) selectedWorks.delete(normalizedTitle);
        else selectedWorks.add(normalizedTitle);
        render();
      });
      workList.appendChild(button);
    });

    allWorksToggle.checked = allWorks;
    authorCount.textContent = `${selectedAuthors.size} vybraných z ${authors.length}`;
    const selectedWorkCount = allWorks ? availableWorks.length : availableWorks.filter((work: any) => selectedWorks.has(normalize(work.title))).length;
    workCount.textContent = `${selectedWorkCount} zobrazených děl`;
    summary.textContent = `${selectedAuthors.size} autorů · ${selectedWorkCount} děl`;
  };

  allWorksToggle.addEventListener("change", () => {
    allWorks = allWorksToggle.checked;
    if (!allWorks && selectedWorks.size === 0) {
      selectedWorks = new Set(worksForSelectedAuthors().map((work: any) => normalize(work.title)));
    }
    render();
  });

  searchInput.addEventListener("input", () => {
    search = searchInput.value;
    render();
  });

  const close = () => backdrop.remove();
  backdrop.querySelector(".literature-picker-close")?.addEventListener("click", close);
  backdrop.querySelector('[data-action="cancel"]')?.addEventListener("click", close);
  backdrop.addEventListener("mousedown", (event) => {
    if (event.target === backdrop) close();
  });

  backdrop.querySelector('[data-action="recommended"]')?.addEventListener("click", () => {
    selectedAuthors.clear();
    DEFAULT_AUTHOR_IDS.forEach((id) => selectedAuthors.add(id));
    allWorks = true;
    selectedWorks.clear();
    render();
  });

  backdrop.querySelector('[data-action="import"]')?.addEventListener("click", () => {
    close();
    window.setTimeout(() => findImportButton()?.click(), 30);
  });

  backdrop.querySelector('[data-action="save"]')?.addEventListener("click", () => {
    localStorage.setItem(AUTHOR_STORAGE, JSON.stringify([...selectedAuthors]));
    if (allWorks) localStorage.removeItem(EXACT_WORK_STORAGE);
    else localStorage.setItem(EXACT_WORK_STORAGE, JSON.stringify([...selectedWorks]));
    sessionStorage.setItem("casovrstvy-scroll-to-timeline", "true");
    window.location.reload();
  });

  document.body.appendChild(backdrop);
  render();
  window.setTimeout(() => searchInput.focus(), 20);
}

function enhanceLiteratureActions() {
  document.querySelectorAll<HTMLButtonElement>(".sidebar-action").forEach((button) => {
    const strong = button.querySelector<HTMLElement>("strong");
    const small = button.querySelector<HTMLElement>("small");
    if (!strong || !small) return;
    const label = normalize(strong.textContent || "");

    if (label.includes("vybrat vlastni autory") || label.includes("vybrat autory a jejich dila")) {
      strong.textContent = "Vybrat autory a jejich díla";
      small.textContent = "Zvol konkrétní autory i jednotlivá literární díla";
      if (button.dataset.literaturePickerBound !== "true") {
        button.dataset.literaturePickerBound = "true";
        button.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            openLiteraturePicker();
          },
          true,
        );
      }
    }

    if (label.includes("importovat vlastni") || label.includes("nahrat vlastni seznam")) {
      strong.textContent = "Nahrát vlastní seznam četby";
      small.textContent = "PDF, DOCX, TXT nebo CSV; autoři a díla se importují do osy";
    }
  });
}

function restoreTimelineScroll() {
  if (sessionStorage.getItem("casovrstvy-scroll-to-timeline") !== "true") return;
  sessionStorage.removeItem("casovrstvy-scroll-to-timeline");
  window.setTimeout(() => document.querySelector(".timeline-app")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
}

function applyPolish() {
  layoutPeriods();
  enhanceTimelineImages();
  keepLongLifePortraitsVisible();
  enhanceLiteratureActions();
}

export function installTimelinePolishV3() {
  if (document.documentElement.dataset.timelinePolishV3 === "true") return;
  document.documentElement.dataset.timelinePolishV3 = "true";

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyPolish();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("pointermove", (event) => {
    if ((event.target as Element | null)?.closest?.(".timeline-grid")) schedule();
  }, { passive: true });
  document.addEventListener("wheel", schedule, { passive: true });
  document.addEventListener("click", () => window.setTimeout(schedule, 30), true);
  window.addEventListener("resize", schedule);

  restoreTimelineScroll();
  schedule();
}
