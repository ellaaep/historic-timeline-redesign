import {
  ArrowDown,
  BookOpen,
  CalendarDays,
  Castle,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Crown,
  ExternalLink,
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
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  AUTHORS,
  DEFAULT_AUTHOR_IDS,
  EVENTS,
  FIGURES,
  LANE_META,
  PERIODS,
  RULERS,
  WORKS,
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

const LANE_ORDER = ["authors", "works", "rulers", "czech", "world", "tech", "monuments", "figures"];
const LANE_ICONS = {
  authors: UserRound,
  works: BookOpen,
  rulers: Crown,
  czech: Landmark,
  world: Globe2,
  tech: Lightbulb,
  monuments: Castle,
  figures: CircleUserRound,
};
const LANE_TONES = {
  authors: { soft: "#f0e5ff", strong: "#7d4bc7" },
  works: { soft: "#dcf7ee", strong: "#23856c" },
  rulers: { soft: "#fff0c8", strong: "#a97818" },
  czech: { soft: "#dfeeff", strong: "#3f75a9" },
  world: { soft: "#ffe2df", strong: "#b44e4a" },
  tech: { soft: "#fff0db", strong: "#cc7a2d" },
  monuments: { soft: "#efe4d5", strong: "#87603d" },
  figures: { soft: "#dff3f1", strong: "#267e75" },
};
const DENSITY_MIN = { essentials: 5, balanced: 4, detailed: 2 };
const DENSITY_COPY = {
  essentials: ["Základy", "Jen klíčová jména a mezníky"],
  balanced: ["Vyváženě", "Nejlepší poměr přehledu a detailu"],
  detailed: ["Podrobně", "Maximum dostupných souvislostí"],
};
const PRESETS = [
  ["Starověk", -800, 500],
  ["Středověk", 900, 1500],
  ["Renesance", 1400, 1650],
  ["19. století", 1780, 1900],
  ["První republika", 1914, 1939],
  ["20. století", 1900, 2000],
  ["Přehled 1000–2026", 1000, 2026],
];

const normalize = (value) =>
  String(value || "")
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const formatYear = (year) =>
  year < 0 ? `${Math.abs(Math.round(year)).toLocaleString("cs-CZ")} př. n. l.` : String(Math.round(year));

const formatRange = (item) => {
  if (item.living) return `${formatYear(item.start)}–dnes`;
  return Math.round(item.start) === Math.round(item.end)
    ? formatYear(item.start)
    : `${formatYear(item.start)}–${formatYear(item.end)}`;
};

const hash = (value) => {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) result = (result * 31 + value.charCodeAt(index)) >>> 0;
  return result;
};

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const clampRange = (start, end) => {
  let nextStart = Number(start);
  let nextEnd = Number(end);
  if (!Number.isFinite(nextStart) || !Number.isFinite(nextEnd)) return [1800, 2026];
  if (nextEnd < nextStart) [nextStart, nextEnd] = [nextEnd, nextStart];
  const span = Math.max(MIN_SPAN, nextEnd - nextStart);
  nextEnd = nextStart + span;
  if (nextStart < MIN_YEAR) {
    nextStart = MIN_YEAR;
    nextEnd = MIN_YEAR + span;
  }
  if (nextEnd > MAX_YEAR) {
    nextEnd = MAX_YEAR;
    nextStart = MAX_YEAR - span;
  }
  return [Math.max(MIN_YEAR, nextStart), Math.min(MAX_YEAR, nextEnd)];
};

const spanToZoom = (span) => Math.round((1 - Math.log(Math.max(MIN_SPAN, span) / MIN_SPAN) / Math.log(MAX_SPAN / MIN_SPAN)) * 100);
const zoomToSpan = (zoom) => MIN_SPAN * Math.pow(MAX_SPAN / MIN_SPAN, 1 - zoom / 100);

function laneIcon(item) {
  if (item.kind === "work") return BookOpen;
  if (item.lane === "tech") return FlaskConical;
  if (item.lane === "monuments") return Castle;
  if (item.lane === "rulers") return Crown;
  if (item.lane === "world") return Globe2;
  if (item.lane === "czech") return Landmark;
  return History;
}

function useWikiImage(title, active = true) {
  const [source, setSource] = useState(null);
  useEffect(() => {
    if (!title || !active) return;
    let cancelled = false;
    const key = `casovrstvy-image:${title}`;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      setSource(cached);
      return;
    }
    (async () => {
      for (const language of ["cs", "en"]) {
        try {
          const response = await fetch(`https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`);
          if (!response.ok) continue;
          const data = await response.json();
          const image = data.thumbnail?.source || data.originalimage?.source;
          if (image) {
            sessionStorage.setItem(key, image);
            if (!cancelled) setSource(image);
            return;
          }
        } catch {
          // Fallback icon is used.
        }
      }
    })();
    return () => { cancelled = true; };
  }, [title, active]);
  return source;
}

