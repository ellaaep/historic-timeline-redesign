import {
  AUTHORS,
  DEFAULT_AUTHOR_IDS,
  WORKS,
  type TimelineItem,
} from "./data";

const AUTHOR_STORAGE = "casovrstvy-redesign-authors-v2";
const CUSTOM_STORAGE = "casovrstvy-redesign-custom-v2";
const ALLOWED_WORKS_STORAGE = "casovrstvy-personal-work-titles-v1";
const LIST_META_STORAGE = "casovrstvy-personal-list-meta-v1";
const LAYER_MODE_STORAGE = "casovrstvy-personal-layer-mode-v1";
const SCROLL_AFTER_RELOAD = "casovrstvy-scroll-after-personalization-v1";
const CURRENT_YEAR = 2026;

interface ParsedEntry {
  author: string;
  title: string;
  year?: number;
  sourceLine: string;
  knownAuthorId?: string;
  knownWorkId?: string;
}

interface ResolvedEntry {
  authorId: string;
  authorTitle: string;
  workId: string;
  workTitle: string;
  year: number;
  customAuthor?: TimelineItem;
  customWork?: TimelineItem;
  sourceLine: string;
}

interface ImportResult {
  name: string;
  entries: ResolvedEntry[];
  skipped: string[];
  parsedCount: number;
}

interface CustomData {
  authors: TimelineItem[];
  works: TimelineItem[];
}

