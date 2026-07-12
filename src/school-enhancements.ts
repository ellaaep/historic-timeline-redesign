const WIKI_SUMMARY_CACHE = new Map<string, string>();

async function wikiThumbnail(title: string): Promise<string | null> {
  const cached = WIKI_SUMMARY_CACHE.get(title);
  if (cached) return cached;

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
        WIKI_SUMMARY_CACHE.set(title, source);
        return source;
      }
    } catch {
      // Try the next language.
    }
  }

  return null;
}

function setPreviewImage(card: Element | null, title: string) {
  const image = card?.querySelector<HTMLImageElement>(".sample-image img");
  if (!image) return;
  void wikiThumbnail(title).then((source) => {
    if (source && image.isConnected) {
      image.src = source;
      image.alt = title;
    }
  });
}

function updateHeroPreview() {
  const hero = document.querySelector<HTMLElement>(".hero-visual");
  if (!hero || hero.dataset.schoolPreview === "true") return;
  hero.dataset.schoolPreview = "true";
  hero.classList.add("school-preview");

  const heading = document.querySelector<HTMLElement>(".hero-copy h1");
  if (heading) heading.innerHTML = "Historie a literatura <em>v souvislostech.</em>";

  const intro = document.querySelector<HTMLElement>(".hero-copy > p");
  if (intro) {
    intro.textContent =
      "Přehledná výuková časová osa pro češtinu, dějepis a společenské vědy. Ukazuje, kteří autoři tvořili ve stejné době jako důležité historické události, objevy a umělecké směry.";
  }

  const periods = hero.querySelectorAll<HTMLElement>(".hero-period");
  const periodTexts = [
    ["První republika", "1918–1938"],
    ["Meziválečná literatura", "1918–1939"],
    ["Druhá světová válka", "1939–1945"],
  ];
  periods.forEach((period, index) => {
    const value = periodTexts[index];
    if (!value) return;
    period.innerHTML = `${value[0]} <small>${value[1]}</small>`;
  });

  const cards = hero.querySelectorAll<HTMLElement>(".hero-sample-card");
  const cardData = [
    ["Karel Čapek", "1890–1938", "Karel Čapek"],
    ["R.U.R.", "1920", "R.U.R."],
    ["Vznik Československa", "1918", "Vznik Československa"],
  ];
  cards.forEach((card, index) => {
    const value = cardData[index];
    if (!value) return;
    const title = card.querySelector<HTMLElement>("strong");
    const date = card.querySelector<HTMLElement>("small");
    if (title) title.textContent = value[0];
    if (date) date.textContent = value[1];
    setPreviewImage(card, value[2]);
  });

  const crosshair = hero.querySelector<HTMLElement>(".hero-crosshair span");
  if (crosshair) crosshair.textContent = "1920";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "hero-school-links");
  svg.setAttribute("viewBox", "0 0 1000 500");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.innerHTML =
    '<path d="M 275 168 C 340 205, 420 235, 505 292"/><path d="M 505 292 C 585 280, 650 255, 740 218"/>';
  hero.appendChild(svg);

  const context = document.createElement("div");
  context.className = "hero-school-context";
  context.textContent = "autor → dílo → historický kontext";
  hero.appendChild(context);
}

function createFullscreenDetail(card: HTMLElement, fullscreenElement: HTMLElement) {
  fullscreenElement.querySelector(".school-fullscreen-detail")?.remove();

  const title = card.querySelector<HTMLElement>(".card-copy strong")?.textContent?.trim() ||
    card.getAttribute("title")?.split(" · ")[0] ||
    "Detail položky";
  const date = card.querySelector<HTMLElement>(".card-copy small")?.textContent?.trim() || "";
  const sourceImage = card.querySelector<HTMLImageElement>(".card-image img");

  const detail = document.createElement("aside");
  detail.className = "school-fullscreen-detail";
  detail.innerHTML = `
    <button type="button" aria-label="Zavřít detail">×</button>
    <figure></figure>
    <section>
      <h2></h2>
      <p></p>
      <a target="_blank" rel="noreferrer">Otevřít na Wikipedii</a>
    </section>
  `;

  detail.querySelector<HTMLElement>("h2")!.textContent = title;
  detail.querySelector<HTMLElement>("p")!.textContent = date;
  const link = detail.querySelector<HTMLAnchorElement>("a")!;
  link.href = `https://cs.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(title)}`;

  const figure = detail.querySelector<HTMLElement>("figure")!;
  if (sourceImage?.src) {
    const image = document.createElement("img");
    image.src = sourceImage.src;
    image.alt = title;
    figure.appendChild(image);
  } else {
    void wikiThumbnail(title).then((source) => {
      if (!source || !figure.isConnected) return;
      const image = document.createElement("img");
      image.src = source;
      image.alt = title;
      figure.appendChild(image);
    });
  }

  detail.querySelector("button")?.addEventListener("click", () => detail.remove());
  fullscreenElement.appendChild(detail);
}

