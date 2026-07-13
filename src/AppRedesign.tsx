import {
  ArrowDown,
  BookOpen,
  CalendarDays,
  Castle,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Crown,
  ExternalLink,
  FileText,
  Filter,
  FlaskConical,
  Globe2,
  GraduationCap,
  History,
  Landmark,
  Layers3,
  Lightbulb,
  LoaderCircle,
  Maximize2,
  Menu,
  Minus,
  Moon,
  MoveHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  AUTHORS,
  DEFAULT_AUTHOR_IDS,
  EVENTS,
  FIGURES,
  LANE_META,
  PERIODS,
  RULERS,
  WORKS,
  type LaneId,
  type Period,
  type TimelineItem,
} from "./data";
import { EXTRA_EVENTS, EXTRA_PERIODS } from "./enrichment";

const CURRENT_YEAR = 2026;
const MIN_YEAR = -12000;
const MAX_YEAR = CURRENT_YEAR;
const MIN_SPAN = 8;
const MAX_SPAN = 14000;
const AUTHOR_STORAGE = "casovrstvy-v3-authors";
const CUSTOM_STORAGE = "casovrstvy-v3-custom";
const THEME_STORAGE = "casovrstvy-v3-theme";
const EXACT_WORK_STORAGE = "casovrstvy-v3-exact-works";

type Density = "essentials" | "balanced" | "detailed";
type IconComponent = (props: { size?: number; strokeWidth?: number }) => ReactNode;

interface CustomData {
  authors: TimelineItem[];
  works: TimelineItem[];
}

interface ImportEntry {
  author: string;
  title: string;
  year?: number;
  authorItem?: TimelineItem;
  workItem?: TimelineItem;
  status: "known" | "resolved" | "missing";
  message?: string;
}

const LANE_ORDER: LaneId[] = [
  "authors",
  "works",
  "rulers",
  "czech",
  "world",
  "tech",
  "monuments",
  "figures",
];

const LANE_ICONS: Record<LaneId, IconComponent> = {
  authors: UserRound,
  works: BookOpen,
  rulers: Crown,
  czech: Landmark,
  world: Globe2,
  tech: Lightbulb,
  monuments: Castle,
  figures: CircleUserRound,
};

const LANE_TONES: Record<LaneId, { soft: string; strong: string }> = {
  authors: { soft: "#f0e5ff", strong: "#7d4bc7" },
  works: { soft: "#dcf7ee", strong: "#23856c" },
  rulers: { soft: "#fff0c8", strong: "#a97818" },
  czech: { soft: "#dfeeff", strong: "#3f75a9" },
  world: { soft: "#ffe2df", strong: "#b44e4a" },
  tech: { soft: "#fff0db", strong: "#cc7a2d" },
  monuments: { soft: "#efe4d5", strong: "#87603d" },
  figures: { soft: "#dff3f1", strong: "#267e75" },
};

const DENSITY_MIN_IMPORTANCE: Record<Density, number> = {
  essentials: 5,
  balanced: 4,
  detailed: 2,
};

const DENSITY_COPY: Record<Density, { title: string; text: string }> = {
  essentials: { title: "Základy", text: "Jen klíčová jména a mezníky" },
  balanced: { title: "Vyváženě", text: "Nejlepší poměr přehledu a detailu" },
  detailed: { title: "Podrobně", text: "Maximum dostupných souvislostí" },
};

const PRESETS = [
  { label: "Starověk", start: -800, end: 500 },
  { label: "Středověk", start: 900, end: 1500 },
  { label: "Renesance", start: 1400, end: 1650 },
  { label: "19. století", start: 1780, end: 1900 },
  { label: "První republika", start: 1914, end: 1939 },
  { label: "20. století", start: 1900, end: 2000 },
  { label: "Přehled 1000–2026", start: 1000, end: 2026 },
];

const HERO_NODES = [
  { id: "kafka", title: "Franz Kafka", subtitle: "1883–1924", wiki: "Franz Kafka", x: 18, y: 18, type: "author" },
  { id: "promena", title: "Proměna", subtitle: "1915", wiki: "Proměna (povídka)", x: 8, y: 62, type: "work" },
  { id: "czechoslovakia", title: "Vznik Československa", subtitle: "1918", wiki: "Vznik Československa", x: 43, y: 48, type: "event" },
  { id: "capek", title: "Karel Čapek", subtitle: "1890–1938", wiki: "Karel Čapek", x: 72, y: 61, type: "author" },
  { id: "rur", title: "R.U.R.", subtitle: "1920", wiki: "R.U.R.", x: 78, y: 16, type: "work" },
] as const;

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const formatYear = (year: number) =>
  year < 0 ? `${Math.abs(Math.round(year)).toLocaleString("cs-CZ")} př. n. l.` : String(Math.round(year));

const formatRange = (item: TimelineItem) => {
  if (item.living) return `${formatYear(item.start)}–dnes`;
  if (Math.round(item.start) === Math.round(item.end)) return formatYear(item.start);
  return `${formatYear(item.start)}–${formatYear(item.end)}`;
};

const hash = (value: string) => {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) result = (result * 31 + value.charCodeAt(index)) >>> 0;
  return result;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const clampRange = (start: number, end: number) => {
  let nextStart = start;
  let nextEnd = end;
  const span = Math.max(MIN_SPAN, nextEnd - nextStart);
  if (nextStart < MIN_YEAR) {
    nextStart = MIN_YEAR;
    nextEnd = MIN_YEAR + span;
  }
  if (nextEnd > MAX_YEAR) {
    nextEnd = MAX_YEAR;
    nextStart = MAX_YEAR - span;
  }
  return [Math.max(MIN_YEAR, nextStart), Math.min(MAX_YEAR, nextEnd)] as const;
};