interface ListMeta {
  name: string;
  works: number;
  authors: number;
  importedAt: string;
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slug = (value: string) => normalize(value).replace(/\s+/g, "-").slice(0, 72) || "polozka";

const formatYear = (year: number) =>
  year < 0 ? `${Math.abs(Math.round(year)).toLocaleString("cs-CZ")} př. n. l.` : String(Math.round(year));

function readJson<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function claimYear(entity: Record<string, any> | undefined, property: string) {
  const value = entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time;
  if (!value) return null;
  const match = String(value).match(/^([+-]\d+)/);
  return match ? Number(match[1]) : null;
}

function uniqueBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const id = key(value);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function findAuthorById(id: string | undefined) {
  if (!id) return undefined;
  return AUTHORS.find((author) => author.id === id);
}

function findKnownAuthor(name: string) {
  const target = normalize(name);
  if (!target) return undefined;
  return AUTHORS.find((author) => {
    const candidate = normalize(author.title);
    return candidate === target || candidate.replace(/ova$/, "") === target.replace(/ova$/, "");
  });
}

function findKnownWork(title: string, authorName?: string) {
  const target = normalize(title);
  if (!target) return undefined;
  const authorTarget = normalize(authorName || "");
  return WORKS.find((work) => {
    if (normalize(work.title) !== target) return false;
    if (!authorTarget) return true;
    const author = findAuthorById(work.authorId);
    return author ? normalize(author.title) === authorTarget : true;
  });
}

function stripLineNumber(value: string) {
  return value
    .replace(/^\s*(?:\d{1,3}[.)]|[•●▪–—-])\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldIgnoreLine(value: string) {
  const line = normalize(value);
  if (!line || line.length < 4) return true;
  return [
    "skolni seznam",
    "literarnich del",
    "maturitni zkous",
    "svetova a ceska literatura",
    "ceska literatura 20",
    "kriteria pro vyber",
    "zak vybira",
    "minimalne dvema",
    "seznam zaka",
    "vedouci predmetove",
    "ceskoslovenske armady",
    "bankovni spojeni",
    "telefon",
    "email",
    "www",
    "strana",
    "page",
  ].some((phrase) => line.includes(phrase));
}

function findKnownPairInLine(rawLine: string): ParsedEntry | null {
  const line = stripLineNumber(rawLine);
  const normalizedLine = normalize(line);
  if (!normalizedLine) return null;

  const works = [...WORKS].sort((a, b) => normalize(b.title).length - normalize(a.title).length);
  for (const work of works) {
    const workName = normalize(work.title);
    if (workName.length < 3 || !normalizedLine.includes(workName)) continue;
    const author = findAuthorById(work.authorId);
    if (!author) continue;
    const authorName = normalize(author.title);
    if (!normalizedLine.includes(authorName)) continue;
    return {
      author: author.title,
      title: work.title,
      year: work.start,
      sourceLine: rawLine,
      knownAuthorId: author.id,
      knownWorkId: work.id,
    };
  }

  return null;
}

function parseSeparatedLine(rawLine: string): ParsedEntry | null {
  const line = stripLineNumber(rawLine);
  const yearMatch = line.match(/(?:^|[\s(|,;])(-?\d{3,4})(?:\s*(?:n\.?\s*l\.?|př\.?\s*n\.?\s*l\.?)?)?(?:$|[\s)|,;])/i);
  const year = yearMatch ? Number(yearMatch[1]) : undefined;
  const withoutTrailingYear = line.replace(/(?:[\s(|,;]+)-?\d{3,4}(?:\s*(?:n\.?\s*l\.?|př\.?\s*n\.?\s*l\.?)?)?\)?\s*$/i, "").trim();
  const chunks = withoutTrailingYear
    .split(/\t+|\s*;\s*|\s*\|\s*|\s+[–—]\s+|\s+-\s+|:\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length >= 2) {
    return {
      author: chunks[0],
      title: chunks.slice(1).join(" – "),
      year,
      sourceLine: rawLine,
    };
  }

  const sortedAuthors = [...AUTHORS].sort((a, b) => b.title.length - a.title.length);
  const lower = withoutTrailingYear.toLocaleLowerCase("cs");
  for (const author of sortedAuthors) {
    const candidate = author.title.toLocaleLowerCase("cs");
    const index = lower.indexOf(candidate);
    if (index < 0) continue;
    const title = withoutTrailingYear.slice(index + author.title.length).replace(/^\s*[-–—:|;]?\s*/, "").trim();
    if (!title) continue;
    return {
      author: author.title,
      title,
      year,
      sourceLine: rawLine,
      knownAuthorId: author.id,
    };
  }

  return null;
}

function parseJsonEntries(value: unknown): ParsedEntry[] {
  const root = value as Record<string, unknown>;
  const rows = Array.isArray(value)
    ? value
    : Array.isArray(root?.items)
      ? root.items
      : Array.isArray(root?.works)
        ? root.works
        : Array.isArray(root?.books)
          ? root.books
          : [];

  return rows
    .map((row): ParsedEntry | null => {
      if (typeof row === "string") return findKnownPairInLine(row) || parseSeparatedLine(row);
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const author = String(item.author || item.autor || item.spisovatel || "").trim();
      const title = String(item.title || item.dilo || item.dílo || item.book || item.kniha || item.work || "").trim();
      const rawYear = item.year || item.rok || item.published || item.vydano;
      const year = rawYear === undefined || rawYear === null || rawYear === "" ? undefined : Number(rawYear);
      if (!author || !title) return null;
      return {
        author,
        title,
        year: Number.isFinite(year) ? year : undefined,
        sourceLine: `${author} | ${title}${Number.isFinite(year) ? ` | ${year}` : ""}`,
      };
    })
    .filter((entry): entry is ParsedEntry => Boolean(entry));
}

function parseText(text: string): ParsedEntry[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const entries = parseJsonEntries(JSON.parse(trimmed));
      if (entries.length) return uniqueBy(entries, (entry) => `${normalize(entry.author)}|${normalize(entry.title)}`);
    } catch {
      // Continue with line parsing.
    }
  }

  const entries: ParsedEntry[] = [];
  trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !shouldIgnoreLine(line))
    .forEach((line) => {
      const entry = findKnownPairInLine(line) || parseSeparatedLine(line);
      if (entry?.author && entry.title) entries.push(entry);
    });

  return uniqueBy(entries, (entry) => `${normalize(entry.author)}|${normalize(entry.title)}`);
}

async function loadScript(url: string, globalName: string) {
  if ((window as any)[globalName]) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-personalization-lib="${globalName}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Knihovnu se nepodařilo načíst.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.dataset.personalizationLib = globalName;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Knihovnu se nepodařilo načíst.")), { once: true });
    document.head.appendChild(script);
  });
}