function installFullscreenCardDetails() {
  document.addEventListener(
    "click",
    (event) => {
      const fullscreenElement = document.fullscreenElement as HTMLElement | null;
      if (!fullscreenElement?.classList.contains("timeline-frame")) return;
      const target = event.target as Element | null;
      const card = target?.closest<HTMLElement>(".timeline-card");
      if (!card || !fullscreenElement.contains(card)) return;

      event.preventDefault();
      event.stopPropagation();
      createFullscreenDetail(card, fullscreenElement);
    },
    true,
  );

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      document.querySelector(".school-fullscreen-detail")?.remove();
    }
  });
}

function installWheelBehavior() {
  document.addEventListener(
    "wheel",
    (event) => {
      const target = event.target as Element | null;
      const viewport = target?.closest<HTMLElement>(".timeline-viewport");
      if (!viewport) return;

      const horizontalGesture =
        event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.8;
      const zoomGesture = event.ctrlKey || event.metaKey || event.altKey;
      if (horizontalGesture || zoomGesture) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      viewport.scrollTop += event.deltaY;
    },
    { capture: true, passive: false },
  );
}

function updateRelationLines(canvas: HTMLElement) {
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

function relayoutReadableCards() {
  const canvas = document.querySelector<HTMLElement>(".timeline-canvas");
  if (!canvas) return;

  const groups: Array<{ selector: string; minWidth: number }> = [
    { selector: ".timeline-card.kind-author", minWidth: 172 },
    { selector: ".timeline-card.kind-work", minWidth: 138 },
    { selector: ".timeline-card.lane-rulers", minWidth: 168 },
    { selector: ".timeline-card.lane-figures", minWidth: 168 },
  ];

  groups.forEach(({ selector, minWidth }) => {
    const cards = [...canvas.querySelectorAll<HTMLElement>(selector)];
    cards.forEach((card) => {
      const currentWidth = Number.parseFloat(card.style.width || "0");
      if (currentWidth >= minWidth) return;
      card.style.width = `${minWidth}px`;
      card.classList.add("school-readable-card");
      card.classList.remove("is-compact");
    });
  });

  updateRelationLines(canvas);
}

function installReadableCardObserver() {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      updateHeroPreview();
      relayoutReadableCards();
      installNavigationControls();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("pointerup", () => window.setTimeout(schedule, 40), true);
  document.addEventListener("wheel", () => window.setTimeout(schedule, 40), true);
  schedule();
}

function installNavigationControls() {
  const frame = document.querySelector<HTMLElement>(".timeline-frame");
  const viewport = frame?.querySelector<HTMLElement>(".timeline-viewport");
  const footer = frame?.querySelector<HTMLElement>(".timeline-footer");
  if (!frame || !viewport || !footer) return;

  if (!footer.querySelector(".school-pan-row")) {
    const panRow = document.createElement("div");
    panRow.className = "school-pan-row";
    panRow.innerHTML =
      '<span>Posun po časové ose</span><input type="range" min="-100" max="100" value="0" step="1" aria-label="Posunout časovou osu doleva nebo doprava"><small>vlevo ↔ vpravo</small>';
    const input = panRow.querySelector<HTMLInputElement>("input")!;
    let previous = 0;
    input.addEventListener("input", () => {
      const value = Number(input.value);
      const delta = value - previous;
      previous = value;
      viewport.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          shiftKey: true,
          deltaX: (delta / 100) * viewport.clientWidth * 0.9,
          clientX: viewport.getBoundingClientRect().left + viewport.clientWidth / 2,
        }),
      );
    });
    input.addEventListener("change", () => {
      previous = 0;
      input.value = "0";
    });
    footer.appendChild(panRow);
  }

  if (!frame.querySelector(".school-vertical-control")) {
    const control = document.createElement("label");
    control.className = "school-vertical-control";
    control.innerHTML =
      '<span>výška osy</span><input type="range" min="0" max="1000" value="0" aria-label="Posunout časovou osu nahoru nebo dolů">';
    const input = control.querySelector<HTMLInputElement>("input")!;
    let internal = false;
    input.addEventListener("input", () => {
      internal = true;
      const maximum = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      viewport.scrollTop = (Number(input.value) / 1000) * maximum;
      internal = false;
    });
    viewport.addEventListener("scroll", () => {
      if (internal) return;
      const maximum = Math.max(1, viewport.scrollHeight - viewport.clientHeight);
      input.value = String(Math.round((viewport.scrollTop / maximum) * 1000));
    });
    frame.appendChild(control);
  }
}

export function installSchoolEnhancements() {
  if (document.documentElement.dataset.schoolEnhancements === "true") return;
  document.documentElement.dataset.schoolEnhancements = "true";
  installWheelBehavior();
  installFullscreenCardDetails();
  installReadableCardObserver();
}