const spanToZoom = (span: number) => {
  const ratio = Math.log(Math.max(MIN_SPAN, span) / MIN_SPAN) / Math.log(MAX_SPAN / MIN_SPAN);
  return Math.round((1 - ratio) * 100);
};

const zoomToSpan = (zoom: number) => {
  const ratio = 1 - zoom / 100;
  return MIN_SPAN * Math.pow(MAX_SPAN / MIN_SPAN, ratio);
};

const itemIcon = (item: TimelineItem) => {
  if (item.kind === "work") return BookOpen;
  if (item.lane === "tech") return FlaskConical;
  if (item.lane === "monuments") return Castle;
  if (item.lane === "rulers") return Crown;
  if (item.lane === "world") return Globe2;
  if (item.lane === "czech") return Landmark;
  return History;
};

function useWikiImage(title: string | undefined, active = true) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (!title || !active) return;
    let cancelled = false;
    const cacheKey = `casovrstvy-image:${title}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setSource(cached);
      return;
    }

    const load = async () => {
      for (const language of ["cs", "en"] as const) {
        try {
          const response = await fetch(
            `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
          );
          if (!response.ok) continue;
          const data = await response.json();
          const image = data.thumbnail?.source || data.originalimage?.source;
          if (image) {
            sessionStorage.setItem(cacheKey, image);
            if (!cancelled) setSource(image);
            return;
          }
        } catch {
          // Try another language or use a fallback.
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [title, active]);

  return source;
}

function WikiPortrait({ title, className = "" }: { title: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const source = useWikiImage(title, active);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={`wiki-portrait ${className}`}>
      {source ? <img src={source} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <UserRound size={22} />}
    </span>
  );
}