function WikiPortrait({ title, className = "" }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const source = useWikiImage(title, active);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true);
        observer.disconnect();
      }
    }, { rootMargin: "240px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <span ref={ref} className={`wiki-portrait ${className}`}>{source ? <img src={source} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <UserRound size={22} />}</span>;
}

function HeroPreview() {
  const nodes = [
    ["Franz Kafka", "1883–1924", "Franz Kafka", 18, 18, "author"],
    ["Proměna", "1915", "Proměna (povídka)", 8, 62, "work"],
    ["Vznik Československa", "1918", "Vznik Československa", 43, 48, "event"],
    ["Karel Čapek", "1890–1938", "Karel Čapek", 72, 61, "author"],
    ["R.U.R.", "1920", "R.U.R.", 78, 16, "work"],
  ];
  return (
    <div className="hero-graph">
      <div className="hero-graph-period">Evropa · 1883–1938</div>
      <svg className="hero-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 24 30 C 22 44, 18 50, 16 66" />
        <path d="M 25 28 C 34 34, 40 40, 48 52" />
        <path d="M 76 66 C 69 61, 61 58, 50 54" />
        <path d="M 78 64 C 79 48, 82 36, 84 25" />
      </svg>
      {nodes.map(([title, subtitle, wiki, x, y, type]) => (
        <article key={title} className={`hero-node hero-node-${type}`} style={{ left: `${x}%`, top: `${y}%` }}>
          {type === "author" ? <WikiPortrait title={wiki} className="hero-cutout" /> : <span className="hero-node-icon">{type === "work" ? <BookOpen size={24} /> : <Landmark size={24} />}</span>}
          <strong>{title}</strong><small>{subtitle}</small>
        </article>
      ))}
      <div className="hero-graph-note">autor → dílo → historický kontext</div>
    </div>
  );
}

function Modal({ children, onClose, className = "" }) {
  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`modal-card ${className}`} role="dialog" aria-modal="true">{children}</section></div>;
}

function AuthorPicker({ authors, selected, onChange, onClose }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const filtered = useMemo(() => authors.filter((author) => !deferred || normalize(author.title).includes(normalize(deferred))).sort((a, b) => a.start - b.start).slice(0, 180), [authors, deferred]);
  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };
  const preset = (ids) => onChange(new Set(ids.filter((id) => authors.some((author) => author.id === id))));
  return (
    <Modal onClose={onClose} className="author-modal">
      <header className="modal-header"><div><span>Literární vrstva</span><h2>Vyber autory, které chceš vidět</h2><p>Díla vybraných autorů se zobrazí automaticky.</p></div><button className="icon-button" onClick={onClose}><X /></button></header>
      <div className="author-toolbar"><label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat autora…" /></label><div className="author-presets"><button onClick={() => preset(["shakespeare", "komensky", "austen", "dostoevsky", "kafka", "capek", "orwell", "tolkien", "coelho", "mornstajnova"])}>Světový přehled</button><button onClick={() => preset(DEFAULT_AUTHOR_IDS)}>Výchozí výběr</button><button onClick={() => onChange(new Set(authors.map((author) => author.id)))}>Všichni</button><button onClick={() => onChange(new Set())}>Vymazat</button></div></div>
      <div className="author-grid">{filtered.map((author) => <button key={author.id} className={selected.has(author.id) ? "selected" : ""} onClick={() => toggle(author.id)}><WikiPortrait title={author.wikiTitle} /><span><strong>{author.title}</strong><small>{formatRange(author)}</small></span><i>{selected.has(author.id) ? <Check size={15} /> : <Plus size={15} />}</i></button>)}</div>
      <footer className="modal-footer"><span>{selected.size} vybraných autorů</span><button className="primary-button" onClick={onClose}>Použít výběr</button></footer>
    </Modal>
  );
}

async function extractFileText(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    const pdfjs = await import(/* @vite-ignore */ "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str || "").join(" "));
    }
    return pages.join("\n");
  }
  if (extension === "docx") {
    const module = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/+esm");
    const reader = module.extractRawText || module.default?.extractRawText;
    if (!reader) throw new Error("Čtení DOCX není dostupné.");
    return String((await reader({ arrayBuffer: await file.arrayBuffer() })).value || "");
  }
  return file.text();
}

function parseText(text, authors, works) {
  const result = [];
  const seen = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s*(?:\d+[.)]|[-–—•])\s*/, "").trim();
    if (line.length < 4) continue;
    const normalizedLine = normalize(line);
    const knownWork = works.find((work) => normalizedLine.includes(normalize(work.title)));
    if (knownWork) {
      const author = authors.find((item) => item.id === knownWork.authorId);
      if (author) {
        const key = `${author.id}|${knownWork.id}`;
        if (!seen.has(key)) result.push({ author: author.title, title: knownWork.title, year: knownWork.start, authorItem: author, workItem: knownWork, ok: true });
        seen.add(key);
        continue;
      }
    }
    const parts = line.split(/\s*[|;]\s*|\s+[–—-]\s+/).map((item) => item.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const candidate = Number(parts.at(-1));
      const hasYear = Number.isFinite(candidate) && Math.abs(candidate) > 100;
      const entry = { author: parts[0], title: parts.slice(1, hasYear ? -1 : undefined).join(" – "), year: hasYear ? candidate : undefined, ok: false };
      const key = `${normalize(entry.author)}|${normalize(entry.title)}`;
      if (!seen.has(key)) result.push(entry);
      seen.add(key);
    }
  }
  return result;
}

