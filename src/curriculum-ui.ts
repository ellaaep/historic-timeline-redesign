import { AUTHORS } from "./data";
import {
  CERMAT_GENRES,
  CERMAT_MOVEMENTS,
  PRIMMAT_AUTHOR_TITLES,
} from "./curriculum-catalog";

const CERMAT_OVERVIEW = [
  "Homér",
  "Sofoklés",
  "Dante Alighieri",
  "Giovanni Boccaccio",
  "William Shakespeare",
  "Molière",
  "Jan Amos Komenský",
  "Johann Wolfgang von Goethe",
  "Jane Austenová",
  "George Gordon Byron",
  "Alexandr Sergejevič Puškin",
  "Karel Hynek Mácha",
  "Božena Němcová",
  "Fjodor Michajlovič Dostojevskij",
  "Charles Baudelaire",
  "Émile Zola",
  "Oscar Wilde",
  "Franz Kafka",
  "Karel Čapek",
  "Erich Maria Remarque",
  "George Orwell",
  "Samuel Beckett",
  "Albert Camus",
  "Bohumil Hrabal",
  "Milan Kundera",
  "Václav Havel",
] as const;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function openAuthorPicker() {
  const button = document.querySelector<HTMLButtonElement>(".author-picker-button");
  if (!document.querySelector(".author-dialog")) button?.click();
}

function selectAuthorTitles(titles: readonly string[]) {
  openAuthorPicker();
  window.setTimeout(() => {
    const dialog = document.querySelector<HTMLElement>(".author-dialog");
    if (!dialog) return;

    const search = dialog.querySelector<HTMLInputElement>(".dialog-search input");
    if (search) setReactInputValue(search, "");

    const clear = [...dialog.querySelectorAll<HTMLButtonElement>(".author-actions button")].find(
      (button) => button.textContent?.includes("Vymazat"),
    );
    clear?.click();

    const wanted = new Set(titles.map(normalize));
    window.setTimeout(() => {
      dialog.querySelectorAll<HTMLButtonElement>(".author-grid button").forEach((button) => {
        const title = button.querySelector("strong")?.textContent?.trim();
        if (title && wanted.has(normalize(title)) && !button.classList.contains("selected")) {
          button.click();
        }
      });
    }, 90);
  }, 120);
}

function addAuthorDialogPresets() {
  const dialog = document.querySelector<HTMLElement>(".author-dialog");
  const actions = dialog?.querySelector<HTMLElement>(".author-actions");
  if (!dialog || !actions || actions.querySelector(".curriculum-preset")) return;

  const primmat = document.createElement("button");
  primmat.type = "button";
  primmat.className = "curriculum-preset primmat";
  primmat.textContent = "PrimMat · školní seznam";
  primmat.title = "Vybrat autory všech 60 děl ze školního seznamu pro rok 2025";
  primmat.addEventListener("click", () => selectAuthorTitles(PRIMMAT_AUTHOR_TITLES));

  const cermat = document.createElement("button");
  cermat.type = "button";
  cermat.className = "curriculum-preset cermat";
  cermat.textContent = "CERMAT · průřez";
  cermat.title = "Vybrat reprezentativní autory napříč literární historií";
  cermat.addEventListener("click", () => selectAuthorTitles(CERMAT_OVERVIEW));

  actions.prepend(cermat);
  actions.prepend(primmat);

  const note = document.createElement("p");
  note.className = "curriculum-dialog-note";
  note.innerHTML =
    "<strong>Obsah podle dodaných školních materiálů.</strong> Katalog zahrnuje školní seznam 60 děl, autory požadované CERMATem, literární směry, skupiny a žánry.";
  actions.insertAdjacentElement("afterend", note);
}

function closeCurriculumDialog() {
  document.querySelector(".curriculum-backdrop")?.remove();
}

function listMarkup(values: readonly string[]) {
  return values.map((value) => `<span>${value}</span>`).join("");
}