async function extractPdf(file: File) {
  const moduleUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
  const workerUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  const pdfjs: any = await import(/* @vite-ignore */ moduleUrl);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = new Map<number, any[]>();
    for (const item of content.items as any[]) {
      if (!item?.str?.trim()) continue;
      const y = Math.round((item.transform?.[5] || 0) / 3) * 3;
      const row = rows.get(y) || [];
      row.push(item);
      rows.set(y, row);
    }

    const pageLines = [...rows.entries()]
      .sort(([first], [second]) => second - first)
      .map(([, items]) => {
        const sorted = items.sort((a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0));
        let previousRight = 0;
        return sorted
          .map((item, index) => {
            const x = item.transform?.[4] || 0;
            const gap = index ? x - previousRight : 0;
            previousRight = x + (item.width || String(item.str).length * 5);
            return `${gap > 26 ? "\t" : index ? " " : ""}${item.str}`;
          })
          .join("")
          .trim();
      })
      .filter(Boolean);
    pages.push(pageLines.join("\n"));
  }

  return pages.join("\n");
}

async function extractDocx(file: File) {
  await loadScript(
    "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js",
    "mammoth",
  );
  const mammoth = (window as any).mammoth;
  if (!mammoth?.extractRawText) throw new Error("Čtení DOCX není v tomto prohlížeči dostupné.");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return String(result?.value || "");
}

async function extractFileText(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf" || file.type === "application/pdf") return extractPdf(file);
  if (extension === "docx" || file.type.includes("wordprocessingml")) return extractDocx(file);
  if (["txt", "csv", "json", "md", "tsv"].includes(extension || "") || file.type.startsWith("text/")) {
    return file.text();
  }
  throw new Error("Podporované formáty jsou PDF, DOCX, TXT, CSV, TSV, Markdown a JSON.");
}

