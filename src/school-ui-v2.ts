const previewImageCache = new Map<string, string>();

async function resolvePreviewImage(title: string): Promise<string | null> {
  const cached = previewImageCache.get(title);
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
      const image = data.thumbnail?.source || data.originalimage?.source;
      if (image) {
        previewImageCache.set(title, image);
        return image;
      }
    } catch {
      // Continue with the next language.
    }
  }

  return null;
}

function fillPreviewCard(
  card: HTMLElement,
  kind: string,
  title: string,
  date: string,
  wikiTitle: string,
) {
  let kindElement = card.querySelector<HTMLElement>(".sample-kind");
  const copy = card.querySelector<HTMLElement>("div");
  if (!kindElement && copy) {
    kindElement = document.createElement("span");
    kindElement.className = "sample-kind";
    copy.prepend(kindElement);
  }
  if (kindElement) kindElement.textContent = kind;

  const titleElement = card.querySelector<HTMLElement>("strong");
  const dateElement = card.querySelector<HTMLElement>("small");
  if (titleElement) titleElement.textContent = title;
  if (dateElement) dateElement.textContent = date;

  const host = card.querySelector<HTMLElement>(".sample-image");
  if (!host) return;
  void resolvePreviewImage(wikiTitle).then((source) => {
    if (!source || !host.isConnected) return;
    let image = host.querySelector<HTMLImageElement>("img");
    if (!image) {
      host.replaceChildren();
      image = document.createElement("img");
      host.appendChild(image);
    }
    image.src = source;
    image.alt = title;
    image.referrerPolicy = "no-referrer";
  });
}

function createPreviewCard(className: string) {
  const card = document.createElement("div");
  card.className = `hero-sample-card ${className}`;
  card.innerHTML =
    '<span class="sample-image"><span class="image-fallback">•</span></span><div><span class="sample-kind"></span><strong></strong><small></small></div>';
  return card;
}

function prepareEducationalPreview() {
  const hero = document.querySelector<HTMLElement>(".hero-visual");
  if (!hero || hero.dataset.educationalPreview === "true") return;
  hero.dataset.educationalPreview = "true";
  hero.classList.add("school-preview");

  const caption = document.createElement("span");
  caption.className = "hero-preview-caption";
  caption.textContent = "Ukázka propojení literatury a dějepisu · 1883–1938";
  hero.appendChild(caption);

  const periodValues = [
    ["Rakousko-Uhersko", "1867–1918"],
    ["První republika", "1918–1938"],
    ["Meziválečná literatura", "1918–1939"],
  ];
  hero.querySelectorAll<HTMLElement>(".hero-period").forEach((period, index) => {
    const value = periodValues[index];
    if (value) period.innerHTML = `${value[0]} <small>${value[1]}</small>`;
  });

  const existingCards = [...hero.querySelectorAll<HTMLElement>(".hero-sample-card")];
  while (existingCards.length < 5) {
    const className = existingCards.length === 3 ? "card-four" : "card-five";
    const card = createPreviewCard(className);
    hero.appendChild(card);
    existingCards.push(card);
  }

  fillPreviewCard(existingCards[0], "Autor", "Franz Kafka", "1883–1924", "Franz Kafka");
  fillPreviewCard(existingCards[1], "Dílo", "Proměna", "1915", "Proměna (povídka)");
  fillPreviewCard(existingCards[2], "Historický mezník", "Vznik Československa", "1918", "Vznik Československa");
  fillPreviewCard(existingCards[3], "Autor", "Karel Čapek", "1890–1938", "Karel Čapek");
  fillPreviewCard(existingCards[4], "Dílo", "R.U.R.", "1920", "R.U.R.");

  const crosshair = hero.querySelector<HTMLElement>(".hero-crosshair span");
  if (crosshair) crosshair.textContent = "1918";

  hero.querySelector(".hero-school-links")?.remove();
  const links = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  links.setAttribute("class", "hero-school-links");
  links.setAttribute("viewBox", "0 0 1000 570");
  links.setAttribute("preserveAspectRatio", "none");
  links.innerHTML =
    '<path d="M 225 235 C 250 260, 285 278, 330 305"/><path d="M 755 235 C 740 258, 720 280, 690 305"/><path d="M 335 330 C 400 350, 445 370, 500 410"/><path d="M 690 330 C 625 350, 575 370, 520 410"/>';
  hero.appendChild(links);

  let context = hero.querySelector<HTMLElement>(".hero-school-context");
  if (!context) {
    context = document.createElement("div");
    context.className = "hero-school-context";
    hero.appendChild(context);
  }
  context.textContent = "2 autoři · 2 díla · 1 historický mezník";
}

function buildFullscreenLauncher(frame: HTMLElement) {
  if (frame.nextElementSibling?.classList.contains("school-fullscreen-launch")) return;

  const launcher = document.createElement("div");
  launcher.className = "school-fullscreen-launch";
  launcher.innerHTML = `
    <div class="school-fullscreen-launch-copy">
      <strong>Potřebuješ více prostoru pro práci s časovou osou?</strong>
      <span>Otevři celou aplikaci přes celou obrazovku. Filtry, přibližování, posun i otevírání detailů zůstanou funkční.</span>
    </div>
    <button type="button">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>
      Zobrazit časovou osu na celou obrazovku
    </button>
  `;

  launcher.querySelector("button")?.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await frame.requestFullscreen();
      }
    } catch {
      frame.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  frame.insertAdjacentElement("afterend", launcher);
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function addSchoolOverviewPreset(frame: HTMLElement) {
  const presetRow = frame.querySelector<HTMLElement>(".preset-row");
  if (!presetRow || presetRow.querySelector(".school-overview-preset")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "school-overview-preset";
  button.textContent = "Literatura a dějiny 1880–2026";
  button.addEventListener("click", () => {
    const range = frame.querySelector<HTMLElement>(".sidebar-range");
    const inputs = range?.querySelectorAll<HTMLInputElement>("input");
    const apply = range?.querySelector<HTMLButtonElement>("button");
    if (!inputs || inputs.length < 2 || !apply) return;
    setReactInputValue(inputs[0], "1880");
    setReactInputValue(inputs[1], "2026");
    window.setTimeout(() => apply.click(), 30);
  });
  presetRow.insertBefore(button, presetRow.children[1] || null);
}

function prepareTimelineControls() {
  const frame = document.querySelector<HTMLElement>(".timeline-frame");
  if (!frame) return;
  frame.querySelector<HTMLElement>('.topbar > button[title="Celá obrazovka"]')?.remove();
  buildFullscreenLauncher(frame);
  addSchoolOverviewPreset(frame);
}

export function installSchoolUiV2() {
  if (document.documentElement.dataset.schoolUiV2 === "true") return;
  document.documentElement.dataset.schoolUiV2 = "true";

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      prepareEducationalPreview();
      prepareTimelineControls();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", schedule);
  schedule();
}