function openCurriculumDialog() {
  closeCurriculumDialog();

  const backdrop = document.createElement("div");
  backdrop.className = "curriculum-backdrop";
  backdrop.innerHTML = `
    <section class="curriculum-dialog" role="dialog" aria-modal="true" aria-label="Maturitní literatura">
      <header>
        <div>
          <span>Maturitní obsah</span>
          <h2>Literatura podle školy a CERMATu</h2>
          <p>Školní seznam PrimMat 2025, maturitní literární historie, směry, autoři, díla a žánry na jednom místě.</p>
        </div>
        <button type="button" class="curriculum-close" aria-label="Zavřít">×</button>
      </header>

      <div class="curriculum-source-grid">
        <article>
          <strong>PrimMat · 60 děl</strong>
          <p>Kompletní školní nabídka od Dekameronu přes Kytici a Proměnu až po Hanu a Šikmý kostel.</p>
          <button type="button" data-action="primmat">Zobrazit autory školního seznamu</button>
        </article>
        <article>
          <strong>CERMAT · literární přehled</strong>
          <p>Autoři a směry, o kterých má mít maturant základní povědomí v literárněhistorických souvislostech.</p>
          <button type="button" data-action="cermat">Zobrazit reprezentativní průřez</button>
        </article>
      </div>

      <section class="curriculum-requirements">
        <h3>Pravidla výběru 20 maturitních děl</h3>
        <div>
          <span><b>2+</b> do konce 18. století</span>
          <span><b>3+</b> literatura 19. století</span>
          <span><b>4+</b> světová literatura 20. a 21. století</span>
          <span><b>5+</b> česká literatura 20. a 21. století</span>
        </div>
        <p>V seznamu musí být alespoň dvě prózy, dvě poezie a dvě dramata. Od jednoho autora lze zvolit nejvýše dvě díla.</p>
      </section>

      <details open>
        <summary>Literární epochy, směry, hnutí a skupiny <small>${CERMAT_MOVEMENTS.length}</small></summary>
        <div class="curriculum-chip-grid">${listMarkup(CERMAT_MOVEMENTS)}</div>
      </details>

      <details>
        <summary>Literární žánry <small>${CERMAT_GENRES.length}</small></summary>
        <div class="curriculum-chip-grid genres">${listMarkup(CERMAT_GENRES)}</div>
      </details>

      <footer>
        <span>Zdroj obsahu: školní seznam PrimMat ze dne 1. 9. 2025 a katalog požadavků CERMAT.</span>
        <button type="button" data-action="authors">Otevřít vlastní výběr autorů</button>
      </footer>
    </section>
  `;

  backdrop.addEventListener("click", (event) => {
    const target = event.target as Element;
    if (target === backdrop || target.closest(".curriculum-close")) closeCurriculumDialog();
    if (target.closest('[data-action="primmat"]')) {
      closeCurriculumDialog();
      selectAuthorTitles(PRIMMAT_AUTHOR_TITLES);
    }
    if (target.closest('[data-action="cermat"]')) {
      closeCurriculumDialog();
      selectAuthorTitles(CERMAT_OVERVIEW);
    }
    if (target.closest('[data-action="authors"]')) {
      closeCurriculumDialog();
      openAuthorPicker();
    }
  });

  document.body.appendChild(backdrop);
}

function installSidebarEntry() {
  const sidebar = document.querySelector<HTMLElement>(".sidebar-scroll");
  const authorButton = sidebar?.querySelector<HTMLElement>(".author-picker-button");
  if (!sidebar || !authorButton || sidebar.querySelector(".curriculum-open-button")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "curriculum-open-button";
  button.innerHTML = `
    <span class="curriculum-icon">M</span>
    <span><strong>Maturitní literatura</strong><small>PrimMat 60 děl · CERMAT</small></span>
    <b>${AUTHORS.length}+</b>
  `;
  button.addEventListener("click", openCurriculumDialog);
  authorButton.insertAdjacentElement("afterend", button);
}

export function installCurriculumUi() {
  if (document.documentElement.dataset.curriculumUi === "true") return;
  document.documentElement.dataset.curriculumUi = "true";

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      installSidebarEntry();
      addAuthorDialogPresets();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCurriculumDialog();
  });
  schedule();
}