async function searchWikipedia(query: string) {
  const url = new URL("https://cs.wikipedia.org/w/api.php");
  Object.entries({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "0",
    gsrlimit: "3",
    prop: "pageprops|info",
    inprop: "url",
    format: "json",
    formatversion: "2",
    origin: "*",
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  if (!response.ok) return null;
  const pages = (await response.json()).query?.pages || [];
  return pages.find((page: any) => page.pageprops?.wikibase_item) || pages[0] || null;
}

async function fetchEntity(qid: string) {
  const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  if (!response.ok) return null;
  return (await response.json()).entities?.[qid] || null;
}

const authorLookupCache = new Map<string, TimelineItem | null>();
const workYearCache = new Map<string, number | null>();

async function resolveUnknownAuthor(name: string) {
  const key = normalize(name);
  if (authorLookupCache.has(key)) return authorLookupCache.get(key) || null;
  try {
    const page = await searchWikipedia(`${name} spisovatel`);
    const qid = page?.pageprops?.wikibase_item;
    if (!page || !qid) throw new Error("Nenalezeno");
    const entity = await fetchEntity(qid);
    const birth = claimYear(entity, "P569");
    const death = claimYear(entity, "P570");
    if (!birth) throw new Error("Chybí rok narození");
    const title = page.title || name;
    const item: TimelineItem = {
      id: `upload-author-${slug(title)}`,
      title,
      start: birth,
      end: death || CURRENT_YEAR,
      living: !death,
      lane: "authors",
      kind: "author",
      importance: 5,
      wikiTitle: title,
      summary: "Autor automaticky rozpoznaný z nahraného seznamu a ověřený pomocí Wikipedie a Wikidat.",
    };
    authorLookupCache.set(key, item);
    return item;
  } catch {
    authorLookupCache.set(key, null);
    return null;
  }
}

async function resolveUnknownWorkYear(title: string, author: string) {
  const key = `${normalize(author)}|${normalize(title)}`;
  if (workYearCache.has(key)) return workYearCache.get(key) || null;
  try {
    const page = await searchWikipedia(`"${title}" ${author} kniha`);
    const qid = page?.pageprops?.wikibase_item;
    if (!qid) throw new Error("Nenalezeno");
    const entity = await fetchEntity(qid);
    const year = claimYear(entity, "P577");
    workYearCache.set(key, year);
    return year;
  } catch {
    workYearCache.set(key, null);
    return null;
  }
}

async function resolveEntries(
  parsed: ParsedEntry[],
  name: string,
  progress: (message: string) => void,
): Promise<ImportResult> {
  const resolved: ResolvedEntry[] = [];
  const skipped: string[] = [];

  for (let index = 0; index < parsed.length; index += 1) {
    const entry = parsed[index];
    progress(`Rozpoznávám položku ${index + 1} z ${parsed.length}: ${entry.author} — ${entry.title}`);

    const knownWork = entry.knownWorkId
      ? WORKS.find((work) => work.id === entry.knownWorkId)
      : findKnownWork(entry.title, entry.author) || findKnownWork(entry.title);
    if (knownWork) {
      const knownAuthor = findAuthorById(knownWork.authorId) || findKnownAuthor(entry.author);
      if (!knownAuthor) {
        skipped.push(`${entry.sourceLine} — autor nebyl nalezen`);
        continue;
      }
      resolved.push({
        authorId: knownAuthor.id,
        authorTitle: knownAuthor.title,
        workId: knownWork.id,
        workTitle: knownWork.title,
        year: knownWork.start,
        sourceLine: entry.sourceLine,
      });
      continue;
    }

    const knownAuthor = entry.knownAuthorId
      ? AUTHORS.find((author) => author.id === entry.knownAuthorId)
      : findKnownAuthor(entry.author);
    const customAuthor = knownAuthor ? undefined : await resolveUnknownAuthor(entry.author);
    const author = knownAuthor || customAuthor;
    if (!author) {
      skipped.push(`${entry.sourceLine} — autora se nepodařilo ověřit`);
      continue;
    }

    const year = entry.year ?? await resolveUnknownWorkYear(entry.title, author.title);
    if (!year || !Number.isFinite(year)) {
      skipped.push(`${entry.sourceLine} — chybí rok vydání; doplň ho ve formátu Autor | Dílo | Rok`);
      continue;
    }

    const workId = `upload-work-${slug(author.title)}-${slug(entry.title)}`;
    const customWork: TimelineItem = {
      id: workId,
      authorId: author.id,
      title: entry.title,
      start: year,
      end: year,
      lane: "works",
      kind: "work",
      importance: 4,
      wikiTitle: entry.title,
      summary: `Dílo načtené z vlastního seznamu. Autor: ${author.title}.`,
    };

    resolved.push({
      authorId: author.id,
      authorTitle: author.title,
      workId,
      workTitle: entry.title,
      year,
      customAuthor,
      customWork,
      sourceLine: entry.sourceLine,
    });
  }

  return {
    name,
    entries: uniqueBy(resolved, (entry) => `${entry.authorId}|${normalize(entry.workTitle)}`),
    skipped,
    parsedCount: parsed.length,
  };
}

function closePersonalizationDialog() {
  document.querySelector(".personalization-backdrop")?.remove();
}

let activeResult: ImportResult | null = null;

function setStatus(dialog: HTMLElement, message: string, state: "working" | "success" | "error" = "working") {
  const status = dialog.querySelector<HTMLElement>(".personalization-status");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function renderImportResult(dialog: HTMLElement, result: ImportResult) {
  activeResult = result;
  const preview = dialog.querySelector<HTMLElement>(".personalization-preview");
  const applyButton = dialog.querySelector<HTMLButtonElement>('[data-personal-action="apply"]');
  if (!preview || !applyButton) return;
  preview.replaceChildren();

  const summary = document.createElement("div");
  summary.className = "personalization-result-summary";
  summary.innerHTML = `
    <span><b>${result.entries.length}</b> rozpoznaných děl</span>
    <span><b>${new Set(result.entries.map((entry) => entry.authorId)).size}</b> autorů</span>
    <span><b>${result.skipped.length}</b> položek ke kontrole</span>
  `;
  preview.appendChild(summary);

  const list = document.createElement("div");
  list.className = "personalization-result-list";
  result.entries.slice(0, 80).forEach((entry) => {
    const row = document.createElement("div");
    row.className = "personalization-result-row";
    const copy = document.createElement("span");
    const author = document.createElement("strong");
    const work = document.createElement("small");
    author.textContent = entry.authorTitle;
    work.textContent = entry.workTitle;
    copy.append(author, work);
    const year = document.createElement("b");
    year.textContent = formatYear(entry.year);
    row.append(copy, year);
    list.appendChild(row);
  });
  preview.appendChild(list);

  if (result.entries.length > 80) {
    const more = document.createElement("p");
    more.className = "personalization-more";
    more.textContent = `A dalších ${result.entries.length - 80} položek.`;
    preview.appendChild(more);
  }

  if (result.skipped.length) {
    const details = document.createElement("details");
    const summaryElement = document.createElement("summary");
    summaryElement.textContent = `Položky ke kontrole (${result.skipped.length})`;
    const skippedList = document.createElement("ul");
    result.skipped.slice(0, 30).forEach((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      skippedList.appendChild(item);
    });
    details.append(summaryElement, skippedList);
    preview.appendChild(details);
  }

  applyButton.disabled = result.entries.length === 0;
  setStatus(
    dialog,
    result.entries.length
      ? `Hotovo. Rozpoznáno ${result.entries.length} děl z ${result.parsedCount} nalezených řádků.`
      : "V souboru se nepodařilo rozpoznat žádné dílo. Zkus formát Autor | Dílo | Rok.",
    result.entries.length ? "success" : "error",
  );
}

async function analyzeText(dialog: HTMLElement, text: string, name: string) {
  activeResult = null;
  const applyButton = dialog.querySelector<HTMLButtonElement>('[data-personal-action="apply"]');
  if (applyButton) applyButton.disabled = true;
  const preview = dialog.querySelector<HTMLElement>(".personalization-preview");
  preview?.replaceChildren();

  const parsed = parseText(text);
  if (!parsed.length) {
    setStatus(dialog, "Nenašla jsem dvojice autor–dílo. Použij jeden řádek na dílo: Autor | Dílo | Rok.", "error");
    return;
  }

  setStatus(dialog, `Nalezeno ${parsed.length} řádků. Porovnávám je s katalogem a veřejnými databázemi…`);
  const result = await resolveEntries(parsed, name, (message) => setStatus(dialog, message));
  renderImportResult(dialog, result);
}

async function analyzeFile(dialog: HTMLElement, file: File) {
  try {
    setStatus(dialog, `Čtu soubor ${file.name}…`);
    const text = await extractFileText(file);
    await analyzeText(dialog, text, file.name.replace(/\.[^.]+$/, ""));
  } catch (error) {
    setStatus(dialog, error instanceof Error ? error.message : "Soubor se nepodařilo zpracovat.", "error");
  }
}

function mergeItems(current: TimelineItem[], additions: TimelineItem[]) {
  const additionsById = new Map(additions.map((item) => [item.id, item]));
  return [
    ...current.filter((item) => !additionsById.has(item.id) && !item.id.startsWith("upload-")),
    ...additions,
  ];
}

function applyImport(dialog: HTMLElement) {
  if (!activeResult?.entries.length) return;
  const exactWorks = dialog.querySelector<HTMLInputElement>('[name="exact-works"]')?.checked ?? true;
  const keepContext = dialog.querySelector<HTMLInputElement>('[name="keep-context"]')?.checked ?? true;
  const current = readJson<CustomData>(CUSTOM_STORAGE, { authors: [], works: [] });
  const customAuthors = uniqueBy(
    activeResult.entries.map((entry) => entry.customAuthor).filter((item): item is TimelineItem => Boolean(item)),
    (item) => item.id,
  );
  const customWorks = uniqueBy(
    activeResult.entries.map((entry) => entry.customWork).filter((item): item is TimelineItem => Boolean(item)),
    (item) => item.id,
  );
  const authorIds = [...new Set(activeResult.entries.map((entry) => entry.authorId))];
  const workTitles = [...new Set(activeResult.entries.map((entry) => normalize(entry.workTitle)))];
  const metadata: ListMeta = {
    name: activeResult.name || "Vlastní seznam",
    works: activeResult.entries.length,
    authors: authorIds.length,
    importedAt: new Date().toISOString(),
  };

  localStorage.setItem(
    CUSTOM_STORAGE,
    JSON.stringify({
      authors: mergeItems(current.authors || [], customAuthors),
      works: mergeItems(current.works || [], customWorks),
    }),
  );
  localStorage.setItem(AUTHOR_STORAGE, JSON.stringify(authorIds));
  localStorage.setItem(LIST_META_STORAGE, JSON.stringify(metadata));
  if (exactWorks) localStorage.setItem(ALLOWED_WORKS_STORAGE, JSON.stringify(workTitles));
  else localStorage.removeItem(ALLOWED_WORKS_STORAGE);
  if (keepContext) localStorage.removeItem(LAYER_MODE_STORAGE);
  else localStorage.setItem(LAYER_MODE_STORAGE, "literature-only");
  localStorage.setItem(SCROLL_AFTER_RELOAD, "1");
  window.location.reload();
}

function resetPersonalization(scrollToTimeline = false) {
  const current = readJson<CustomData>(CUSTOM_STORAGE, { authors: [], works: [] });
  localStorage.setItem(
    CUSTOM_STORAGE,
    JSON.stringify({
      authors: (current.authors || []).filter((item) => !item.id.startsWith("upload-")),
      works: (current.works || []).filter((item) => !item.id.startsWith("upload-")),
    }),
  );
  localStorage.setItem(AUTHOR_STORAGE, JSON.stringify(DEFAULT_AUTHOR_IDS));
  localStorage.removeItem(ALLOWED_WORKS_STORAGE);
  localStorage.removeItem(LIST_META_STORAGE);
  localStorage.removeItem(LAYER_MODE_STORAGE);
  if (scrollToTimeline) localStorage.setItem(SCROLL_AFTER_RELOAD, "1");
  window.location.reload();
}

function openPersonalizationDialog() {
  closePersonalizationDialog();
  activeResult = null;
  const host = (document.fullscreenElement as HTMLElement | null) || document.body;
  const backdrop = document.createElement("div");
  backdrop.className = "personalization-backdrop";
  backdrop.innerHTML = `
    <section class="personalization-dialog" role="dialog" aria-modal="true" aria-label="Personalizovat časovou osu">
      <header>
        <div>
          <span>Vlastní studijní osa</span>
          <h2>Nahraj svůj seznam děl</h2>
          <p>Aplikace soubor přečte, rozpozná autory a názvy knih, doplní známé roky z katalogu nebo Wikidat a připraví přesně tvůj výběr.</p>
        </div>
        <button type="button" class="personalization-close" aria-label="Zavřít">×</button>
      </header>

      <div class="personalization-methods">
        <label class="personalization-dropzone">
          <input type="file" accept=".pdf,.docx,.txt,.csv,.tsv,.json,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/json">
          <span class="personalization-upload-icon">↑</span>
          <strong>Nahrát vlastní soubor</strong>
          <small>PDF, DOCX, TXT, CSV, TSV, Markdown nebo JSON</small>
          <b>Vybrat soubor</b>
        </label>

        <div class="personalization-paste">
          <strong>Nebo seznam vlož jako text</strong>
          <textarea placeholder="William Shakespeare | Romeo a Julie | 1597\nKarel Čapek | R.U.R. | 1920\nFranz Kafka | Proměna | 1915"></textarea>
          <button type="button" data-personal-action="analyze-text">Analyzovat vložený seznam</button>
        </div>
      </div>

      <div class="personalization-format-note">
        <strong>Nejspolehlivější formát:</strong>
        <code>Autor | Dílo | Rok</code>
        <span>U známých knih rok uvádět nemusíš. PDF tabulky ze školních seznamů aplikace zkusí rozpoznat automaticky.</span>
      </div>

      <div class="personalization-options">
        <label><input type="checkbox" name="exact-works" checked> Zobrazit jen díla uvedená v souboru</label>
        <label><input type="checkbox" name="keep-context" checked> Ponechat dějiny, vědu, stavby a další kontext</label>
      </div>

      <div class="personalization-status" data-state="idle">Vyber soubor nebo vlož seznam. Soubor se zpracovává přímo v prohlížeči.</div>
      <div class="personalization-preview"></div>

      <footer>
        <p><strong>Soukromí:</strong> samotný soubor se neukládá na server. Pro neznámé položky se odesílá pouze jméno autora nebo název díla do veřejného vyhledávání Wikipedie a Wikidat.</p>
        <div>
          <button type="button" class="secondary" data-personal-action="reset">Vrátit základní katalog</button>
          <button type="button" data-personal-action="apply" disabled>Použít na časové ose</button>
        </div>
      </footer>
    </section>
  `;

  const fileInput = backdrop.querySelector<HTMLInputElement>('input[type="file"]');
  const textarea = backdrop.querySelector<HTMLTextAreaElement>("textarea");
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) void analyzeFile(backdrop, file);
  });

  const dropzone = backdrop.querySelector<HTMLElement>(".personalization-dropzone");
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
    });
  });
  dropzone?.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) void analyzeFile(backdrop, file);
  });

  backdrop.addEventListener("click", (event) => {
    const target = event.target as Element;
    if (target === backdrop || target.closest(".personalization-close")) closePersonalizationDialog();
    if (target.closest('[data-personal-action="analyze-text"]')) {
      const value = textarea?.value.trim() || "";
      if (!value) setStatus(backdrop, "Nejdřív vlož seznam do textového pole.", "error");
      else void analyzeText(backdrop, value, "Vložený seznam");
    }
    if (target.closest('[data-personal-action="apply"]')) applyImport(backdrop);
    if (target.closest('[data-personal-action="reset"]')) resetPersonalization(true);
  });

  host.appendChild(backdrop);
}

