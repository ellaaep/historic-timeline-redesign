import { AUTHORS } from "./data";
import {
  CERMAT_GENRES,
  CERMAT_MOVEMENTS,
  PRIMMAT_AUTHOR_TITLES as SAMPLE_SCHOOL_AUTHOR_TITLES,
} from "./curriculum-catalog";

const LITERATURE_OVERVIEW = [
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

function openPersonalization() {
  window.dispatchEvent(new CustomEvent("casovrstvy:open-personalization"));
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

  const schoolList = document.createElement("button");
  schoolList.type = "button";
  schoolList.className = "curriculum-preset school-list";
  schoolList.textContent = "Ukázkový školní seznam";
  schoolList.title = "Vybrat autory z rozsáhlého ukázkového seznamu 60 děl";
  schoolList.addEventListener("click", () => selectAuthorTitles(SAMPLE_SCHOOL_AUTHOR_TITLES));

  const overview = document.createElement("button");
  overview.type = "button";
  overview.className = "curriculum-preset overview";
  overview.textContent = "Literární průřez";
  overview.title = "Vybrat reprezentativní autory napříč literární historií";
  overview.addEventListener("click", () => selectAuthorTitles(LITERATURE_OVERVIEW));

  const upload = document.createElement("button");
  upload.type = "button";
  upload.className = "curriculum-preset upload-list";
  upload.textContent = "Nahrát vlastní seznam";
  upload.title = "Vytvořit osu podle vlastního školního nebo čtenářského seznamu";
  upload.addEventListener("click", () => {
    dialog.closest(".dialog-backdrop")?.querySelector<HTMLButtonElement>(".dialog-close")?.click();
    openPersonalization();
  });

  actions.prepend(upload);
  actions.prepend(overview);
  actions.prepend(schoolList);

  const note = document.createElement("p");
  note.className = "curriculum-dialog-note";
  note.innerHTML =
    "<strong>Veřejný literární katalog.</strong> Obsahuje více školních a maturitních okruhů, literární směry, skupiny, žánry a přes sto autorů. Není vázaný na jedinou školu.";
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
    <section class="curriculum-dialog" role="dialog" aria-modal="true" aria-label="Literární díla a směry">
      <header>
        <div>
          <span>Literární přehled</span>
          <h2>Díla, autoři a směry</h2>
          <p>Veřejný katalog pro studenty a učitele. Můžeš použít základní výběr, maturitní průřez nebo si vytvořit vlastní osu nahráním svého seznamu.</p>
        </div>
        <button type="button" class="curriculum-close" aria-label="Zavřít">×</button>
      </header>

      <div class="curriculum-source-grid three-columns">
        <article>
          <strong>Základní katalog děl</strong>
          <p>Rozsáhlý výběr známých českých i světových děl od starověku po současnost.</p>
          <button type="button" data-action="school-list">Zobrazit ukázkový výběr</button>
        </article>
        <article>
          <strong>Maturitní literární průřez</strong>
          <p>Autoři a směry, o kterých má mít středoškolák základní povědomí v historických souvislostech.</p>
          <button type="button" data-action="overview">Zobrazit literární průřez</button>
        </article>
        <article class="personalized-source">
          <strong>Vlastní seznam</strong>
          <p>Nahraj PDF, DOCX, TXT, CSV nebo JSON a aplikace z něj sestaví vlastní autory a díla.</p>
          <button type="button" data-action="upload">Personalizovat časovou osu</button>
        </article>
      </div>

      <section class="curriculum-requirements">
        <h3>Obvyklá pravidla výběru 20 maturitních děl</h3>
        <div>
          <span><b>2+</b> do konce 18. století</span>
          <span><b>3+</b> literatura 19. století</span>
          <span><b>4+</b> světová literatura 20. a 21. století</span>
          <span><b>5+</b> česká literatura 20. a 21. století</span>
        </div>
        <p>Konkrétní pravidla se mohou lišit podle školy. Běžně se vyžaduje zastoupení prózy, poezie a dramatu a nejvýše dvě díla od jednoho autora.</p>
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
        <span>Obsah vychází z veřejných maturitních požadavků a ukázkových školních seznamů. Vlastní soubor se zpracovává v prohlížeči.</span>
        <div class="curriculum-footer-actions">
          <button type="button" data-action="upload">Nahrát vlastní seznam</button>
          <button type="button" data-action="authors">Ruční výběr autorů</button>
        </div>
      </footer>
    </section>
  `;

  backdrop.addEventListener("click", (event) => {
    const target = event.target as Element;
    if (target === backdrop || target.closest(".curriculum-close")) closeCurriculumDialog();
    if (target.closest('[data-action="school-list"]')) {
      closeCurriculumDialog();
      selectAuthorTitles(SAMPLE_SCHOOL_AUTHOR_TITLES);
    }
    if (target.closest('[data-action="overview"]')) {
      closeCurriculumDialog();
      selectAuthorTitles(LITERATURE_OVERVIEW);
    }
    if (target.closest('[data-action="upload"]')) {
      closeCurriculumDialog();
      openPersonalization();
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
    <span class="curriculum-icon">L</span>
    <span><strong>Literární díla a směry</strong><small>veřejný katalog · vlastní seznam</small></span>
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
