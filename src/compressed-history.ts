const OVERVIEW_START = 1000;
const OVERVIEW_END = 2026;
const DEFAULT_FLAG = "casovrstvy-compressed-overview-v1";

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

function createButton(label: string, start: number, end: number, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  button.dataset.rangeStart = String(start);
  button.dataset.rangeEnd = String(end);
  return button;
}

function installCompressedNavigation(frame: HTMLElement) {
  const strip = frame.querySelector<HTMLElement>(".period-strip");
  if (!strip || strip.querySelector(".compressed-history-nav")) return;
  strip.classList.add("has-compressed-history");

  const navigation = document.createElement("div");
  navigation.className = "compressed-history-nav";
  navigation.innerHTML = `
    <div class="compressed-history-break">
      <span class="compressed-history-zigzag" aria-hidden="true">//</span>
      <span class="compressed-history-copy">
        <strong>Starší dějiny jsou v přehledu zkrácené</strong>
        <small>přibližně 13 000 let před rokem 1000</small>
      </span>
    </div>
  `;

  navigation.append(
    createButton("Pravěk", -12000, -3000),
    createButton("Starověk", -3000, 500),
    createButton("Raný středověk", 500, 1000),
    createButton("Přehled od roku 1000", OVERVIEW_START, OVERVIEW_END, "overview"),
  );

  navigation.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button[data-range-start]");
    if (!button) return;
    applyRange(frame, Number(button.dataset.rangeStart), Number(button.dataset.rangeEnd));
  });

  const canvas = strip.querySelector(".period-strip-canvas");
  strip.insertBefore(navigation, canvas || null);

  const note = document.createElement("div");
  note.className = "compressed-axis-note";
  note.textContent = "Zlom osy: starší tisíciletí nezabírají většinu šířky.";
  frame.appendChild(note);
}

function replaceFullHistoryPreset(frame: HTMLElement) {
  const row = frame.querySelector<HTMLElement>(".preset-row");
  if (!row) return;

  const button = [...row.querySelectorAll<HTMLButtonElement>("button")].find(
    (candidate) => candidate.textContent?.trim() === "Celá historie",
  );
  if (!button || button.dataset.compressedOverview === "true") return;

  button.dataset.compressedOverview = "true";
  button.classList.add("compressed-overview-button");
  button.textContent = "Přehled dějin";
  button.title = "Zkrácený školní přehled od prvních širokých literárních a uměleckých směrů";
  button.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      applyRange(frame, OVERVIEW_START, OVERVIEW_END);
    },
    true,
  );
}

function setInitialSchoolOverview(frame: HTMLElement) {
  try {
    if (localStorage.getItem(DEFAULT_FLAG) === "true") return;
    localStorage.setItem(DEFAULT_FLAG, "true");
  } catch {
    // The overview can still be applied when storage is unavailable.
  }
  applyRange(frame, OVERVIEW_START, OVERVIEW_END);
}

export function installCompressedHistory() {
  if (document.documentElement.dataset.compressedHistory === "true") return;
  document.documentElement.dataset.compressedHistory = "true";

  let initialized = false;
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const frame = document.querySelector<HTMLElement>(".timeline-frame");
      if (!frame) return;
      installCompressedNavigation(frame);
      replaceFullHistoryPreset(frame);
      if (!initialized) {
        initialized = true;
        window.setTimeout(() => setInitialSchoolOverview(frame), 120);
      }
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  schedule();
}