function activeMeta() {
  return readJson<ListMeta | null>(LIST_META_STORAGE, null);
}

function installLandingSection() {
  const landingMain = document.querySelector<HTMLElement>(".landing-main");
  const teacherSection = landingMain?.querySelector<HTMLElement>(".teacher-section");
  if (!landingMain || !teacherSection || landingMain.querySelector(".personalization-section")) return;
  const meta = activeMeta();
  const section = document.createElement("section");
  section.id = "personalize";
  section.className = "personalization-section";
  section.innerHTML = `
    <div class="personalization-heading">
      <span>TVŮJ OBSAH, TVOJE OSA</span>
      <h2>Začni základním přehledem, nebo si vytvoř vlastní.</h2>
      <p>Výchozí katalog je připravený pro veřejné použití. Student i učitel si ho ale může během chvíle přizpůsobit vlastnímu školnímu seznamu nebo četbě.</p>
    </div>
    <div class="personalization-choice-grid">
      <article class="basic-choice">
        <span>01</span>
        <h3>Základní literární přehled</h3>
        <p>Více než sto autorů, známá díla, literární směry a historický kontext. Není navázaný na žádnou konkrétní školu.</p>
        <button type="button" data-landing-action="basic">Použít základní katalog</button>
      </article>
      <article class="custom-choice">
        <span>02</span>
        <h3>Personalizovat podle souboru</h3>
        <p>Nahraj vlastní PDF, DOCX, tabulku nebo textový seznam. Aplikace rozpozná položky a sestaví z nich tvoji časovou osu.</p>
        <button type="button" data-landing-action="upload">Nahrát vlastní seznam</button>
        <small>Soubor zůstává v prohlížeči.</small>
      </article>
    </div>
    ${meta ? `<div class="personalization-active"><span>Aktivní vlastní seznam</span><strong></strong><small>${meta.authors} autorů · ${meta.works} děl</small><button type="button" data-landing-action="reset">Zrušit personalizaci</button></div>` : ""}
  `;
  const activeName = section.querySelector<HTMLElement>(".personalization-active strong");
  if (activeName && meta) activeName.textContent = meta.name;
  section.addEventListener("click", (event) => {
    const action = (event.target as Element).closest<HTMLElement>("[data-landing-action]")?.dataset.landingAction;
    if (action === "upload") openPersonalizationDialog();
    if (action === "basic" || action === "reset") resetPersonalization(true);
  });
  teacherSection.insertAdjacentElement("beforebegin", section);
}