function HeroPreview() {
  return (
    <div className="hero-graph" aria-label="Ukázka propojení autora, díla a historické události">
      <div className="hero-graph-period">Evropa · 1883–1938</div>
      <svg className="hero-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 24 30 C 22 44, 18 50, 16 66" />
        <path d="M 25 28 C 34 34, 40 40, 48 52" />
        <path d="M 76 66 C 69 61, 61 58, 50 54" />
        <path d="M 78 64 C 79 48, 82 36, 84 25" />
      </svg>
      {HERO_NODES.map((node) => (
        <article
          key={node.id}
          className={`hero-node hero-node-${node.type}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          {node.type === "author" ? (
            <WikiPortrait title={node.wiki} className="hero-cutout" />
          ) : node.type === "work" ? (
            <span className="hero-node-icon"><BookOpen size={24} /></span>
          ) : (
            <span className="hero-node-icon"><Landmark size={24} /></span>
          )}
          <strong>{node.title}</strong>
          <small>{node.subtitle}</small>
        </article>
      ))}
      <div className="hero-graph-note">autor → dílo → historický kontext</div>
    </div>
  );
}

function Modal({ children, onClose, className = "" }: { children: ReactNode; onClose: () => void; className?: string }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card ${className}`} role="dialog" aria-modal="true">
        {children}
      </section>
    </div>
  );
}

function AuthorPicker({
  authors,
  selected,
  onChange,
  onClose,
}: {
  authors: TimelineItem[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const filtered = useMemo(() => {
    const target = normalize(deferred);
    return authors
      .filter((author) => !target || normalize(author.title).includes(target))
      .sort((a, b) => a.start - b.start)
      .slice(0, 180);
  }, [authors, deferred]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const setPreset = (ids: string[]) => onChange(new Set(ids.filter((id) => authors.some((author) => author.id === id))));

  return (
    <Modal onClose={onClose} className="author-modal">
      <header className="modal-header">
        <div>
          <span>Literární vrstva</span>
          <h2>Vyber autory, které chceš vidět</h2>
          <p>Výběr zůstane uložený v tomto prohlížeči. Díla se zobrazí automaticky.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Zavřít"><X /></button>
      </header>
      <div className="author-toolbar">
        <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat autora…" /></label>
        <div className="author-presets">
          <button onClick={() => setPreset(["shakespeare", "komensky", "austen", "dostoevsky", "kafka", "capek", "orwell", "tolkien", "coelho", "mornstajnova"])}>Světový přehled</button>
          <button onClick={() => setPreset(DEFAULT_AUTHOR_IDS)}>Výchozí výběr</button>
          <button onClick={() => onChange(new Set(authors.map((author) => author.id)))}>Všichni</button>
          <button onClick={() => onChange(new Set())}>Vymazat</button>
        </div>
      </div>
      <div className="author-grid">
        {filtered.map((author) => {
          const active = selected.has(author.id);
          return (
            <button key={author.id} className={active ? "selected" : ""} onClick={() => toggle(author.id)}>
              <WikiPortrait title={author.wikiTitle} />
              <span><strong>{author.title}</strong><small>{formatRange(author)}</small></span>
              <i>{active ? <Check size={15} /> : <Plus size={15} />}</i>
            </button>
          );
        })}
      </div>
      <footer className="modal-footer">
        <span>{selected.size} vybraných autorů</span>
        <button className="primary-button" onClick={onClose}>Použít výběr</button>
      </footer>
    </Modal>
  );
}

async function extractFileText(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    const pdfjs: any = await import(/* @vite-ignore */ "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push((content.items as any[]).map((item) => item.str || "").join(" "));
    }
    return pages.join("\n");
  }
  if (extension === "docx") {
    const mammoth = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/+esm");
    const result = await (mammoth as any).extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return String(result.value || "");
  }
  return file.text();
}

const parseImportText = (text: string, authors: TimelineItem[], works: TimelineItem[]) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-–—•])\s*/, "").trim())
    .filter((line) => line.length > 3);
  const entries: ImportEntry[] = [];

  for (const line of lines) {
    const normalizedLine = normalize(line);
    let found = false;
    for (const work of works) {
      if (!normalizedLine.includes(normalize(work.title))) continue;
      const author = authors.find((candidate) => candidate.id === work.authorId);
      if (!author) continue;
      entries.push({ author: author.title, title: work.title, year: work.start, authorItem: author, workItem: work, status: "known" });
      found = true;
      break;
    }
    if (found) continue;

    const parts = line.split(/\s*[|;]\s*|\s+[–—-]\s+/).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const possibleYear = Number(parts[parts.length - 1]);
      const hasYear = Number.isFinite(possibleYear) && Math.abs(possibleYear) > 100;
      entries.push({
        author: parts[0],
        title: parts.slice(1, hasYear ? -1 : undefined).join(" – "),
        year: hasYear ? possibleYear : undefined,
        status: "missing",
      });
    }
  }

  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${normalize(entry.author)}|${normalize(entry.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

async function resolveUnknownEntry(entry: ImportEntry): Promise<ImportEntry> {
  if (entry.authorItem && entry.workItem) return entry;
  try {
    const search = async (query: string) => {
      const url = new URL("https://cs.wikipedia.org/w/api.php");
      Object.entries({
        action: "query",
        generator: "search",
        gsrsearch: query,
        gsrlimit: "1",
        prop: "pageprops",
        format: "json",
        formatversion: "2",
        origin: "*",
      }).forEach(([key, value]) => url.searchParams.set(key, value));
      const response = await fetch(url);
      return (await response.json()).query?.pages?.[0];
    };
    const authorPage = await search(`${entry.author} spisovatel`);
    const qid = authorPage?.pageprops?.wikibase_item;
    if (!qid) throw new Error("Autor nebyl nalezen");
    const entityResponse = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
    const entity = (await entityResponse.json()).entities?.[qid];
    const claimYear = (property: string) => {
      const time = entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time;
      return time ? Number(String(time).match(/^([+-]\d+)/)?.[1]) : null;
    };
    const birth = claimYear("P569");
    const death = claimYear("P570");
    if (!birth) throw new Error("Chybí rok narození autora");
    let year = entry.year;
    if (!year) {
      const workPage = await search(`\"${entry.title}\" ${entry.author}`);
      const workQid = workPage?.pageprops?.wikibase_item;
      if (workQid) {
        const workEntityResponse = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${workQid}.json`);
        const workEntity = (await workEntityResponse.json()).entities?.[workQid];
        const time = workEntity?.claims?.P577?.[0]?.mainsnak?.datavalue?.value?.time;
        year = time ? Number(String(time).match(/^([+-]\d+)/)?.[1]) : undefined;
      }
    }
    if (!year) throw new Error("Chybí rok vydání");
    const authorId = `custom-${normalize(authorPage.title || entry.author).replace(/ /g, "-")}`;
    const workId = `${authorId}-${normalize(entry.title).replace(/ /g, "-")}`;
    const authorItem: TimelineItem = {
      id: authorId,
      title: authorPage.title || entry.author,
      start: birth,
      end: death || CURRENT_YEAR,
      living: !death,
      lane: "authors",
      kind: "author",
      importance: 5,
      wikiTitle: authorPage.title || entry.author,
      summary: "Autor automaticky doplněný z Wikipedie a Wikidat.",
    };
    const workItem: TimelineItem = {
      id: workId,
      authorId,
      title: entry.title,
      start: year,
      end: year,
      lane: "works",
      kind: "work",
      importance: 4,
      wikiTitle: entry.title,
      summary: `Dílo autora ${authorItem.title}.`,
    };
    return { ...entry, author: authorItem.title, year, authorItem, workItem, status: "resolved" };
  } catch (error) {
    return { ...entry, status: "missing", message: error instanceof Error ? error.message : "Položku se nepodařilo ověřit" };
  }
}

function PersonalizationModal({
  authors,
  works,
  onApply,
  onClose,
}: {
  authors: TimelineItem[];
  works: TimelineItem[];
  onApply: (entries: ImportEntry[], exactWorks: boolean, keepContext: boolean) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<ImportEntry[]>([]);
  const [status, setStatus] = useState("Nahraj soubor nebo vlož seznam.");
  const [working, setWorking] = useState(false);
  const [exactWorks, setExactWorks] = useState(true);
  const [keepContext, setKeepContext] = useState(true);

  const analyze = async (rawText: string) => {
    setWorking(true);
    const parsed = parseImportText(rawText, authors, works).slice(0, 120);
    if (!parsed.length) {
      setStatus("Nenašla jsem dvojice autor–dílo. Použij formát Autor | Dílo | Rok.");
      setWorking(false);
      return;
    }
    setStatus(`Rozpoznávám ${parsed.length} položek…`);
    const resolved: ImportEntry[] = [];
    for (let index = 0; index < parsed.length; index += 1) {
      setStatus(`Ověřuji ${index + 1} z ${parsed.length}: ${parsed[index].author} — ${parsed[index].title}`);
      resolved.push(await resolveUnknownEntry(parsed[index]));
    }
    setEntries(resolved);
    setStatus(`Hotovo: ${resolved.filter((entry) => entry.status !== "missing").length} rozpoznaných položek.`);
    setWorking(false);
  };

  const onFile = async (file: File) => {
    setWorking(true);
    setStatus(`Čtu soubor ${file.name}…`);
    try {
      const content = await extractFileText(file);
      setText(content);
      await analyze(content);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Soubor se nepodařilo přečíst.");
      setWorking(false);
    }
  };

  const valid = entries.filter((entry) => entry.authorItem && entry.workItem);

  return (
    <Modal onClose={onClose} className="personalization-modal">
      <header className="modal-header">
        <div>
          <span>Vlastní studijní osa</span>
          <h2>Nahraj svůj seznam děl</h2>
          <p>Soubor se zpracuje v prohlížeči. Neznámé položky se ověří přes Wikipedii a Wikidata.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Zavřít"><X /></button>
      </header>
      <div className="personalization-layout">
        <label className="upload-zone">
          <input type="file" accept=".pdf,.docx,.txt,.csv,.tsv,.json,.md" onChange={(event) => event.target.files?.[0] && void onFile(event.target.files[0])} />
          <Upload size={30} />
          <strong>Nahrát vlastní soubor</strong>
          <small>PDF, DOCX, TXT, CSV, TSV, Markdown nebo JSON</small>
          <b>Vybrat soubor</b>
        </label>
        <div className="paste-panel">
          <strong>Nebo vlož seznam jako text</strong>
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={'William Shakespeare | Hamlet | 1603\nFranz Kafka | Proměna | 1915\nKarel Čapek | R.U.R. | 1920'} />
          <button onClick={() => void analyze(text)} disabled={working || !text.trim()}>{working ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />} Analyzovat seznam</button>
        </div>
      </div>
      <div className="import-options">
        <label><input type="checkbox" checked={exactWorks} onChange={(event) => setExactWorks(event.target.checked)} /> Zobrazit jen díla z mého seznamu</label>
        <label><input type="checkbox" checked={keepContext} onChange={(event) => setKeepContext(event.target.checked)} /> Ponechat historický kontext</label>
      </div>
      <div className="import-status">{working && <LoaderCircle className="spin" size={15} />}{status}</div>
      {entries.length > 0 && (
        <div className="import-preview">
          <div className="import-summary"><span><b>{valid.length}</b> rozpoznáno</span><span><b>{entries.length - valid.length}</b> ke kontrole</span></div>
          <div className="import-list">
            {entries.map((entry, index) => (
              <div key={`${entry.author}-${entry.title}-${index}`} className={entry.status === "missing" ? "missing" : "ok"}>
                <span><strong>{entry.author}</strong><small>{entry.title}</small></span>
                <b>{entry.year ? formatYear(entry.year) : entry.message || "?"}</b>
              </div>
            ))}
          </div>
        </div>
      )}
      <footer className="modal-footer">
        <span>Soubor se neukládá na server.</span>
        <button className="primary-button" disabled={!valid.length || working} onClick={() => onApply(valid, exactWorks, keepContext)}>Použít na časové ose</button>
      </footer>
    </Modal>
  );
}

function DetailPanel({ item, onClose }: { item: TimelineItem; onClose: () => void }) {
  const source = useWikiImage(item.wikiTitle, true);
  return (
    <aside className="detail-panel">
      <button className="icon-button detail-close" onClick={onClose} aria-label="Zavřít"><X /></button>
      <div className="detail-media">
        {source ? <img src={source} alt="" referrerPolicy="no-referrer" /> : <span>{itemIcon(item)({ size: 44, strokeWidth: 1.5 })}</span>}
      </div>
      <div className="detail-content">
        <span className="detail-category" style={{ color: LANE_TONES[item.lane].strong }}>{LANE_META[item.lane].label}</span>
        <h2>{item.title}</h2>
        <strong>{formatRange(item)}</strong>
        <p>{item.summary}</p>
        <a href={`https://cs.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(item.wikiTitle)}`} target="_blank" rel="noreferrer">Otevřít na Wikipedii <ExternalLink size={15} /></a>
      </div>
    </aside>
  );
}

function TimelineCard({
  item,
  viewStart,
  viewEnd,
  onClick,
  focusedAuthorId,
  onFocusAuthor,
}: {
  item: TimelineItem;
  viewStart: number;
  viewEnd: number;
  onClick: () => void;
  focusedAuthorId: string | null;
  onFocusAuthor: (id: string | null) => void;
}) {
  const span = viewEnd - viewStart;
  const left = ((item.start - viewStart) / span) * 100;
  const duration = Math.max(0, item.end - item.start);
  const widthPercent = Math.max(0, (duration / span) * 100);
  const slots = item.lane === "authors" || item.lane === "works" ? 3 : 2;
  const slot = hash(item.id) % slots;
  const top = 14 + slot * 72;
  const isAuthor = item.kind === "author";
  const isWork = item.kind === "work";
  const isFocused = item.id === focusedAuthorId || item.authorId === focusedAuthorId;
  const Icon = itemIcon(item) as any;
  const style = {
    left: `${left}%`,
    top,
    width: duration > 1 ? `max(${isAuthor ? 174 : 154}px, ${widthPercent}%)` : isWork ? 166 : 178,
    "--lane-soft": LANE_TONES[item.lane].soft,
    "--lane-strong": LANE_TONES[item.lane].strong,
  } as CSSProperties;

  return (
    <button
      className={`timeline-item ${isAuthor ? "author-item" : ""} ${isWork ? "work-item" : ""} ${isFocused ? "focused" : ""}`}
      style={style}
      onClick={onClick}
      onMouseEnter={() => onFocusAuthor(isAuthor ? item.id : item.authorId || null)}
      onMouseLeave={() => onFocusAuthor(null)}
      title={`${item.title} · ${formatRange(item)}`}
    >
      {isAuthor ? <WikiPortrait title={item.wikiTitle} className="timeline-cutout" /> : <span className="item-icon"><Icon size={21} /></span>}
      <span className="item-copy"><strong>{item.title}</strong><small>{formatRange(item)}</small></span>
    </button>
  );
}

function TimelineApp({
  onTimelineOnly,
  timelineOnly,
  dark,
  onToggleDark,
}: {
  onTimelineOnly: () => void;
  timelineOnly: boolean;
  dark: boolean;
  onToggleDark: () => void;
}) {
  const appRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; start: number; end: number; pointerId: number } | null>(null);
  const frameRequest = useRef<number | null>(null);
  const pendingRange = useRef<[number, number] | null>(null);

  const [viewStart, setViewStart] = useState(1800);
  const [viewEnd, setViewEnd] = useState(2026);
  const [density, setDensity] = useState<Density>("balanced");
  const [enabledLanes, setEnabledLanes] = useState<Set<LaneId>>(() => new Set(LANE_ORDER));
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(() => new Set(readJson(AUTHOR_STORAGE, ["shakespeare", "komensky", "austen", "dostoevsky", "kafka", "capek", "orwell", "tolkien", "coelho", "mornstajnova"])));
  const [customData, setCustomData] = useState<CustomData>(() => readJson(CUSTOM_STORAGE, { authors: [], works: [] }));
  const [exactWorks, setExactWorks] = useState<Set<string> | null>(() => {
    const values = readJson<string[] | null>(EXACT_WORK_STORAGE, null);
    return values ? new Set(values) : null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [detail, setDetail] = useState<TimelineItem | null>(null);
  const [query, setQuery] = useState("");
  const [authorPicker, setAuthorPicker] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [periodMenu, setPeriodMenu] = useState(false);
  const [focusedAuthorId, setFocusedAuthorId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const authors = useMemo(() => [...AUTHORS, ...customData.authors], [customData.authors]);
  const works = useMemo(() => [...WORKS, ...customData.works], [customData.works]);
  const periods = useMemo(() => [...PERIODS, ...EXTRA_PERIODS], []);
  const historicalItems = useMemo(() => [...EVENTS, ...EXTRA_EVENTS, ...RULERS, ...FIGURES], []);

  useEffect(() => {
    localStorage.setItem(AUTHOR_STORAGE, JSON.stringify([...selectedAuthors]));
  }, [selectedAuthors]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_STORAGE, JSON.stringify(customData));
  }, [customData]);

  const setRange = (start: number, end: number) => {
    const [nextStart, nextEnd] = clampRange(start, end);
    setViewStart(nextStart);
    setViewEnd(nextEnd);
  };

  const scheduleRange = (start: number, end: number) => {
    pendingRange.current = [start, end];
    if (frameRequest.current !== null) return;
    frameRequest.current = requestAnimationFrame(() => {
      frameRequest.current = null;
      const pending = pendingRange.current;
      if (pending) setRange(pending[0], pending[1]);
    });
  };

  useEffect(() => () => {
    if (frameRequest.current !== null) cancelAnimationFrame(frameRequest.current);
  }, []);

  const span = viewEnd - viewStart;
  const zoom = spanToZoom(span);
  const center = (viewStart + viewEnd) / 2;

  const visibleItems = useMemo(() => {
    const threshold = DENSITY_MIN_IMPORTANCE[density];
    const authorItems = authors.filter((author) => selectedAuthors.has(author.id));
    const workItems = works.filter((work) => selectedAuthors.has(work.authorId || "") && (!exactWorks || exactWorks.has(normalize(work.title))));
    const all = [...authorItems, ...workItems, ...historicalItems];
    return all.filter((item) => {
      if (!enabledLanes.has(item.lane)) return false;
      if (item.importance < threshold) return false;
      return item.end >= viewStart - span * 0.08 && item.start <= viewEnd + span * 0.08;
    });
  }, [authors, works, historicalItems, selectedAuthors, enabledLanes, density, exactWorks, viewStart, viewEnd, span]);

  const itemsByLane = useMemo(() => {
    const map = new Map<LaneId, TimelineItem[]>();
    LANE_ORDER.forEach((lane) => map.set(lane, []));
    visibleItems.forEach((item) => map.get(item.lane)?.push(item));
    map.forEach((items) => items.sort((a, b) => a.start - b.start || b.importance - a.importance));
    return map;
  }, [visibleItems]);

  const visiblePeriods = useMemo(() => periods.filter((period) => period.end >= viewStart && period.start <= viewEnd), [periods, viewStart, viewEnd]);

  const ticks = useMemo(() => {
    const count = 7;
    return Array.from({ length: count }, (_, index) => viewStart + (span * index) / (count - 1));
  }, [viewStart, span]);

  const searchResults = useMemo(() => {
    const target = normalize(deferredQuery);
    if (!target) return [];
    return [...authors, ...works, ...historicalItems]
      .filter((item) => normalize(`${item.title} ${item.summary} ${(item.tags || []).join(" ")}`).includes(target))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8);
  }, [deferredQuery, authors, works, historicalItems]);

  const focusItem = (item: TimelineItem) => {
    const itemSpan = Math.max(30, item.end - item.start + 20);
    setRange(item.start - itemSpan * 0.35, item.end + itemSpan * 0.65);
    setDetail(item);
    setQuery("");
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button,input,a")) return;
    dragRef.current = { x: event.clientX, start: viewStart, end: viewEnd, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("dragging");
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const width = event.currentTarget.getBoundingClientRect().width;
    const delta = -((event.clientX - drag.x) / Math.max(width, 1)) * (drag.end - drag.start);
    scheduleRange(drag.start + delta, drag.end + delta);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    try { event.currentTarget.releasePointerCapture(dragRef.current.pointerId); } catch { /* already released */ }
    dragRef.current = null;
    event.currentTarget.classList.remove("dragging");
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button,input,a,.period-strip")) return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const nextSpan = Math.max(MIN_SPAN, Math.min(MAX_SPAN, span * Math.exp(event.deltaY * 0.0014)));
      const anchor = viewStart + span * ratio;
      setRange(anchor - nextSpan * ratio, anchor + nextSpan * (1 - ratio));
      return;
    }
    if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.7) {
      event.preventDefault();
      const delta = ((event.deltaX || event.deltaY) / Math.max(event.currentTarget.clientWidth, 1)) * span;
      setRange(viewStart + delta, viewEnd + delta);
    }
  };

  const toggleLane = (lane: LaneId) => {
    const next = new Set(enabledLanes);
    if (next.has(lane)) next.delete(lane);
    else next.add(lane);
    setEnabledLanes(next);
  };

  const useHistoryOnly = () => setEnabledLanes(new Set(["rulers", "czech", "world", "tech", "monuments", "figures"]));
  const useLiterature = () => setEnabledLanes(new Set(["authors", "works", "czech", "world", "tech", "figures"]));

  const applyImport = (entries: ImportEntry[], onlyExactWorks: boolean, keepContext: boolean) => {
    const importedAuthors = entries.map((entry) => entry.authorItem).filter((item): item is TimelineItem => Boolean(item));
    const importedWorks = entries.map((entry) => entry.workItem).filter((item): item is TimelineItem => Boolean(item));
    const knownAuthorIds = new Set(entries.map((entry) => entry.authorItem?.id).filter(Boolean) as string[]);
    const uniqueAuthors = [...new Map(importedAuthors.map((item) => [item.id, item])).values()];
    const uniqueWorks = [...new Map(importedWorks.map((item) => [item.id, item])).values()];
    setCustomData({
      authors: uniqueAuthors.filter((item) => !AUTHORS.some((author) => author.id === item.id)),
      works: uniqueWorks.filter((item) => !WORKS.some((work) => work.id === item.id)),
    });
    setSelectedAuthors(knownAuthorIds);
    if (onlyExactWorks) {
      const titles = new Set(entries.map((entry) => normalize(entry.title)));
      setExactWorks(titles);
      localStorage.setItem(EXACT_WORK_STORAGE, JSON.stringify([...titles]));
    } else {
      setExactWorks(null);
      localStorage.removeItem(EXACT_WORK_STORAGE);
    }
    if (!keepContext) setEnabledLanes(new Set(["authors", "works"]));
    else useLiterature();
    setPersonalization(false);
    setRange(Math.min(...entries.map((entry) => entry.authorItem?.start || entry.year || 1800)) - 20, Math.max(...entries.map((entry) => entry.year || 2026)) + 20);
  };

  const resetPersonalization = () => {
    setCustomData({ authors: [], works: [] });
    setSelectedAuthors(new Set(DEFAULT_AUTHOR_IDS));
    setExactWorks(null);
    localStorage.removeItem(CUSTOM_STORAGE);
    localStorage.removeItem(EXACT_WORK_STORAGE);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await appRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      appRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const timelineBoard = (
    <div className="timeline-workspace">
      <div className="timeline-toolbar">
        <button className="mobile-filter-button" onClick={() => setMobileFilters(true)}><Filter size={18} /> Filtry</button>
        <label className="app-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat autora, dílo nebo událost…" /></label>
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((item) => (
              <button key={item.id} onClick={() => focusItem(item)}><span style={{ background: LANE_TONES[item.lane].soft, color: LANE_TONES[item.lane].strong }}>{itemIcon(item)({ size: 16 })}</span><div><strong>{item.title}</strong><small>{LANE_META[item.lane].label} · {formatRange(item)}</small></div></button>
            ))}
          </div>
        )}
        <button className="toolbar-button" onClick={() => setPeriodMenu((value) => !value)}><CalendarDays size={17} /> Období <ChevronDown size={15} /></button>
        <button className="icon-button" onClick={onToggleDark} title="Změnit vzhled">{dark ? <Sun /> : <Moon />}</button>
        <button className="toolbar-button" onClick={onTimelineOnly}><Layers3 size={17} /> {timelineOnly ? "Celá stránka" : "Pouze osa"}</button>
        <button className="icon-button" onClick={toggleFullscreen} title="Celá obrazovka"><Maximize2 /></button>
      </div>

      {periodMenu && (
        <div className="period-menu">
          {PRESETS.map((preset) => <button key={preset.label} onClick={() => { setRange(preset.start, preset.end); setPeriodMenu(false); }}>{preset.label}<small>{formatYear(preset.start)}–{formatYear(preset.end)}</small></button>)}
        </div>
      )}

      <div className="period-strip">
        <div className="period-strip-label">Historická období</div>
        <div className="period-track">
          {visiblePeriods.map((period) => {
            const left = ((period.start - viewStart) / span) * 100;
            const width = ((period.end - period.start) / span) * 100;
            return (
              <button key={period.id} style={{ left: `${left}%`, width: `max(72px, ${width}%)`, background: `${period.color}22`, borderColor: `${period.color}66`, color: period.color }} onClick={() => setRange(period.start, period.end)}>
                <strong>{period.title}</strong><small>{formatYear(period.start)}–{formatYear(period.end)}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="timeline-scroll" ref={boardRef}>
        <div className="timeline-grid" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={onWheel}>
          <div className="time-axis">
            {ticks.map((tick) => <span key={tick} style={{ left: `${((tick - viewStart) / span) * 100}%` }}><b>{formatYear(tick)}</b></span>)}
          </div>
          {LANE_ORDER.filter((lane) => enabledLanes.has(lane)).map((lane) => {
            const Icon = LANE_ICONS[lane] as any;
            const items = itemsByLane.get(lane) || [];
            return (
              <section key={lane} className="timeline-lane" style={{ "--lane-soft": LANE_TONES[lane].soft, "--lane-strong": LANE_TONES[lane].strong } as CSSProperties}>
                <header><span><Icon size={18} /></span><div><strong>{LANE_META[lane].label}</strong><small>{items.length} viditelných</small></div></header>
                <div className="lane-canvas">
                  {ticks.map((tick) => <i key={tick} className="grid-line" style={{ left: `${((tick - viewStart) / span) * 100}%` }} />)}
                  {items.map((item) => <TimelineCard key={item.id} item={item} viewStart={viewStart} viewEnd={viewEnd} onClick={() => setDetail(item)} focusedAuthorId={focusedAuthorId} onFocusAuthor={setFocusedAuthorId} />)}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="timeline-controls">
        <div className="range-readout"><span>{formatYear(viewStart)}</span><strong>{formatYear(center)}</strong><span>{formatYear(viewEnd)}</span></div>
        <div className="control-row">
          <button className="icon-button" onClick={() => { const next = Math.min(100, zoom + 8); const nextSpan = zoomToSpan(next); setRange(center - nextSpan / 2, center + nextSpan / 2); }}><Plus /></button>
          <input className="zoom-slider" type="range" min="0" max="100" value={zoom} onChange={(event) => { const nextSpan = zoomToSpan(Number(event.target.value)); setRange(center - nextSpan / 2, center + nextSpan / 2); }} aria-label="Přiblížení" />
          <button className="icon-button" onClick={() => { const next = Math.max(0, zoom - 8); const nextSpan = zoomToSpan(next); setRange(center - nextSpan / 2, center + nextSpan / 2); }}><Minus /></button>
          <div className="pan-control"><MoveHorizontal size={16} /><input type="range" min={MIN_YEAR} max={MAX_YEAR} value={Math.round(center)} onChange={(event) => { const nextCenter = Number(event.target.value); setRange(nextCenter - span / 2, nextCenter + span / 2); }} /></div>
          <button className="overview-button" onClick={() => setRange(1000, 2026)}><RotateCcw size={16} /> Oddálit na přehled</button>
        </div>
        <div className="preset-row">{PRESETS.map((preset) => <button key={preset.label} onClick={() => setRange(preset.start, preset.end)}>{preset.label}</button>)}</div>
      </div>
    </div>
  );

  const sidebar = (
    <aside className={`app-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileFilters ? "mobile-open" : ""}`}>
      <div className="sidebar-brand"><span><Landmark /></span><div><strong>Časovrstvy</strong><small>historie v souvislostech</small></div><button className="icon-button" onClick={() => setSidebarCollapsed((value) => !value)}>{sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button><button className="icon-button mobile-close" onClick={() => setMobileFilters(false)}><X /></button></div>
      <div className="sidebar-content">
        <section>
          <div className="sidebar-heading"><span>Množství informací</span><small>Kolik detailů má osa ukázat</small></div>
          <div className="density-list">
            {(Object.keys(DENSITY_COPY) as Density[]).map((key) => <button key={key} className={density === key ? "active" : ""} onClick={() => setDensity(key)}><i>{density === key && <Check size={14} />}</i><span><strong>{DENSITY_COPY[key].title}</strong><small>{DENSITY_COPY[key].text}</small></span></button>)}
          </div>
        </section>
        <section>
          <div className="sidebar-heading"><span>Tematické vrstvy</span><small>Vypnutý řádek úplně zmizí</small></div>
          <div className="lane-toggle-list">
            {LANE_ORDER.map((lane) => { const Icon = LANE_ICONS[lane] as any; const active = enabledLanes.has(lane); return <button key={lane} className={active ? "active" : ""} onClick={() => toggleLane(lane)}><span style={{ color: LANE_TONES[lane].strong, background: LANE_TONES[lane].soft }}><Icon size={17} /></span><strong>{LANE_META[lane].label}</strong><i>{active ? "ON" : "OFF"}</i></button>; })}
          </div>
          <div className="quick-filter-row"><button onClick={() => setEnabledLanes(new Set(LANE_ORDER))}>Všechny</button><button onClick={useHistoryOnly}>Jen historie</button><button onClick={useLiterature}>Literatura + kontext</button></div>
        </section>
        <section>
          <div className="sidebar-heading"><span>Literatura</span><small>{selectedAuthors.size} vybraných autorů</small></div>
          <button className="sidebar-action" onClick={() => setAuthorPicker(true)}><Users size={19} /><span><strong>Vybrat vlastní autory</strong><small>Katalog více než 100 autorů</small></span><ChevronRight size={16} /></button>
          <button className="sidebar-action accent" onClick={() => setPersonalization(true)}><Upload size={19} /><span><strong>Nahrát vlastní seznam</strong><small>PDF, DOCX, TXT, CSV nebo JSON</small></span><ChevronRight size={16} /></button>
          {(customData.authors.length > 0 || exactWorks) && <button className="reset-personalization" onClick={resetPersonalization}>Zrušit personalizaci</button>}
        </section>
        <section>
          <div className="sidebar-heading"><span>Vlastní období</span><small>Zadej přesný rozsah</small></div>
          <form className="custom-range" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setRange(Number(form.get("from")), Number(form.get("to"))); }}><label>Od<input name="from" type="number" defaultValue={Math.round(viewStart)} /></label><label>Do<input name="to" type="number" defaultValue={Math.round(viewEnd)} /></label><button type="submit">Použít</button></form>
        </section>
      </div>
    </aside>
  );

  return (
    <div ref={appRef} className={`timeline-app ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      {sidebar}
      {mobileFilters && <button className="mobile-overlay" onClick={() => setMobileFilters(false)} aria-label="Zavřít filtry" />}
      {timelineBoard}
      {detail && <DetailPanel item={detail} onClose={() => setDetail(null)} />}
      {authorPicker && <AuthorPicker authors={authors} selected={selectedAuthors} onChange={setSelectedAuthors} onClose={() => setAuthorPicker(false)} />}
      {personalization && <PersonalizationModal authors={authors} works={works} onApply={applyImport} onClose={() => setPersonalization(false)} />}
    </div>
  );
}

export default function AppRedesign() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_STORAGE) === "dark");
  const [timelineOnly, setTimelineOnly] = useState(false);
  const timelineSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE, dark ? "dark" : "light");
  }, [dark]);

  const scrollToTimeline = () => timelineSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={`site-shell ${timelineOnly ? "timeline-only-page" : ""}`}>
      {!timelineOnly && (
        <>
          <nav className="site-nav">
            <a href="#top" className="site-brand"><span><Landmark /></span><strong>Časovrstvy</strong></a>
            <div className="site-links"><a href="#how">Jak to funguje</a><a href="#personalize">Personalizace</a><a href="#timeline">Časová osa</a><button className="theme-pill" onClick={() => setDark((value) => !value)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><button className="nav-cta" onClick={scrollToTimeline}>Otevřít osu</button></div>
            <button className="nav-mobile-cta" onClick={scrollToTimeline}>Otevřít osu</button>
          </nav>
          <main id="top">
            <section className="hero-section-redesign">
              <div className="hero-copy-redesign">
                <span className="hero-kicker"><Sparkles size={16} /> Interaktivní vzdělávací projekt</span>
                <h1>Historie a literatura <em>v souvislostech.</em></h1>
                <p>Objevuj autory, díla, vládce, události, vynálezy a stavby v jedné stabilní časové ose. Bez chaosu, bez přeskakování a s jasným kontextem.</p>
                <div className="hero-actions-redesign"><button className="primary-button" onClick={scrollToTimeline}>Začít objevovat <ArrowDown size={18} /></button><a href="#how">Zjistit více</a></div>
                <div className="hero-stats"><span><b>100+</b> autorů</span><span><b>Stovky</b> událostí</span><span><b>3</b> úrovně podrobnosti</span></div>
              </div>
              <HeroPreview />
            </section>

            <section className="benefit-strip">
              <article><span><Layers3 /></span><div><strong>Kontextuální učení</strong><p>Literatura, dějepis, věda a kultura na jedné ose.</p></div></article>
              <article><span><MoveHorizontal /></span><div><strong>Stabilní navigace</strong><p>Všechny řádky se posouvají společně a plynule.</p></div></article>
              <article><span><SlidersHorizontal /></span><div><strong>Plná kontrola</strong><p>Zapni jen vrstvy a množství dat, které potřebuješ.</p></div></article>
              <article><span><GraduationCap /></span><div><strong>Pro školu i samostudium</strong><p>Rychlý přehled i podrobná příprava na maturitu.</p></div></article>
            </section>

            <section id="how" className="how-section-redesign">
              <div className="section-title"><span>Jak to funguje</span><h2>Nejdřív si nastav pohled. Potom objevuj souvislosti.</h2></div>
              <div className="steps-grid">
                <article><b>1</b><CalendarDays /><h3>Vyber období</h3><p>Zaměř se na starověk, renesanci, první republiku nebo vlastní rozsah.</p></article>
                <article><b>2</b><Filter /><h3>Zapni vrstvy</h3><p>Autoři, díla, české dějiny, svět, vynálezy, stavby a osobnosti.</p></article>
                <article><b>3</b><Search /><h3>Otevři detail</h3><p>Klikni na kartu a zobraz fotografii, popis, roky a odkaz na zdroj.</p></article>
              </div>
            </section>

            <section id="personalize" className="personalize-section-redesign">
              <div className="personalize-copy"><span>Tvůj obsah, tvoje osa</span><h2>Použij hotový katalog, nebo nahraj vlastní seznam.</h2><p>Základní verze funguje ihned. Student nebo učitel ale může nahrát školní seznam a vytvořit vlastní literární vrstvu.</p></div>
              <div className="personalize-cards">
                <article><div><BookOpen /></div><span>Základní katalog</span><h3>Více než 100 autorů a známých děl</h3><p>Česká i světová literatura od starověku po současnost, doplněná historickým kontextem.</p><button onClick={scrollToTimeline}>Použít katalog</button></article>
                <article className="featured"><div><Upload /></div><span>Vlastní seznam</span><h3>PDF, DOCX, TXT, CSV nebo JSON</h3><p>Aplikace rozpozná autory a díla, ověří neznámé položky a připraví personalizovaný pohled.</p><button onClick={scrollToTimeline}>Otevřít personalizaci v aplikaci</button></article>
              </div>
            </section>
          </main>
        </>
      )}

      <section id="timeline" ref={timelineSectionRef} className="timeline-section-redesign">
        {!timelineOnly && <div className="timeline-intro-redesign"><span>Interaktivní aplikace</span><h2>Poskládej si vlastní pohled na dějiny.</h2><p>Vypnuté řádky skutečně zmizí, karty zůstávají na stabilní pozici a osa se pohybuje jako jeden celek.</p></div>}
        <TimelineApp timelineOnly={timelineOnly} onTimelineOnly={() => setTimelineOnly((value) => !value)} dark={dark} onToggleDark={() => setDark((value) => !value)} />
        {!timelineOnly && <div className="fullscreen-note"><div><Maximize2 /><span><strong>Potřebuješ více prostoru?</strong><small>V aplikaci klikni na ikonu celé obrazovky. Filtry, zoom i detaily zůstanou funkční.</small></span></div><button onClick={scrollToTimeline}>Přejít k ovládání osy</button></div>}
      </section>

      {!timelineOnly && <footer className="site-footer"><a href="#top" className="site-brand"><span><Landmark /></span><strong>Časovrstvy</strong></a><p>Veřejná vzdělávací časová osa pro studenty, učitele a všechny zvídavé návštěvníky.</p><small>© 2026 Časovrstvy</small></footer>}
    </div>
  );
}
