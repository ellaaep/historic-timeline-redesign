const SCALE_STORAGE = "casovrstvy-row-scale-v1";
const FIT_STORAGE = "casovrstvy-fit-rows-v1";
const MIN_SCALE = 0.55;
const MAX_SCALE = 1.35;
const STEP = 0.1;

function clamp(value: number) {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
}

function readScale() {
  const stored = Number(localStorage.getItem(SCALE_STORAGE));
  return Number.isFinite(stored) ? clamp(stored) : 1;
}

function readFit() {
  return localStorage.getItem(FIT_STORAGE) === "true";
}

function updateItemPositions(app: HTMLElement, scale: number, fit: boolean) {
  app.querySelectorAll<HTMLElement>(".timeline-item").forEach((item) => {
    const current = Number.parseFloat(item.style.top || "0");
    const lastScaled = Number(item.dataset.lastScaledTop || "NaN");

    if (!item.dataset.baseTop || (Number.isFinite(current) && Number.isFinite(lastScaled) && Math.abs(current - lastScaled) > 0.75)) {
      item.dataset.baseTop = String(current || 14);
    }

    const baseTop = Number(item.dataset.baseTop || 14);
    let nextTop = 8 + Math.max(0, baseTop - 14) * scale;

    if (fit) {
      if (item.classList.contains("author-item") || item.classList.contains("person-item") || item.classList.contains("work-item")) {
        const slot = Math.round(Math.max(0, baseTop - 14) / 72) % 2;
        nextTop = 7 + slot * 48;
      } else {
        nextTop = 10;
      }
    }

    item.style.top = `${Math.round(nextTop)}px`;
    item.dataset.lastScaledTop = String(Math.round(nextTop));
  });
}

function applyState(app: HTMLElement, scale: number, fit: boolean) {
  const nextScale = clamp(scale);
  app.style.setProperty("--row-scale", String(nextScale));
  app.dataset.fitRows = fit ? "true" : "false";
  updateItemPositions(app, nextScale, fit);

  const control = app.querySelector<HTMLElement>(".timeline-scale-control");
  const slider = control?.querySelector<HTMLInputElement>('input[type="range"]');
  const output = control?.querySelector<HTMLOutputElement>("output");
  const fitButton = control?.querySelector<HTMLButtonElement>(".fit-rows-button");
  if (slider) slider.value = String(Math.round(nextScale * 100));
  if (output) output.value = `${Math.round(nextScale * 100)} %`;
  if (fitButton) fitButton.textContent = fit ? "Běžná výška řádků" : "Zobrazit více řádků";
}

function installControl(app: HTMLElement) {
  const controls = app.querySelector<HTMLElement>(".timeline-controls");
  if (!controls || controls.querySelector(".timeline-scale-control")) return;

  let scale = readScale();
  let fit = readFit();

  const control = document.createElement("div");
  control.className = "timeline-scale-control";
  control.innerHTML = `
    <strong>Velikost celého obsahu</strong>
    <button type="button" class="scale-down" aria-label="Zmenšit všechny řádky">−</button>
    <input type="range" min="55" max="135" step="5" value="${Math.round(scale * 100)}" aria-label="Velikost všech řádků, obrázků a textů">
    <button type="button" class="scale-up" aria-label="Zvětšit všechny řádky">+</button>
    <output>${Math.round(scale * 100)} %</output>
    <button type="button" class="fit-rows-button">${fit ? "Běžná výška řádků" : "Zobrazit více řádků"}</button>
  `;

  const guide = controls.querySelector(".timeline-usage-guide");
  if (guide) guide.insertAdjacentElement("afterend", control);
  else controls.prepend(control);

  const slider = control.querySelector<HTMLInputElement>('input[type="range"]')!;
  const output = control.querySelector<HTMLOutputElement>("output")!;

  const commit = (nextScale: number, nextFit = fit) => {
    scale = clamp(nextScale);
    fit = nextFit;
    localStorage.setItem(SCALE_STORAGE, String(scale));
    localStorage.setItem(FIT_STORAGE, String(fit));
    applyState(app, scale, fit);
  };

  slider.addEventListener("input", () => {
    fit = false;
    scale = Number(slider.value) / 100;
    output.value = `${Math.round(scale * 100)} %`;
    applyState(app, scale, fit);
  });
  slider.addEventListener("change", () => commit(Number(slider.value) / 100, false));
  control.querySelector(".scale-down")?.addEventListener("click", () => commit(scale - STEP, false));
  control.querySelector(".scale-up")?.addEventListener("click", () => commit(scale + STEP, false));
  control.querySelector(".fit-rows-button")?.addEventListener("click", () => {
    fit = !fit;
    commit(fit ? Math.min(scale, 0.72) : Math.max(scale, 0.9), fit);
    if (fit) app.querySelector<HTMLElement>(".timeline-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
  });

  applyState(app, scale, fit);
}

function labelExistingTimeZoom(app: HTMLElement) {
  const caption = app.querySelector<HTMLElement>(".zoom-caption");
  if (caption) caption.textContent = "Časový zoom";

  const guide = app.querySelector<HTMLElement>(".timeline-usage-guide");
  if (guide && !guide.querySelector(".row-scale-help")) {
    const message = document.createElement("span");
    message.className = "row-scale-help";
    message.innerHTML = "<b>Velikost obsahu</b> mění současně řádky, obrázky i text";
    guide.appendChild(message);
  }
}

function refresh(app: HTMLElement) {
  installControl(app);
  labelExistingTimeZoom(app);
  applyState(app, readScale(), readFit());
}

export function installTimelineScaleV4() {
  if (document.documentElement.dataset.timelineScaleV4 === "true") return;
  document.documentElement.dataset.timelineScaleV4 = "true";

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const app = document.querySelector<HTMLElement>(".timeline-app");
      if (app) refresh(app);
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("wheel", schedule, { passive: true });
  document.addEventListener("pointerup", schedule, true);
  window.addEventListener("resize", schedule);
  schedule();
}