async function resolveEntry(entry) {
  if (entry.ok) return entry;
  try {
    const search = async (query) => {
      const url = new URL("https://cs.wikipedia.org/w/api.php");
      Object.entries({ action: "query", generator: "search", gsrsearch: query, gsrlimit: "1", prop: "pageprops", format: "json", formatversion: "2", origin: "*" }).forEach(([key, value]) => url.searchParams.set(key, value));
      return (await (await fetch(url)).json()).query?.pages?.[0];
    };
    const authorPage = await search(`${entry.author} spisovatel`);
    const qid = authorPage?.pageprops?.wikibase_item;
    if (!qid) throw new Error("Autor nebyl nalezen");
    const entity = (await (await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`)).json()).entities?.[qid];
    const getYear = (property, source = entity) => {
      const time = source?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time;
      const match = String(time || "").match(/^([+-]\d+)/);
      return match ? Number(match[1]) : null;
    };
    const birth = getYear("P569");
    const death = getYear("P570");
    if (!birth) throw new Error("Chybí rok narození autora");
    let year = entry.year;
    if (!year) {
      const workPage = await search(`\"${entry.title}\" ${entry.author}`);
      const workQid = workPage?.pageprops?.wikibase_item;
      if (workQid) {
        const workEntity = (await (await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${workQid}.json`)).json()).entities?.[workQid];
        year = getYear("P577", workEntity);
      }
    }
    if (!year) throw new Error("Chybí rok vydání");
    const authorTitle = authorPage.title || entry.author;
    const authorId = `custom-${normalize(authorTitle).replace(/ /g, "-")}`;
    const authorItem = { id: authorId, title: authorTitle, start: birth, end: death || CURRENT_YEAR, living: !death, lane: "authors", kind: "author", importance: 5, wikiTitle: authorTitle, summary: "Autor doplněný z Wikipedie a Wikidat." };
    const workItem = { id: `${authorId}-${normalize(entry.title).replace(/ /g, "-")}`, authorId, title: entry.title, start: year, end: year, lane: "works", kind: "work", importance: 4, wikiTitle: entry.title, summary: `Dílo autora ${authorTitle}.` };
    return { ...entry, author: authorTitle, year, authorItem, workItem, ok: true };
  } catch (error) {
    return { ...entry, message: error.message || "Položku se nepodařilo ověřit", ok: false };
  }
}

function PersonalizationModal({ authors, works, onApply, onClose }) {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState([]);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState("Nahraj soubor nebo vlož seznam.");
  const [exactWorks, setExactWorks] = useState(true);
  const [keepContext, setKeepContext] = useState(true);
  const analyze = async (content) => {
    const parsed = parseText(content, authors, works).slice(0, 100);
    if (!parsed.length) return setStatus("Nenašla jsem dvojice autor–dílo. Použij formát Autor | Dílo | Rok.");
    setWorking(true);
    const next = [];
    for (let index = 0; index < parsed.length; index += 1) {
      setStatus(`Ověřuji ${index + 1} z ${parsed.length}: ${parsed[index].author} — ${parsed[index].title}`);
      next.push(await resolveEntry(parsed[index]));
    }
    setEntries(next);
    setStatus(`Hotovo: ${next.filter((entry) => entry.ok).length} rozpoznaných položek.`);
    setWorking(false);
  };
  const fileSelected = async (file) => {
    try {
      setWorking(true);
      setStatus(`Čtu soubor ${file.name}…`);
      const content = await extractFileText(file);
      setText(content);
      await analyze(content);
    } catch (error) {
      setWorking(false);
      setStatus(error.message || "Soubor se nepodařilo přečíst.");
    }
  };
  const valid = entries.filter((entry) => entry.ok && entry.authorItem && entry.workItem);
  return (
    <Modal onClose={onClose} className="personalization-modal">
      <header className="modal-header"><div><span>Vlastní studijní osa</span><h2>Nahraj svůj seznam děl</h2><p>Soubor se zpracuje v prohlížeči. Neznámé položky se ověří přes Wikipedii a Wikidata.</p></div><button className="icon-button" onClick={onClose}><X /></button></header>
      <div className="personalization-layout"><label className="upload-zone"><input type="file" accept=".pdf,.docx,.txt,.csv,.tsv,.json,.md" onChange={(event) => event.target.files?.[0] && fileSelected(event.target.files[0])} /><Upload size={30} /><strong>Nahrát vlastní soubor</strong><small>PDF, DOCX, TXT, CSV, TSV, Markdown nebo JSON</small><b>Vybrat soubor</b></label><div className="paste-panel"><strong>Nebo vlož seznam jako text</strong><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={'William Shakespeare | Hamlet | 1603\nFranz Kafka | Proměna | 1915\nKarel Čapek | R.U.R. | 1920'} /><button disabled={working || !text.trim()} onClick={() => analyze(text)}>{working ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />} Analyzovat seznam</button></div></div>
      <div className="import-options"><label><input type="checkbox" checked={exactWorks} onChange={(event) => setExactWorks(event.target.checked)} /> Zobrazit jen díla z mého seznamu</label><label><input type="checkbox" checked={keepContext} onChange={(event) => setKeepContext(event.target.checked)} /> Ponechat historický kontext</label></div>
      <div className="import-status">{working && <LoaderCircle className="spin" size={15} />}{status}</div>
      {entries.length > 0 && <div className="import-preview"><div className="import-summary"><span><b>{valid.length}</b> rozpoznáno</span><span><b>{entries.length - valid.length}</b> ke kontrole</span></div><div className="import-list">{entries.map((entry, index) => <div key={`${entry.author}-${entry.title}-${index}`} className={entry.ok ? "ok" : "missing"}><span><strong>{entry.author}</strong><small>{entry.title}</small></span><b>{entry.year ? formatYear(entry.year) : entry.message || "?"}</b></div>)}</div></div>}
      <footer className="modal-footer"><span>Soubor se neukládá na server.</span><button className="primary-button" disabled={!valid.length || working} onClick={() => onApply(valid, exactWorks, keepContext)}>Použít na časové ose</button></footer>
    </Modal>
  );
}

function DetailPanel({ item, onClose }) {
  const source = useWikiImage(item.wikiTitle, true);
  const Icon = laneIcon(item);
  return <aside className="detail-panel"><button className="icon-button detail-close" onClick={onClose}><X /></button><div className="detail-media">{source ? <img src={source} alt="" referrerPolicy="no-referrer" /> : <span><Icon size={44} strokeWidth={1.5} /></span>}</div><div className="detail-content"><span className="detail-category" style={{ color: LANE_TONES[item.lane].strong }}>{LANE_META[item.lane].label}</span><h2>{item.title}</h2><strong>{formatRange(item)}</strong><p>{item.summary}</p><a href={`https://cs.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(item.wikiTitle)}`} target="_blank" rel="noreferrer">Otevřít na Wikipedii <ExternalLink size={15} /></a></div></aside>;
}

function TimelineItemCard({ item, viewStart, viewEnd, focusedAuthorId, onFocus, onOpen }) {
  const span = viewEnd - viewStart;
  const left = ((item.start - viewStart) / span) * 100;
  const duration = Math.max(0, item.end - item.start);
  const widthPercent = Math.max(0, (duration / span) * 100);
  const slots = item.lane === "authors" || item.lane === "works" ? 3 : 2;
  const top = 14 + (hash(item.id) % slots) * 72;
  const Icon = laneIcon(item);
  const focused = item.id === focusedAuthorId || item.authorId === focusedAuthorId;
  return <button className={`timeline-item ${item.kind === "author" ? "author-item" : ""} ${item.kind === "work" ? "work-item" : ""} ${focused ? "focused" : ""}`} style={{ left: `${left}%`, top, width: duration > 1 ? `max(${item.kind === "author" ? 174 : 154}px, ${widthPercent}%)` : item.kind === "work" ? 166 : 178, "--lane-soft": LANE_TONES[item.lane].soft, "--lane-strong": LANE_TONES[item.lane].strong }} onClick={onOpen} onMouseEnter={() => onFocus(item.kind === "author" ? item.id : item.authorId || null)} onMouseLeave={() => onFocus(null)} title={`${item.title} · ${formatRange(item)}`}>{item.kind === "author" ? <WikiPortrait title={item.wikiTitle} className="timeline-cutout" /> : <span className="item-icon"><Icon size={21} /></span>}<span className="item-copy"><strong>{item.title}</strong><small>{formatRange(item)}</small></span></button>;
}

function TimelineApp({ timelineOnly, onToggleTimelineOnly, dark, onToggleDark }) {
  const appRef = useRef(null);
  const dragRef = useRef(null);
  const frameRef = useRef(null);
  const pendingRef = useRef(null);
  const [viewStart, setViewStart] = useState(1800);
  const [viewEnd, setViewEnd] = useState(2026);
  const [density, setDensity] = useState("balanced");
  const [enabledLanes, setEnabledLanes] = useState(new Set(LANE_ORDER));
  const [selectedAuthors, setSelectedAuthors] = useState(new Set(readJson(AUTHOR_STORAGE, ["shakespeare", "komensky", "austen", "dostoevsky", "kafka", "capek", "orwell", "tolkien", "coelho", "mornstajnova"])));
  const [customData, setCustomData] = useState(readJson(CUSTOM_STORAGE, { authors: [], works: [] }));
  const [exactWorks, setExactWorks] = useState(() => { const stored = readJson(EXACT_WORK_STORAGE, null); return stored ? new Set(stored) : null; });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [authorPicker, setAuthorPicker] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [periodMenu, setPeriodMenu] = useState(false);
  const [focusedAuthorId, setFocusedAuthorId] = useState(null);
  const deferredQuery = useDeferredValue(query);

  const authors = useMemo(() => [...AUTHORS, ...customData.authors], [customData]);
  const works = useMemo(() => [...WORKS, ...customData.works], [customData]);
  const periods = useMemo(() => [...PERIODS, ...EXTRA_PERIODS], []);
  const historyItems = useMemo(() => [...EVENTS, ...EXTRA_EVENTS, ...RULERS, ...FIGURES], []);
  const span = viewEnd - viewStart;
  const center = (viewStart + viewEnd) / 2;
  const zoom = spanToZoom(span);

  useEffect(() => localStorage.setItem(AUTHOR_STORAGE, JSON.stringify([...selectedAuthors])), [selectedAuthors]);
  useEffect(() => localStorage.setItem(CUSTOM_STORAGE, JSON.stringify(customData)), [customData]);

  const setRange = (start, end) => {
    const next = clampRange(start, end);
    setViewStart(next[0]);
    setViewEnd(next[1]);
  };
  const scheduleRange = (start, end) => {
    pendingRef.current = [start, end];
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      if (pendingRef.current) setRange(...pendingRef.current);
    });
  };

  const visibleItems = useMemo(() => {
    const threshold = DENSITY_MIN[density];
    const selectedAuthorItems = authors.filter((author) => selectedAuthors.has(author.id));
    const selectedWorks = works.filter((work) => selectedAuthors.has(work.authorId) && (!exactWorks || exactWorks.has(normalize(work.title))));
    return [...selectedAuthorItems, ...selectedWorks, ...historyItems].filter((item) => enabledLanes.has(item.lane) && item.importance >= threshold && item.end >= viewStart - span * .08 && item.start <= viewEnd + span * .08);
  }, [authors, works, historyItems, selectedAuthors, exactWorks, density, enabledLanes, viewStart, viewEnd, span]);
  const byLane = useMemo(() => {
    const map = new Map(LANE_ORDER.map((lane) => [lane, []]));
    visibleItems.forEach((item) => map.get(item.lane).push(item));
    map.forEach((items) => items.sort((a, b) => a.start - b.start || b.importance - a.importance));
    return map;
  }, [visibleItems]);
  const visiblePeriods = useMemo(() => periods.filter((period) => period.end >= viewStart && period.start <= viewEnd), [periods, viewStart, viewEnd]);
  const ticks = useMemo(() => Array.from({ length: 7 }, (_, index) => viewStart + span * index / 6), [viewStart, span]);
  const searchResults = useMemo(() => {
    const target = normalize(deferredQuery);
    if (!target) return [];
    return [...authors, ...works, ...historyItems].filter((item) => normalize(`${item.title} ${item.summary} ${(item.tags || []).join(" ")}`).includes(target)).sort((a, b) => b.importance - a.importance).slice(0, 8);
  }, [deferredQuery, authors, works, historyItems]);

  const focusItem = (item) => {
    const size = Math.max(30, item.end - item.start + 20);
    setRange(item.start - size * .35, item.end + size * .65);
    setDetail(item);
    setQuery("");
  };
  const onPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest("button,input,a")) return;
    dragRef.current = { x: event.clientX, start: viewStart, end: viewEnd, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("dragging");
  };
  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    const width = event.currentTarget.getBoundingClientRect().width;
    const delta = -(event.clientX - dragRef.current.x) / Math.max(width, 1) * (dragRef.current.end - dragRef.current.start);
    scheduleRange(dragRef.current.start + delta, dragRef.current.end + delta);
  };
  const endDrag = (event) => {
    if (!dragRef.current) return;
    try { event.currentTarget.releasePointerCapture(dragRef.current.pointerId); } catch {}
    dragRef.current = null;
    event.currentTarget.classList.remove("dragging");
  };
  const onWheel = (event) => {
    if (event.target.closest("button,input,a,.period-strip")) return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const nextSpan = Math.max(MIN_SPAN, Math.min(MAX_SPAN, span * Math.exp(event.deltaY * .0014)));
      const anchor = viewStart + span * ratio;
      setRange(anchor - nextSpan * ratio, anchor + nextSpan * (1 - ratio));
    } else if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) * .7) {
      event.preventDefault();
      const delta = (event.deltaX || event.deltaY) / Math.max(event.currentTarget.clientWidth, 1) * span;
      setRange(viewStart + delta, viewEnd + delta);
    }
  };

  const toggleLane = (lane) => {
    const next = new Set(enabledLanes);
    next.has(lane) ? next.delete(lane) : next.add(lane);
    setEnabledLanes(next);
  };
  const historyOnly = () => setEnabledLanes(new Set(["rulers", "czech", "world", "tech", "monuments", "figures"]));
  const literatureContext = () => setEnabledLanes(new Set(["authors", "works", "czech", "world", "tech", "figures"]));
  const applyImport = (entries, onlyExact, keepContext) => {
    const importedAuthors = [...new Map(entries.map((entry) => [entry.authorItem.id, entry.authorItem])).values()];
    const importedWorks = [...new Map(entries.map((entry) => [entry.workItem.id, entry.workItem])).values()];
    setCustomData({ authors: importedAuthors.filter((item) => !AUTHORS.some((author) => author.id === item.id)), works: importedWorks.filter((item) => !WORKS.some((work) => work.id === item.id)) });
    setSelectedAuthors(new Set(importedAuthors.map((item) => item.id)));
    if (onlyExact) {
      const titles = new Set(entries.map((entry) => normalize(entry.title)));
      setExactWorks(titles);
      localStorage.setItem(EXACT_WORK_STORAGE, JSON.stringify([...titles]));
    } else {
      setExactWorks(null);
      localStorage.removeItem(EXACT_WORK_STORAGE);
    }
    keepContext ? literatureContext() : setEnabledLanes(new Set(["authors", "works"]));
    setPersonalization(false);
    setRange(Math.min(...importedAuthors.map((item) => item.start)) - 20, Math.max(...importedWorks.map((item) => item.start)) + 20);
  };
  const resetPersonalization = () => {
    setCustomData({ authors: [], works: [] });
    setSelectedAuthors(new Set(DEFAULT_AUTHOR_IDS));
    setExactWorks(null);
    localStorage.removeItem(CUSTOM_STORAGE);
    localStorage.removeItem(EXACT_WORK_STORAGE);
  };
  const fullscreen = async () => {
    try { document.fullscreenElement ? await document.exitFullscreen() : await appRef.current.requestFullscreen(); } catch {}
  };

  return (
    <div ref={appRef} className={`timeline-app ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}>
      <aside className={`app-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileFilters ? "mobile-open" : ""}`}>
        <div className="sidebar-brand"><span><Landmark /></span><div><strong>Časovrstvy</strong><small>historie v souvislostech</small></div><button className="icon-button" onClick={() => setSidebarCollapsed((value) => !value)}>{sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button><button className="icon-button mobile-close" onClick={() => setMobileFilters(false)}><X /></button></div>
        <div className="sidebar-content">
          <section><div className="sidebar-heading"><span>Množství informací</span><small>Kolik detailů má osa ukázat</small></div><div className="density-list">{Object.entries(DENSITY_COPY).map(([key, copy]) => <button key={key} className={density === key ? "active" : ""} onClick={() => setDensity(key)}><i>{density === key && <Check size={14} />}</i><span><strong>{copy[0]}</strong><small>{copy[1]}</small></span></button>)}</div></section>
          <section><div className="sidebar-heading"><span>Tematické vrstvy</span><small>Vypnutý řádek úplně zmizí</small></div><div className="lane-toggle-list">{LANE_ORDER.map((lane) => { const Icon = LANE_ICONS[lane]; const active = enabledLanes.has(lane); return <button key={lane} className={active ? "active" : ""} onClick={() => toggleLane(lane)}><span style={{ color: LANE_TONES[lane].strong, background: LANE_TONES[lane].soft }}><Icon size={17} /></span><strong>{LANE_META[lane].label}</strong><i>{active ? "ON" : "OFF"}</i></button>; })}</div><div className="quick-filter-row"><button onClick={() => setEnabledLanes(new Set(LANE_ORDER))}>Všechny</button><button onClick={historyOnly}>Jen historie</button><button onClick={literatureContext}>Literatura + kontext</button></div></section>
          <section><div className="sidebar-heading"><span>Literatura</span><small>{selectedAuthors.size} vybraných autorů</small></div><button className="sidebar-action" onClick={() => setAuthorPicker(true)}><Users size={19} /><span><strong>Vybrat vlastní autory</strong><small>Katalog více než 100 autorů</small></span><ChevronRight size={16} /></button><button className="sidebar-action accent" onClick={() => setPersonalization(true)}><Upload size={19} /><span><strong>Nahrát vlastní seznam</strong><small>PDF, DOCX, TXT, CSV nebo JSON</small></span><ChevronRight size={16} /></button>{(customData.authors.length > 0 || exactWorks) && <button className="reset-personalization" onClick={resetPersonalization}>Zrušit personalizaci</button>}</section>
          <section><div className="sidebar-heading"><span>Vlastní období</span><small>Zadej přesný rozsah</small></div><form className="custom-range" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setRange(form.get("from"), form.get("to")); }}><label>Od<input name="from" type="number" defaultValue={Math.round(viewStart)} /></label><label>Do<input name="to" type="number" defaultValue={Math.round(viewEnd)} /></label><button type="submit">Použít</button></form></section>
        </div>
      </aside>
      {mobileFilters && <button className="mobile-overlay" onClick={() => setMobileFilters(false)} />}

      <div className="timeline-workspace">
        <div className="timeline-toolbar"><button className="mobile-filter-button" onClick={() => setMobileFilters(true)}><Filter size={18} /> Filtry</button><label className="app-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat autora, dílo nebo událost…" /></label>{searchResults.length > 0 && <div className="search-results">{searchResults.map((item) => { const Icon = laneIcon(item); return <button key={item.id} onClick={() => focusItem(item)}><span style={{ background: LANE_TONES[item.lane].soft, color: LANE_TONES[item.lane].strong }}><Icon size={16} /></span><div><strong>{item.title}</strong><small>{LANE_META[item.lane].label} · {formatRange(item)}</small></div></button>; })}</div>}<button className="toolbar-button" onClick={() => setPeriodMenu((value) => !value)}><CalendarDays size={17} /> Období <ChevronDown size={15} /></button><button className="icon-button" onClick={onToggleDark}>{dark ? <Sun /> : <Moon />}</button><button className="toolbar-button" onClick={onToggleTimelineOnly}><Layers3 size={17} /> {timelineOnly ? "Celá stránka" : "Pouze osa"}</button><button className="icon-button" onClick={fullscreen}><Maximize2 /></button></div>
        {periodMenu && <div className="period-menu">{PRESETS.map(([label, start, end]) => <button key={label} onClick={() => { setRange(start, end); setPeriodMenu(false); }}>{label}<small>{formatYear(start)}–{formatYear(end)}</small></button>)}</div>}
        <div className="period-strip"><div className="period-strip-label">Historická období</div><div className="period-track">{visiblePeriods.map((period) => <button key={period.id} style={{ left: `${(period.start - viewStart) / span * 100}%`, width: `max(72px, ${(period.end - period.start) / span * 100}%)`, background: `${period.color}22`, borderColor: `${period.color}66`, color: period.color }} onClick={() => setRange(period.start, period.end)}><strong>{period.title}</strong><small>{formatYear(period.start)}–{formatYear(period.end)}</small></button>)}</div></div>
        <div className="timeline-scroll"><div className="timeline-grid" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={onWheel}><div className="time-axis">{ticks.map((tick) => <span key={tick} style={{ left: `${(tick - viewStart) / span * 100}%` }}><b>{formatYear(tick)}</b></span>)}</div>{LANE_ORDER.filter((lane) => enabledLanes.has(lane)).map((lane) => { const Icon = LANE_ICONS[lane]; const items = byLane.get(lane); return <section key={lane} className="timeline-lane" style={{ "--lane-soft": LANE_TONES[lane].soft, "--lane-strong": LANE_TONES[lane].strong }}><header><span><Icon size={18} /></span><div><strong>{LANE_META[lane].label}</strong><small>{items.length} viditelných</small></div></header><div className="lane-canvas">{ticks.map((tick) => <i key={tick} className="grid-line" style={{ left: `${(tick - viewStart) / span * 100}%` }} />)}{items.map((item) => <TimelineItemCard key={item.id} item={item} viewStart={viewStart} viewEnd={viewEnd} focusedAuthorId={focusedAuthorId} onFocus={setFocusedAuthorId} onOpen={() => setDetail(item)} />)}</div></section>; })}</div></div>
        <div className="timeline-controls"><div className="range-readout"><span>{formatYear(viewStart)}</span><strong>{formatYear(center)}</strong><span>{formatYear(viewEnd)}</span></div><div className="control-row"><button className="icon-button" onClick={() => { const nextSpan = zoomToSpan(Math.min(100, zoom + 8)); setRange(center - nextSpan / 2, center + nextSpan / 2); }}><Plus /></button><input className="zoom-slider" type="range" min="0" max="100" value={zoom} onChange={(event) => { const nextSpan = zoomToSpan(Number(event.target.value)); setRange(center - nextSpan / 2, center + nextSpan / 2); }} /><button className="icon-button" onClick={() => { const nextSpan = zoomToSpan(Math.max(0, zoom - 8)); setRange(center - nextSpan / 2, center + nextSpan / 2); }}><Minus /></button><div className="pan-control"><MoveHorizontal size={16} /><input type="range" min={MIN_YEAR} max={MAX_YEAR} value={Math.round(center)} onChange={(event) => { const nextCenter = Number(event.target.value); setRange(nextCenter - span / 2, nextCenter + span / 2); }} /></div><button className="overview-button" onClick={() => setRange(1000, 2026)}><RotateCcw size={16} /> Oddálit na přehled</button></div><div className="preset-row">{PRESETS.map(([label, start, end]) => <button key={label} onClick={() => setRange(start, end)}>{label}</button>)}</div></div>
      </div>

      {detail && <DetailPanel item={detail} onClose={() => setDetail(null)} />}
      {authorPicker && <AuthorPicker authors={authors} selected={selectedAuthors} onChange={setSelectedAuthors} onClose={() => setAuthorPicker(false)} />}
      {personalization && <PersonalizationModal authors={authors} works={works} onApply={applyImport} onClose={() => setPersonalization(false)} />}
    </div>
  );
}

export default function AppRedesign() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_STORAGE) === "dark");
  const [timelineOnly, setTimelineOnly] = useState(false);
  const timelineRef = useRef(null);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE, dark ? "dark" : "light");
  }, [dark]);
  const scrollToTimeline = () => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className={`site-shell ${timelineOnly ? "timeline-only-page" : ""}`}>
      {!timelineOnly && <><nav className="site-nav"><a href="#top" className="site-brand"><span><Landmark /></span><strong>Časovrstvy</strong></a><div className="site-links"><a href="#how">Jak to funguje</a><a href="#personalize">Personalizace</a><a href="#timeline">Časová osa</a><button className="theme-pill" onClick={() => setDark((value) => !value)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><button className="nav-cta" onClick={scrollToTimeline}>Otevřít osu</button></div><button className="nav-mobile-cta" onClick={scrollToTimeline}>Otevřít osu</button></nav><main id="top"><section className="hero-section-redesign"><div className="hero-copy-redesign"><span className="hero-kicker"><Sparkles size={16} /> Interaktivní vzdělávací projekt</span><h1>Historie a literatura <em>v souvislostech.</em></h1><p>Objevuj autory, díla, vládce, události, vynálezy a stavby v jedné stabilní časové ose. Bez chaosu, bez přeskakování a s jasným kontextem.</p><div className="hero-actions-redesign"><button className="primary-button" onClick={scrollToTimeline}>Začít objevovat <ArrowDown size={18} /></button><a href="#how">Zjistit více</a></div><div className="hero-stats"><span><b>100+</b> autorů</span><span><b>Stovky</b> událostí</span><span><b>3</b> úrovně podrobnosti</span></div></div><HeroPreview /></section><section className="benefit-strip"><article><span><Layers3 /></span><div><strong>Kontextuální učení</strong><p>Literatura, dějepis, věda a kultura na jedné ose.</p></div></article><article><span><MoveHorizontal /></span><div><strong>Stabilní navigace</strong><p>Všechny řádky se posouvají společně a plynule.</p></div></article><article><span><SlidersHorizontal /></span><div><strong>Plná kontrola</strong><p>Zapni jen vrstvy a množství dat, které potřebuješ.</p></div></article><article><span><GraduationCap /></span><div><strong>Pro školu i samostudium</strong><p>Rychlý přehled i podrobná příprava na maturitu.</p></div></article></section><section id="how" className="how-section-redesign"><div className="section-title"><span>Jak to funguje</span><h2>Nejdřív si nastav pohled. Potom objevuj souvislosti.</h2></div><div className="steps-grid"><article><b>1</b><CalendarDays /><h3>Vyber období</h3><p>Zaměř se na starověk, renesanci, první republiku nebo vlastní rozsah.</p></article><article><b>2</b><Filter /><h3>Zapni vrstvy</h3><p>Autoři, díla, české dějiny, svět, vynálezy, stavby a osobnosti.</p></article><article><b>3</b><Search /><h3>Otevři detail</h3><p>Klikni na kartu a zobraz fotografii, popis, roky a odkaz na zdroj.</p></article></div></section><section id="personalize" className="personalize-section-redesign"><div className="personalize-copy"><span>Tvůj obsah, tvoje osa</span><h2>Použij hotový katalog, nebo nahraj vlastní seznam.</h2><p>Základní verze funguje ihned. Student nebo učitel ale může nahrát školní seznam a vytvořit vlastní literární vrstvu.</p></div><div className="personalize-cards"><article><div><BookOpen /></div><span>Základní katalog</span><h3>Více než 100 autorů a známých děl</h3><p>Česká i světová literatura od starověku po současnost, doplněná historickým kontextem.</p><button onClick={scrollToTimeline}>Použít katalog</button></article><article className="featured"><div><Upload /></div><span>Vlastní seznam</span><h3>PDF, DOCX, TXT, CSV nebo JSON</h3><p>Aplikace rozpozná autory a díla, ověří neznámé položky a připraví personalizovaný pohled.</p><button onClick={scrollToTimeline}>Otevřít personalizaci v aplikaci</button></article></div></section></main></>}
      <section id="timeline" ref={timelineRef} className="timeline-section-redesign">{!timelineOnly && <div className="timeline-intro-redesign"><span>Interaktivní aplikace</span><h2>Poskládej si vlastní pohled na dějiny.</h2><p>Vypnuté řádky skutečně zmizí, karty zůstávají na stabilní pozici a osa se pohybuje jako jeden celek.</p></div>}<TimelineApp timelineOnly={timelineOnly} onToggleTimelineOnly={() => setTimelineOnly((value) => !value)} dark={dark} onToggleDark={() => setDark((value) => !value)} />{!timelineOnly && <div className="fullscreen-note"><div><Maximize2 /><span><strong>Potřebuješ více prostoru?</strong><small>V aplikaci klikni na ikonu celé obrazovky. Filtry, zoom i detaily zůstanou funkční.</small></span></div><button onClick={scrollToTimeline}>Přejít k ovládání osy</button></div>}</section>
      {!timelineOnly && <footer className="site-footer"><a href="#top" className="site-brand"><span><Landmark /></span><strong>Časovrstvy</strong></a><p>Veřejná vzdělávací časová osa pro studenty, učitele a všechny zvídavé návštěvníky.</p><small>© 2026 Časovrstvy</small></footer>}
    </div>
  );
}
