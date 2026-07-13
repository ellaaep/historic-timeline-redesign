const WIKI_IMAGE_CACHE = new Map<string, string | null>();

function normalizeLabel(value: string) {
  return value
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function resolveWikiImage(title: string): Promise<string | null> {
  if (WIKI_IMAGE_CACHE.has(title)) return WIKI_IMAGE_CACHE.get(title) ?? null;

  const storageKey = `casovrstvy-image:${title}`;
  const cached = sessionStorage.getItem(storageKey);
  if (cached) {
    WIKI_IMAGE_CACHE.set(title, cached);
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
      const image = data.thumbnail?.source || data.originalimage?.source;
      if (image) {
        sessionStorage.setItem(storageKey, image);
        WIKI_IMAGE_CACHE.set(title, image);
        return image;
      }
    } catch {
      // Continue with the next language and keep the existing fallback icon.
    }
  }

  WIKI_IMAGE_CACHE.set(title, null);
  return null;
}

function getItemTitle(button: HTMLButtonElement) {
  const titleAttribute = button.getAttribute("title") || "";
  const separator = titleAttribute.indexOf(" · ");
  if (separator > 0) return titleAttribute.slice(0, separator).trim();
  return button.querySelector<HTMLElement>(".item-copy strong")?.textContent?.trim() || "";
}

function enhancePersonRows() {
  document.querySelectorAll<HTMLElement>(".timeline-lane").forEach((lane) => {
    const laneName = normalizeLabel(lane.querySelector("header strong")?.textContent || "");
    const isPersonLane = laneName.includes("vladci") || laneName.includes("prezidenti") || laneName.includes("vyznamne osobnosti");
    if (!isPersonLane) return;

    lane.querySelectorAll<HTMLButtonElement>(".timeline-item").forEach((button) => {
      if (button.dataset.personEnhanced === "true") return;
      button.dataset.personEnhanced = "true";
      button.classList.add("person-item");

      const imageHost = button.querySelector<HTMLElement>(".item-icon");
      const title = getItemTitle(button);
      if (!imageHost || !title) return;
      imageHost.classList.add("person-portrait");

      void resolveWikiImage(title).then((source) => {
        if (!source || !imageHost.isConnected) return;
        const image = document.createElement("img");
        image.src = source;
        image.alt = title;
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        imageHost.replaceChildren(image);
      });
    });
  });
}

function enhanceImportAction() {
  document.querySelectorAll<HTMLButtonElement>(".sidebar-action").forEach((button) => {
    const strong = button.querySelector<HTMLElement>("strong");
    const small = button.querySelector<HTMLElement>("small");
    if (!strong || !small) return;
    const label = normalizeLabel(strong.textContent || "");
    if (!label.includes("nahrat vlastni seznam") && !label.includes("importovat vlastni")) return;

    strong.textContent = "Importovat vlastní autory a díla";
    small.textContent = "Nahraj soubor nebo vlož text; neznámé položky se dohledají";
    button.title = "Importovat autory a literární díla z PDF, DOCX, TXT, CSV nebo JSON";
  });
}

function addControlCaption(parent: Element, text: string, className: string) {
  if (parent.querySelector(`.${className}`)) return;
  const caption = document.createElement("span");
  caption.className = `control-caption ${className}`;
  caption.textContent = text;
  parent.prepend(caption);
}

function enhanceControls() {
  const controls = document.querySelector<HTMLElement>(".timeline-controls");
  if (!controls) return;

  if (!controls.querySelector(".timeline-usage-guide")) {
    const guide = document.createElement("div");
    guide.className = "timeline-usage-guide";
    guide.innerHTML = `
      <strong>Jak ovládat časovou osu</strong>
      <span><b>Táhni myší</b> pro pohyb v čase</span>
      <span><b>Shift + kolečko</b> pro vodorovný posun</span>
      <span><b>Ctrl/Cmd + kolečko</b> pro přiblížení</span>
      <span><b>Klikni na položku</b> pro detail</span>
    `;
    controls.prepend(guide);
  }

  const controlRow = controls.querySelector<HTMLElement>(".control-row");
  const zoomSlider = controls.querySelector<HTMLInputElement>(".zoom-slider");
  const panControl = controls.querySelector<HTMLElement>(".pan-control");

  if (controlRow && zoomSlider && !controlRow.querySelector(".zoom-caption")) {
    const caption = document.createElement("span");
    caption.className = "control-caption zoom-caption";
    caption.textContent = "Přiblížení";
    controlRow.insertBefore(caption, zoomSlider);
    zoomSlider.setAttribute("aria-label", "Přiblížení časové osy");
    zoomSlider.title = "Přibliž nebo oddal časovou osu";
  }

  if (panControl) {
    addControlCaption(panControl, "Posun období", "pan-caption");
    const slider = panControl.querySelector<HTMLInputElement>("input");
    if (slider) {
      slider.setAttribute("aria-label", "Posunout zobrazené období");
      slider.title = "Posuň zobrazené období doleva nebo doprava";
    }
  }

  const iconButtons = controls.querySelectorAll<HTMLButtonElement>(".control-row > .icon-button");
  if (iconButtons[0]) {
    iconButtons[0].title = "Přiblížit";
    iconButtons[0].setAttribute("aria-label", "Přiblížit časovou osu");
  }
  if (iconButtons[1]) {
    iconButtons[1].title = "Oddálit";
    iconButtons[1].setAttribute("aria-label", "Oddálit časovou osu");
  }
}

function enhanceTimelineAccessibility() {
  const grid = document.querySelector<HTMLElement>(".timeline-grid");
  if (grid && !grid.dataset.controlsExplained) {
    grid.dataset.controlsExplained = "true";
    grid.title = "Táhni osu vodorovně. Ctrl/Cmd + kolečko přibližuje, Shift + kolečko posouvá.";
  }
}

function applyEnhancements() {
  enhancePersonRows();
  enhanceImportAction();
  enhanceControls();
  enhanceTimelineAccessibility();
}

export function installTimelineUxEnhancements() {
  if (document.documentElement.dataset.timelineUxEnhancements === "true") return;
  document.documentElement.dataset.timelineUxEnhancements = "true";

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyEnhancements();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  schedule();
}