function installNavigationLink() {
  const links = document.querySelector<HTMLElement>(".landing-nav-links");
  if (!links || links.querySelector('a[href="#personalize"]')) return;
  const link = document.createElement("a");
  link.href = "#personalize";
  link.textContent = "Personalizace";
  const timelineLink = links.querySelector('a[href="#timeline"]');
  links.insertBefore(link, timelineLink || links.firstChild);
}

function installSidebarButton() {
  const sidebar = document.querySelector<HTMLElement>(".sidebar-scroll");
  const curriculum = sidebar?.querySelector<HTMLElement>(".curriculum-open-button");
  const authorButton = sidebar?.querySelector<HTMLElement>(".author-picker-button");
  if (!sidebar || sidebar.querySelector(".personalization-open-button")) return;
  const meta = activeMeta();
  const button = document.createElement("button");
  button.type = "button";
  button.className = "personalization-open-button";
  button.innerHTML = `
    <span class="personalization-sidebar-icon">+</span>
    <span><strong>Personalizovat osu</strong><small></small></span>
    ${meta ? `<b>${meta.works}</b>` : ""}
  `;
  const small = button.querySelector("small");
  if (small) small.textContent = meta ? meta.name : "nahrát vlastní seznam";
  button.addEventListener("click", openPersonalizationDialog);
  (curriculum || authorButton)?.insertAdjacentElement("afterend", button);
}

function filterUploadedWorks() {
  const raw = localStorage.getItem(ALLOWED_WORKS_STORAGE);
  const cards = document.querySelectorAll<HTMLElement>(".timeline-card.kind-work");
  if (!raw) {
    cards.forEach((card) => {
      if (card.dataset.personalizationHidden === "true") card.style.removeProperty("display");
      delete card.dataset.personalizationHidden;
    });
    return;
  }
  const allowed = new Set(readJson<string[]>(ALLOWED_WORKS_STORAGE, []));
  cards.forEach((card) => {
    const title = card.querySelector(".card-copy strong")?.textContent || card.getAttribute("title")?.split(" · ")[0] || "";
    const visible = allowed.has(normalize(title));
    card.style.display = visible ? "" : "none";
    card.dataset.personalizationHidden = visible ? "false" : "true";
  });
}

function applySavedLayerMode() {
  if (localStorage.getItem(LAYER_MODE_STORAGE) !== "literature-only") return;
  const rows = [...document.querySelectorAll<HTMLButtonElement>(".filter-row")];
  if (rows.length < 8) return;
  rows.forEach((row, index) => {
    const wanted = index < 2;
    if (row.classList.contains("active") !== wanted) row.click();
  });
  localStorage.removeItem(LAYER_MODE_STORAGE);
}

function handleScrollAfterReload() {
  if (localStorage.getItem(SCROLL_AFTER_RELOAD) !== "1") return;
  const timeline = document.querySelector<HTMLElement>("#timeline");
  if (!timeline) return;
  localStorage.removeItem(SCROLL_AFTER_RELOAD);
  window.setTimeout(() => timeline.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
}

function refreshPersonalizationUi() {
  installLandingSection();
  installNavigationLink();
  installSidebarButton();
  filterUploadedWorks();
  applySavedLayerMode();
  handleScrollAfterReload();
}

export function installPersonalization() {
  if (document.documentElement.dataset.personalization === "true") return;
  document.documentElement.dataset.personalization = "true";
  window.addEventListener("casovrstvy:open-personalization", openPersonalizationDialog);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePersonalizationDialog();
  });

  let scheduled = false;
  const schedule = (delay = 0) => {
    window.setTimeout(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        refreshPersonalizationUi();
      });
    }, delay);
  };
  const observer = new MutationObserver(() => schedule());
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", () => {
    schedule(0);
    schedule(100);
  }, true);
  schedule();
}
