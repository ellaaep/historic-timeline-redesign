import {
  ArrowDown,
  BookOpen,
  CalendarRange,
  Castle,
  Check,
  ChevronDown,
  Crown,
  ExternalLink,
  Eye,
  Focus,
  Globe2,
  GraduationCap,
  Landmark,
  Layers3,
  Lightbulb,
  LoaderCircle,
  Maximize2,
  Menu,
  Minus,
  Moon,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
const HISTORY_MIN = -12000;
const HISTORY_MAX = CURRENT_YEAR;
const MIN_SPAN = 6;
const AUTHOR_STORAGE = "casovrstvy-redesign-authors-v2";
const CUSTOM_STORAGE = "casovrstvy-redesign-custom-v2";
const THEME_STORAGE = "casovrstvy-redesign-theme";
const DENSITY_STORAGE = "casovrstvy-redesign-density";

type Density = "essentials" | "balanced" | "complete";

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

const LANE_HEIGHTS: Record<LaneId, number> = {
  authors: 190,
  works: 168,
  rulers: 142,
  czech: 162,
  world: 162,
  tech: 162,
  monuments: 162,
  figures: 142,
};

const laneIcons: Record<LaneId, typeof Users> = {
  authors: Users,
  works: BookOpen,
  rulers: Crown,
  czech: Landmark,
  world: Globe2,
  tech: Lightbulb,
  monuments: Castle,
  figures: UserRound,
};

interface WikiMeta {
  image?: string;
  extract?: string;
  url?: string;
  title?: string;
  qid?: string;
}

interface CustomData {
  authors: TimelineItem[];
  works: TimelineItem[];
}

interface LayoutEntry {
  item: TimelineItem;
  left: number;
  top: number;
  width: number;
  height: number;
  row: number;
  pointX: number;
}

const wikiMemory = new Map<string, WikiMeta>();
let wikiDisk: Record<string, WikiMeta> = {};
try {
  wikiDisk = JSON.parse(localStorage.getItem("casovrstvy-redesign-wiki-v2") || "{}");
  Object.entries(wikiDisk).forEach(([key, value]) => wikiMemory.set(key, value));
} catch {
  wikiDisk = {};
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const wikiUrl = (title: string) =>
  `https://cs.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

const formatYear = (year: number) => {
  const rounded = Math.round(year);
  return rounded < 0
    ? `${Math.abs(rounded).toLocaleString("cs-CZ")} př. n. l.`
    : String(rounded);
};

const formatRange = (start: number, end: number, living = false) => {
  if (living) return `${formatYear(start)}–dnes`;
  if (Math.round(start) === Math.round(end)) return formatYear(start);
  return `${formatYear(start)}–${formatYear(end)}`;
};

const getNiceStep = (span: number) => {
  const rough = span / 8;
  const power = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const normalized = rough / power;
  if (normalized <= 1) return power;
  if (normalized <= 2) return power * 2;
  if (normalized <= 5) return power * 5;
  return power * 10;
};

const claimYear = (entity: Record<string, any>, property: string) => {
  const value = entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time;
  if (!value) return null;
  const match = String(value).match(/^([+-]\d+)/);
  return match ? Number(match[1]) : null;
};

async function fetchWikiMeta(title: string): Promise<WikiMeta> {
  const key = title.trim();
  const cached = wikiMemory.get(key);
  if (cached) return cached;

  const attemptSummary = async (lang: "cs" | "en") => {
    try {
      const response = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          key.replace(/ /g, "_"),
        )}`,
      );
      if (!response.ok) return null;
      const data = await response.json();
      return {
        image: data.thumbnail?.source || data.originalimage?.source,
        extract: data.extract,
        url: data.content_urls?.desktop?.page,
        title: data.title,
        qid: data.wikibase_item,
      } as WikiMeta;
    } catch {
      return null;
    }
  };

  let meta = (await attemptSummary("cs")) || (await attemptSummary("en"));

  if (!meta?.image) {
    try {
      const url = new URL("https://cs.wikipedia.org/w/api.php");
      Object.entries({
        action: "query",
        generator: "search",
        gsrsearch: key,
        gsrnamespace: "0",
        gsrlimit: "5",
        prop: "pageimages|pageprops|info|extracts",
        piprop: "thumbnail|original",
        pithumbsize: "700",
        inprop: "url",
        exintro: "1",
        explaintext: "1",
        format: "json",
        formatversion: "2",
        origin: "*",
      }).forEach(([name, value]) => url.searchParams.set(name, value));
      const response = await fetch(url);
      const pages = response.ok ? (await response.json()).query?.pages || [] : [];
      const page = pages.find((candidate: any) => candidate.thumbnail?.source) || pages[0];
      if (page) {
        meta = {
          image: page.thumbnail?.source || page.original?.source,
          extract: page.extract,
          url: page.fullurl,
          title: page.title,
          qid: page.pageprops?.wikibase_item,
        };
      }
    } catch {
      // The visual fallback below is intentional.
    }
  }

  const result = meta || { title: key, url: wikiUrl(key) };
  wikiMemory.set(key, result);
  wikiDisk[key] = result;
  try {
    localStorage.setItem("casovrstvy-redesign-wiki-v2", JSON.stringify(wikiDisk));
  } catch {
    // Storage can be unavailable in private browsing.
  }
  return result;
}

function WikiImage({ title, alt = "" }: { title: string; alt?: string }) {
  const [meta, setMeta] = useState<WikiMeta | null>(() => wikiMemory.get(title) || null);

  useEffect(() => {
    let alive = true;
    if (!meta) {
      fetchWikiMeta(title).then((next) => {
        if (alive) setMeta(next);
      });
    }
    return () => {
      alive = false;
    };
  }, [meta, title]);

  if (meta?.image) {
    return <img src={meta.image} alt={alt} loading="lazy" referrerPolicy="no-referrer" />;
  }

  return <span className="image-fallback">{title.trim().slice(0, 1)}</span>;
}

function loadSelectedAuthors() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTHOR_STORAGE) || "null");
    if (Array.isArray(parsed) && parsed.length) return new Set<string>(parsed);
  } catch {
    // Keep the curated default.
  }
  return new Set(DEFAULT_AUTHOR_IDS);
}

function loadCustomData(): CustomData {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_STORAGE) || "null");
    if (parsed?.authors && parsed?.works) return parsed;
  } catch {
    // Keep an empty custom catalog.
  }
  return { authors: [], works: [] };
}

function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const timelineSectionRef = useRef<HTMLElement>(null);
  const timelineFrameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<null | { x: number; start: number; end: number; pointerId: number }>(null);

  const [dark, setDark] = useState(() => localStorage.getItem(THEME_STORAGE) === "dark");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timelineOnly, setTimelineOnly] = useState(false);
  const [viewStart, setViewStart] = useState(1350);
  const [viewEnd, setViewEnd] = useState(HISTORY_MAX);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [query, setQuery] = useState("");
  const [crosshairX, setCrosshairX] = useState(0.54);
  const [detail, setDetail] = useState<TimelineItem | null>(null);
  const [focusedAuthorId, setFocusedAuthorId] = useState<string | null>("capek");
  const [authorPickerOpen, setAuthorPickerOpen] = useState(false);
  const [authorSearch, setAuthorSearch] = useState("");
  const [importName, setImportName] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(loadSelectedAuthors);
  const [customData, setCustomData] = useState<CustomData>(loadCustomData);
  const [density, setDensity] = useState<Density>(() => {
    const stored = localStorage.getItem(DENSITY_STORAGE);
    return stored === "essentials" || stored === "complete" ? stored : "balanced";
  });
  const [eraMenuOpen, setEraMenuOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("1350");
  const [customTo, setCustomTo] = useState(String(HISTORY_MAX));
  const [filters, setFilters] = useState<Record<LaneId, boolean>>({
    authors: true,
    works: true,
    rulers: true,
    czech: true,
    world: true,
    tech: true,
    monuments: true,
    figures: true,
  });

  const span = viewEnd - viewStart;
  const crosshairYear = viewStart + span * crosshairX;
  const allPeriods = useMemo<Period[]>(() => [...PERIODS, ...EXTRA_PERIODS], []);
  const allEvents = useMemo<TimelineItem[]>(() => [...EVENTS, ...EXTRA_EVENTS], []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_STORAGE, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem(AUTHOR_STORAGE, JSON.stringify([...selectedAuthors]));
  }, [selectedAuthors]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_STORAGE, JSON.stringify(customData));
  }, [customData]);

  useEffect(() => {
    localStorage.setItem(DENSITY_STORAGE, density);
  }, [density]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const allAuthors = useMemo(
    () => [...AUTHORS, ...customData.authors],
    [customData.authors],
  );
  const allWorks = useMemo(() => [...WORKS, ...customData.works], [customData.works]);

  const laneTops = useMemo(() => {
    const result = {} as Record<LaneId, number>;
    let top = 24;
    for (const lane of LANE_ORDER) {
      result[lane] = top;
      top += LANE_HEIGHTS[lane];
    }
    return result;
  }, []);

  const contentHeight =
    24 + LANE_ORDER.reduce((total, lane) => total + LANE_HEIGHTS[lane], 0) + 34;

  const clampRange = useCallback((start: number, end: number) => {
    let nextSpan = Math.max(MIN_SPAN, Math.min(HISTORY_MAX - HISTORY_MIN, end - start));
    const center = (start + end) / 2;
    start = center - nextSpan / 2;
    end = center + nextSpan / 2;
    if (start < HISTORY_MIN) {
      end += HISTORY_MIN - start;
      start = HISTORY_MIN;
    }
    if (end > HISTORY_MAX) {
      start -= end - HISTORY_MAX;
      end = HISTORY_MAX;
    }
    nextSpan = end - start;
    if (nextSpan < MIN_SPAN) end = start + MIN_SPAN;
    setViewStart(start);
    setViewEnd(end);
    setCustomFrom(String(Math.round(start)));
    setCustomTo(String(Math.round(end)));
  }, []);

  const zoomAt = useCallback(
    (factor: number, ratio = 0.5) => {
      const current = viewEnd - viewStart;
      const next = Math.max(MIN_SPAN, Math.min(HISTORY_MAX - HISTORY_MIN, current * factor));
      const anchor = viewStart + current * ratio;
      clampRange(anchor - next * ratio, anchor + next * (1 - ratio));
    },
    [clampRange, viewEnd, viewStart],
  );

  const scrollToTimeline = () => {
    timelineSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyCustomRange = () => {
    const start = Number(customFrom);
    const end = Number(customTo);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
    clampRange(start, end);
    setEraMenuOpen(false);
  };

  const applyPeriod = (period: Period) => {
    clampRange(period.start, period.end);
    setEraMenuOpen(false);
  };

  const visibleSelectedAuthors = useMemo(
    () => allAuthors.filter((item) => selectedAuthors.has(item.id)),
    [allAuthors, selectedAuthors],
  );

  const sourceByLane = useMemo<Record<LaneId, TimelineItem[]>>(
    () => ({
      authors: visibleSelectedAuthors,
      works: allWorks.filter((item) => selectedAuthors.has(item.authorId || "")),
      rulers: RULERS,
      czech: allEvents.filter((item) => item.lane === "czech"),
      world: allEvents.filter((item) => item.lane === "world"),
      tech: allEvents.filter((item) => item.lane === "tech"),
      monuments: allEvents.filter((item) => item.lane === "monuments"),
      figures: [...FIGURES, ...allEvents.filter((item) => item.lane === "figures")],
    }),
    [allEvents, allWorks, selectedAuthors, visibleSelectedAuthors],
  );

  const searchNormalized = normalize(query);

  const threshold = useMemo(() => {
    if (density === "essentials") return 5;
    if (density === "complete") return 1;
    return span > 5000 ? 5 : span > 1800 ? 4 : span > 700 ? 3 : 1;
  }, [density, span]);

  const layoutLane = useCallback(
    (lane: LaneId) => {
      if (!filters[lane]) return [] as LayoutEntry[];
      const height = LANE_HEIGHTS[lane];
      const top = laneTops[lane];
      const isLiterature = lane === "authors" || lane === "works";
      const isPortraitLane = lane === "authors" || lane === "rulers" || lane === "figures";
      const rowHeight = isLiterature ? 38 : 43;
      const rowCount = Math.max(1, Math.floor((height - 48) / rowHeight));
      const rowEnds = Array.from({ length: rowCount }, () => -Infinity);
      const items = sourceByLane[lane]
        .filter((item) => item.end >= viewStart && item.start <= viewEnd)
        .filter((item) => isLiterature || item.importance >= threshold)
        .filter((item) => {
          if (!searchNormalized) return true;
          return normalize(`${item.title} ${item.summary} ${(item.tags || []).join(" ")}`).includes(
            searchNormalized,
          );
        })
        .sort((a, b) => a.start - b.start || b.importance - a.importance);

      return items.map((item) => {
        const clippedStart = Math.max(item.start, viewStart);
        const clippedEnd = Math.min(item.end, viewEnd);
        const startX = ((clippedStart - viewStart) / span) * viewportWidth;
        const endX = ((clippedEnd - viewStart) / span) * viewportWidth;
        const pointX = (((item.start + item.end) / 2 - viewStart) / span) * viewportWidth;
        const durationWidth = Math.max(0, endX - startX);
        const duration = item.end - item.start;
        const overview = span > 700;
        const titleWidth = Math.min(overview ? 180 : 260, 76 + item.title.length * 5.1);
        let width = 0;

        if (item.kind === "author") {
          width = Math.min(360, Math.max(148, durationWidth));
        } else if (item.kind === "work") {
          width = Math.min(220, Math.max(96, titleWidth));
        } else if (isPortraitLane) {
          width = Math.min(310, Math.max(86, durationWidth));
        } else if (duration > 1) {
          width = Math.min(viewportWidth - 130, Math.max(70, durationWidth));
        } else {
          width = overview && item.importance < 5 ? 44 : Math.min(210, Math.max(82, titleWidth));
        }

        const desiredLeft = duration > 1 || item.kind === "author"
          ? startX
          : pointX - width / 2;
        const left = Math.max(112, Math.min(viewportWidth - width - 18, desiredLeft));

        let row = rowEnds.findIndex((right) => left > right + 7);
        if (row < 0) {
          row = rowEnds.reduce(
            (best, value, index) => (value < rowEnds[best] ? index : best),
            0,
          );
        }
        rowEnds[row] = Math.max(rowEnds[row], left + width);

        return {
          item,
          left,
          top: top + 36 + row * rowHeight,
          width,
          height: isLiterature ? 32 : 38,
          row,
          pointX,
        };
      });
    },
    [filters, laneTops, searchNormalized, sourceByLane, span, threshold, viewEnd, viewStart, viewportWidth],
  );

  const layouts = useMemo(() => {
    const result = {} as Record<LaneId, LayoutEntry[]>;
    LANE_ORDER.forEach((lane) => {
      result[lane] = layoutLane(lane);
    });
    return result;
  }, [layoutLane]);

  const relationLines = useMemo(() => {
    if (!focusedAuthorId) return [];
    const authorEntry = layouts.authors.find((entry) => entry.item.id === focusedAuthorId);
    if (!authorEntry) return [];
    return layouts.works
      .filter((entry) => entry.item.authorId === focusedAuthorId)
      .map((workEntry) => ({
        id: workEntry.item.id,
        x1: authorEntry.left + authorEntry.width / 2,
        y1: authorEntry.top + authorEntry.height,
        x2: workEntry.left + workEntry.width / 2,
        y2: workEntry.top,
      }));
  }, [focusedAuthorId, layouts.authors, layouts.works]);

  const gridYears = useMemo(() => {
    const step = getNiceStep(span);
    const first = Math.ceil(viewStart / step) * step;
    const result: number[] = [];
    for (let year = first; year <= viewEnd; year += step) result.push(year);
    return result;
  }, [span, viewEnd, viewStart]);

  const visiblePeriods = allPeriods.filter(
    (period) => period.end >= viewStart && period.start <= viewEnd,
  );

  const importAuthor = async () => {
    const requested = importName.trim();
    if (!requested) return;
    setImporting(true);
    setImportStatus("Hledám autora na Wikipedii…");
    try {
      const searchUrl = new URL("https://cs.wikipedia.org/w/api.php");
      Object.entries({
        action: "query",
        generator: "search",
        gsrsearch: requested,
        gsrnamespace: "0",
        gsrlimit: "1",
        prop: "pageprops|pageimages|info",
        piprop: "thumbnail|original",
        pithumbsize: "700",
        inprop: "url",
        format: "json",
        formatversion: "2",
        origin: "*",
      }).forEach(([key, value]) => searchUrl.searchParams.set(key, value));
      const pageResponse = await fetch(searchUrl);
      const page = (await pageResponse.json()).query?.pages?.[0];
      const qid = page?.pageprops?.wikibase_item;
      if (!page || !qid) throw new Error("Autor nebyl nalezen.");

      const entityResponse = await fetch(
        `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
      );
      const entity = (await entityResponse.json()).entities?.[qid];
      const birth = claimYear(entity, "P569");
      const death = claimYear(entity, "P570");
      if (!birth) throw new Error("U autora se nepodařilo zjistit rok narození.");
      const authorTitle = page.title || requested;
      const id = `custom-${normalize(authorTitle).replace(/ /g, "-")}`;
      const customAuthor: TimelineItem = {
        id,
        title: authorTitle,
        start: birth,
        end: death || CURRENT_YEAR,
        living: !death,
        lane: "authors",
        kind: "author",
        importance: 5,
        wikiTitle: authorTitle,
        summary: `Autor načtený z Wikipedie a Wikidat. ${formatRange(birth, death || CURRENT_YEAR, !death)}.`,
      };

      const workIds = (entity?.claims?.P800 || [])
        .map((claim: any) => claim?.mainsnak?.datavalue?.value?.id)
        .filter(Boolean)
        .slice(0, 8);
      let importedWorks: TimelineItem[] = [];

      if (workIds.length) {
        const worksUrl = new URL("https://www.wikidata.org/w/api.php");
        Object.entries({
          action: "wbgetentities",
          ids: workIds.join("|"),
          props: "labels|claims",
          languages: "cs|en",
          languagefallback: "1",
          format: "json",
          origin: "*",
        }).forEach(([key, value]) => worksUrl.searchParams.set(key, value));
        const worksResponse = await fetch(worksUrl);
        const entities = (await worksResponse.json()).entities || {};
        importedWorks = Object.values(entities)
          .map((workEntity: any) => {
            const title = workEntity.labels?.cs?.value || workEntity.labels?.en?.value;
            const year = claimYear(workEntity, "P577");
            if (!title || !year) return null;
            return {
              id: `${id}-${workEntity.id.toLowerCase()}`,
              authorId: id,
              title,
              start: year,
              end: year,
              lane: "works",
              kind: "work",
              importance: 4,
              wikiTitle: title,
              summary: `Významné dílo autora ${authorTitle}.`,
            } as TimelineItem;
          })
          .filter(Boolean)
          .sort((a: TimelineItem, b: TimelineItem) => a.start - b.start)
          .slice(0, 5) as TimelineItem[];
      }

      setCustomData((current) => ({
        authors: [...current.authors.filter((authorItem) => authorItem.id !== id), customAuthor],
        works: [
          ...current.works.filter((workItem) => workItem.authorId !== id),
          ...importedWorks,
        ],
      }));
      setSelectedAuthors((current) => new Set([...current, id]));
      setFocusedAuthorId(id);
      setImportStatus(
        importedWorks.length
          ? `Přidáno: ${authorTitle} a ${importedWorks.length} známých děl.`
          : `Přidáno: ${authorTitle}. Wikidata nenabídla datovaná významná díla.`,
      );
      setImportName("");
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : "Import se nepodařil.");
    } finally {
      setImporting(false);
    }
  };

  const toggleAuthor = (id: string) => {
    setSelectedAuthors((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await timelineFrameRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // Some browsers can deny fullscreen without user permission.
    }
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button,input,a,.dialog,.detail-panel,.period-strip")) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.75) {
      const delta =
        (event.deltaX + (event.shiftKey ? event.deltaY : 0)) / Math.max(rect.width, 1) * span;
      clampRange(viewStart + delta, viewEnd + delta);
    } else {
      zoomAt(Math.exp(event.deltaY * 0.00125), ratio);
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button,input,a,.detail-panel,.period-strip")) return;
    dragRef.current = {
      x: event.clientX,
      start: viewStart,
      end: viewEnd,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-dragging");
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCrosshairX(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)));
    const drag = dragRef.current;
    if (!drag) return;
    const years = -(event.clientX - drag.x) / Math.max(rect.width, 1) * (drag.end - drag.start);
    clampRange(drag.start + years, drag.end + years);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    try {
      event.currentTarget.releasePointerCapture(dragRef.current.pointerId);
    } catch {
      // Pointer capture might already be released.
    }
    dragRef.current = null;
    event.currentTarget.classList.remove("is-dragging");
  };

  const renderCard = (entry: LayoutEntry) => {
    const { item, left, top, width } = entry;
    const laneColor = LANE_META[item.lane].color;
    const duration = item.end - item.start;
    const isWar = (item.tags || []).includes("válka");
    const isFocused = item.id === focusedAuthorId || item.authorId === focusedAuthorId;
    const compact = width < 72;
    const classNames = [
      "timeline-card",
      `kind-${item.kind}`,
      `lane-${item.lane}`,
      duration > 1 ? "duration" : "point",
      isWar ? "is-war" : "",
      isFocused ? "is-focused" : "",
      compact ? "is-compact" : "",
      item.living ? "is-living" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        key={item.id}
        className={classNames}
        style={{
          left,
          top,
          width,
          height: entry.height,
          "--lane-color": laneColor,
        } as React.CSSProperties}
        onMouseEnter={() => {
          if (item.kind === "author") setFocusedAuthorId(item.id);
          if (item.kind === "work" && item.authorId) setFocusedAuthorId(item.authorId);
        }}
        onFocus={() => {
          if (item.kind === "author") setFocusedAuthorId(item.id);
          if (item.kind === "work" && item.authorId) setFocusedAuthorId(item.authorId);
        }}
        onClick={() => setDetail(item)}
        title={`${item.title} · ${formatRange(item.start, item.end, item.living)}`}
      >
        <span className="card-image">
          <WikiImage title={item.wikiTitle} alt={item.title} />
        </span>
        <span className="card-copy">
          <strong>{item.title}</strong>
          <small>{formatRange(item.start, item.end, item.living)}</small>
        </span>
      </button>
    );
  };

  return (
    <div className="site-page">
      {!timelineOnly && (
        <>
          <nav className="landing-nav">
            <a className="landing-brand" href="#top" aria-label="Časovrstvy domů">
              <span><Landmark /></span>
              <strong>Časovrstvy</strong>
            </a>
            <div className="landing-nav-links">
              <a href="#how">Jak to funguje</a>
              <a href="#timeline">Časová osa</a>
              <button onClick={() => setDark((value) => !value)} title="Změnit barevný režim">
                {dark ? <Sun /> : <Moon />}
              </button>
              <button className="landing-nav-cta" onClick={scrollToTimeline}>Otevřít osu</button>
            </div>
          </nav>

          <main id="top" className="landing-main">
            <section className="hero-section">
              <div className="hero-copy">
                <span className="eyebrow"><Sparkles /> INTERAKTIVNÍ VZDĚLÁVACÍ ARCHIV</span>
                <h1>Vše od historie po literaturu <em>na jednom místě.</em></h1>
                <p>
                  Propoj si autory, knihy, vládce, války, vynálezy, stavby i umělecké směry
                  v jedné časové ose. Získáš kontext, který se z učebnice často ztrácí.
                </p>
                <div className="hero-actions">
                  <button className="primary-cta" onClick={scrollToTimeline}>
                    Prozkoumat časovou osu <ArrowDown />
                  </button>
                  <a className="secondary-cta" href="#how">Jak projekt funguje</a>
                </div>
                <div className="hero-proof">
                  <span><strong>8</strong> tematických vrstev</span>
                  <span><strong>3</strong> úrovně podrobnosti</span>
                  <span><strong>12 000+</strong> let souvislostí</span>
                </div>
              </div>

              <div className="hero-visual" aria-label="Ukázka časové osy">
                <div className="hero-window-bar">
                  <i /><i /><i />
                  <span>České a světové dějiny</span>
                </div>
                <div className="hero-periods">
                  <span className="hero-period medieval">Středověk <small>476–1492</small></span>
                  <span className="hero-period renaissance">Renesance <small>1400–1600</small></span>
                  <span className="hero-period baroque">Baroko <small>1600–1750</small></span>
                </div>
                <div className="hero-grid-lines"><i /><i /><i /><i /></div>
                <div className="hero-sample-card card-one">
                  <span className="sample-image"><WikiImage title="Karel IV." alt="Karel IV." /></span>
                  <div><strong>Karel IV.</strong><small>1346–1378</small></div>
                </div>
                <div className="hero-sample-card card-two">
                  <span className="sample-image"><WikiImage title="Objevení Ameriky" alt="Objevení Ameriky" /></span>
                  <div><strong>Objevení Ameriky</strong><small>1492</small></div>
                </div>
                <div className="hero-sample-card card-three">
                  <span className="sample-image"><WikiImage title="Jan Amos Komenský" alt="Jan Amos Komenský" /></span>
                  <div><strong>Jan Amos Komenský</strong><small>1592–1670</small></div>
                </div>
                <div className="hero-crosshair"><span>1492</span></div>
              </div>
            </section>

            <section className="landing-feature-row">
              <article><Layers3 /><div><strong>Historie v souvislostech</strong><p>Porovnej, co se ve stejné době dělo v literatuře, politice, vědě a umění.</p></div></article>
              <article><SlidersHorizontal /><div><strong>Vlastní studijní osa</strong><p>Vyber si autory, vrstvy, období i množství informací podle sebe.</p></div></article>
              <article><GraduationCap /><div><strong>Pro studenty i učitele</strong><p>Pomůcka pro maturitu, výuku češtiny, dějepisu i projektové hodiny.</p></div></article>
              <article><MousePointer2 /><div><strong>Interaktivní, ne statická</strong><p>Přibližuj, posouvej, otevírej detaily a sleduj vazby mezi autory a díly.</p></div></article>
            </section>

            <section id="how" className="how-section">
              <div className="section-heading">
                <span>JAK TO FUNGUJE</span>
                <h2>Od rychlého přehledu až po téměř celou historii.</h2>
                <p>Jedna aplikace, ale pokaždé jiná podle toho, co zrovna potřebuješ vidět.</p>
              </div>
              <div className="how-grid">
                <article><span>01</span><Eye /><h3>Zvol podrobnost</h3><p>„Základy“ nechají jen události, které by měl znát každý. „Podrobně“ zobrazí maximum dostupných dat.</p></article>
                <article><span>02</span><CalendarRange /><h3>Vyber období</h3><p>Starověk, gotika, renesance, baroko, národní obrození nebo vlastní rozsah od–do.</p></article>
                <article><span>03</span><Users /><h3>Sestav si autory</h3><p>Vyber katalogové autory nebo načti dalšího autora a jeho díla přímo z Wikipedie a Wikidat.</p></article>
              </div>
            </section>

            <section className="teacher-section">
              <div>
                <span>VYTVOŘENO PRO VÝUKU</span>
                <h2>Úvod, který vysvětlí projekt. Osa, která ho nechá opravdu používat.</h2>
              </div>
              <p>
                Landing page představí smysl projektu studentům, učitelům i návštěvníkům portfolia.
                Níže je vložená celá funkční aplikace — a jedním kliknutím ji lze otevřít přes celou obrazovku.
              </p>
            </section>
          </main>
        </>
      )}

      <section id="timeline" ref={timelineSectionRef} className="timeline-section">
        {!timelineOnly && (
          <div className="timeline-intro">
            <span>VYZKOUŠEJ SI APLIKACI</span>
            <h2>Poskládej si vlastní pohled na dějiny.</h2>
            <p>Začni obdobím, zvol množství informací a potom zapínej jen vrstvy, které tě zajímají.</p>
          </div>
        )}

        <div
          ref={timelineFrameRef}
          className={`timeline-frame${timelineOnly ? " timeline-only" : ""}`}
        >
          <div className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
            <aside className="sidebar">
              <div className="brand">
                <div className="brand-mark"><Landmark /></div>
                <div className="brand-copy">
                  <strong>Časovrstvy</strong>
                  <span>historie v souvislostech</span>
                </div>
                <button
                  className="icon-button collapse-button"
                  onClick={() => setSidebarCollapsed((value) => !value)}
                  title="Skrýt nebo zobrazit menu"
                >
                  {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                </button>
              </div>

              <div className="sidebar-scroll">
                <p className="sidebar-label">Množství informací</p>
                <div className="density-control">
                  {([
                    ["essentials", "Základy"],
                    ["balanced", "Vyváženě"],
                    ["complete", "Podrobně"],
                  ] as [Density, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      className={density === value ? "active" : ""}
                      onClick={() => setDensity(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <p className="sidebar-label layers-label">Vrstvy časové osy</p>
                <div className="filter-list">
                  {LANE_ORDER.map((lane) => {
                    const Icon = laneIcons[lane];
                    return (
                      <button
                        key={lane}
                        className={`filter-row${filters[lane] ? " active" : ""}`}
                        style={{ "--filter-color": LANE_META[lane].color } as React.CSSProperties}
                        onClick={() => setFilters((current) => ({ ...current, [lane]: !current[lane] }))}
                        title={LANE_META[lane].label}
                      >
                        <Icon />
                        <span>{LANE_META[lane].label}</span>
                        <i><b /></i>
                      </button>
                    );
                  })}
                </div>

                <button className="author-picker-button" onClick={() => setAuthorPickerOpen(true)}>
                  <SlidersHorizontal />
                  <span>Vybrat vlastní autory</span>
                  <small>{selectedAuthors.size}</small>
                </button>

                <div className="sidebar-range">
                  <span>Vlastní rozsah</span>
                  <div><input value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} inputMode="numeric" aria-label="Rok od" /><b>—</b><input value={customTo} onChange={(event) => setCustomTo(event.target.value)} inputMode="numeric" aria-label="Rok do" /></div>
                  <button onClick={applyCustomRange}>Zobrazit období</button>
                </div>

                <div className="sidebar-note">
                  <strong>Jak pracovat s osou</strong>
                  <p>Kolečkem přibližuješ, tažením se posouváš a kliknutím otevřeš detail.</p>
                </div>
              </div>

              <div className="sidebar-footer">
                <button onClick={() => setDark((value) => !value)}>
                  {dark ? <Sun /> : <Moon />}
                  <span>{dark ? "Světlý režim" : "Tmavý režim"}</span>
                </button>
                <button onClick={() => setTimelineOnly(true)}>
                  <Focus />
                  <span>Pouze osa</span>
                </button>
              </div>
            </aside>

            <main className="main-area">
              <header className="topbar">
                <button className="mobile-menu" onClick={() => setSidebarCollapsed((value) => !value)}>
                  <Menu />
                </button>
                <div className="title-block">
                  <span>INTERAKTIVNÍ ARCHIV</span>
                  <h1>České a světové dějiny v jedné časové ose</h1>
                </div>
                <label className="search-box">
                  <Search />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Hledat autora, dílo, událost…"
                  />
                  {query && <button onClick={() => setQuery("")}><X /></button>}
                </label>
                <div className="year-chip">
                  <span>Rok</span>
                  <strong>{formatYear(crosshairYear)}</strong>
                </div>
                <div className="era-select-wrap">
                  <button className="range-chip" onClick={() => setEraMenuOpen((value) => !value)}>
                    <span>Období</span>
                    <strong>{formatYear(viewStart)}–{formatYear(viewEnd)}</strong>
                    <ChevronDown />
                  </button>
                  {eraMenuOpen && (
                    <div className="era-popover">
                      <header><div><span>RYCHLÝ VÝBĚR</span><strong>Vyber historické období</strong></div><button onClick={() => setEraMenuOpen(false)}><X /></button></header>
                      <div className="era-groups">
                        <section><h3>Světové dějiny a směry</h3>{allPeriods.filter((period) => period.scope === "world").map((period) => <button key={period.id} onClick={() => applyPeriod(period)}><i style={{ background: period.color }} /><span>{period.title}</span><small>{formatRange(period.start, period.end)}</small></button>)}</section>
                        <section><h3>České dějiny</h3>{allPeriods.filter((period) => period.scope === "czech").map((period) => <button key={period.id} onClick={() => applyPeriod(period)}><i style={{ background: period.color }} /><span>{period.title}</span><small>{formatRange(period.start, period.end)}</small></button>)}</section>
                      </div>
                      <div className="era-custom"><input value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} aria-label="Rok od" /><span>—</span><input value={customTo} onChange={(event) => setCustomTo(event.target.value)} aria-label="Rok do" /><button onClick={applyCustomRange}>Použít</button></div>
                    </div>
                  )}
                </div>
                <button className="icon-button" onClick={() => zoomAt(1.45)} title="Oddálit"><Minus /></button>
                <button className="icon-button" onClick={() => zoomAt(0.7)} title="Přiblížit"><Plus /></button>
                <button className="icon-button" onClick={toggleFullscreen} title="Celá obrazovka"><Maximize2 /></button>
                <button className="icon-button" onClick={() => setDark((value) => !value)} title="Změnit režim">
                  {dark ? <Sun /> : <Moon />}
                </button>
              </header>

              <div
                ref={viewportRef}
                className="timeline-viewport"
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onDoubleClick={(event) => {
                  if ((event.target as HTMLElement).closest("button,a,input")) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  zoomAt(0.5, (event.clientX - rect.left) / rect.width);
                }}
              >
                <section className="period-strip">
                  <div className="period-strip-heading"><Landmark /><span>Historická období a umělecké směry</span></div>
                  <div className="period-strip-canvas" style={{ width: viewportWidth }}>
                    {visiblePeriods.map((period) => {
                      const start = Math.max(period.start, viewStart);
                      const end = Math.min(period.end, viewEnd);
                      const left = ((start - viewStart) / span) * viewportWidth;
                      const width = Math.max(28, ((end - start) / span) * viewportWidth);
                      return (
                        <button
                          key={period.id}
                          className={`period-card row-${period.row}`}
                          onClick={() => applyPeriod(period)}
                          style={{
                            left,
                            width,
                            "--period-color": period.color,
                          } as React.CSSProperties}
                          title={`${period.title} · ${formatRange(period.start, period.end)}`}
                        >
                          <strong>{period.title}</strong>
                          <small>{formatRange(period.start, period.end)}</small>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="timeline-canvas" style={{ height: contentHeight }}>
                  <div className="crosshair-band" style={{ left: `${crosshairX * 100}%` }} />
                  <div className="crosshair-line" style={{ left: `${crosshairX * 100}%` }}><span>{formatYear(crosshairYear)}</span></div>

                  {gridYears.map((year) => {
                    const left = ((year - viewStart) / span) * 100;
                    return <div key={year} className="year-marker" style={{ left: `${left}%` }}><span>{formatYear(year)}</span></div>;
                  })}

                  {LANE_ORDER.map((lane) => {
                    const Icon = laneIcons[lane];
                    return (
                      <section key={lane} className={`timeline-lane${filters[lane] ? "" : " is-hidden"}`} style={{ top: laneTops[lane], height: LANE_HEIGHTS[lane], "--lane-color": LANE_META[lane].color } as React.CSSProperties}>
                        <div className="lane-heading"><Icon /><span>{LANE_META[lane].label}</span></div>
                        <div className="lane-axis" />
                      </section>
                    );
                  })}

                  <svg className="relation-layer" width={viewportWidth} height={contentHeight}>
                    {relationLines.map((line) => {
                      const bend = line.y1 + (line.y2 - line.y1) * 0.52;
                      return <path key={line.id} d={`M ${line.x1} ${line.y1} C ${line.x1} ${bend}, ${line.x2} ${bend}, ${line.x2} ${line.y2}`} />;
                    })}
                  </svg>

                  {LANE_ORDER.flatMap((lane) => layouts[lane].map(renderCard))}
                </div>
              </div>

              <div className="timeline-footer">
                <div className="preset-row">
                  <span>Rychlé období</span>
                  <button onClick={() => clampRange(-3200, 500)}>Starověk</button>
                  <button onClick={() => clampRange(500, 1500)}>Středověk</button>
                  <button onClick={() => clampRange(1150, 1500)}>Gotika</button>
                  <button onClick={() => clampRange(1400, 1600)}>Renesance</button>
                  <button onClick={() => clampRange(1600, 1750)}>Baroko</button>
                  <button onClick={() => clampRange(1775, 1850)}>Národní obrození</button>
                  <button onClick={() => clampRange(1900, 2000)}>20. století</button>
                  <button onClick={() => clampRange(HISTORY_MIN, HISTORY_MAX)}>Celá historie</button>
                </div>
                <div className="zoom-row">
                  <button onClick={() => zoomAt(1.45)} title="Oddálit"><Minus /></button>
                  <span className="edge-year">{formatYear(viewStart)}</span>
                  <input type="range" min="0" max="100" value={Math.round(100 * Math.log((HISTORY_MAX - HISTORY_MIN) / span) / Math.log((HISTORY_MAX - HISTORY_MIN) / MIN_SPAN))} onChange={(event) => {
                    const next = (HISTORY_MAX - HISTORY_MIN) * Math.pow(MIN_SPAN / (HISTORY_MAX - HISTORY_MIN), Number(event.target.value) / 100);
                    const center = (viewStart + viewEnd) / 2;
                    clampRange(center - next / 2, center + next / 2);
                  }} />
                  <span className="edge-year">{formatYear(viewEnd)}</span>
                  <button onClick={() => zoomAt(0.7)} title="Přiblížit"><Plus /></button>
                  <strong>{span < 30 ? `${span.toFixed(1)} roku` : `${Math.round(span).toLocaleString("cs-CZ")} let`}</strong>
                </div>
              </div>
            </main>
          </div>

          {timelineOnly && (
            <div className="floating-controls">
              <button onClick={() => setTimelineOnly(false)} title="Vrátit rozhraní"><X /></button>
              <button onClick={() => setDark((value) => !value)} title="Změnit režim">{dark ? <Sun /> : <Moon />}</button>
              <button onClick={toggleFullscreen} title="Celá obrazovka"><Maximize2 /></button>
            </div>
          )}
        </div>
      </section>

      {!timelineOnly && (
        <footer className="landing-footer">
          <div className="landing-brand"><span><Landmark /></span><strong>Časovrstvy</strong></div>
          <p>Interaktivní vzdělávací pomůcka pro historii, literaturu a výuku v souvislostech.</p>
          <button onClick={scrollToTimeline}>Zpět k časové ose</button>
        </footer>
      )}

      {detail && (
        <aside className="detail-panel">
          <button className="detail-close" onClick={() => setDetail(null)}><X /></button>
          <div className="detail-image"><WikiImage title={detail.wikiTitle} alt={detail.title} /></div>
          <div className="detail-body">
            <span className="detail-kicker">{LANE_META[detail.lane].label}</span>
            <h2>{detail.title}</h2>
            <p className="detail-date">{formatRange(detail.start, detail.end, detail.living)}</p>
            <p>{detail.summary}</p>
            {detail.authorId && <p className="detail-related">Autor: {allAuthors.find((authorItem) => authorItem.id === detail.authorId)?.title || "neuveden"}</p>}
            <a href={wikiUrl(detail.wikiTitle)} target="_blank" rel="noreferrer">Otevřít na Wikipedii <ExternalLink /></a>
          </div>
        </aside>
      )}

      {authorPickerOpen && (
        <div className="dialog-backdrop" onMouseDown={() => setAuthorPickerOpen(false)}>
          <section className="dialog author-dialog" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><span>VLASTNÍ STUDIJNÍ OSA</span><h2>Vyber si autory</h2><p>Na ose se zobrazí jejich život, díla a historický kontext.</p></div>
              <button className="icon-button" onClick={() => setAuthorPickerOpen(false)}><X /></button>
            </header>
            <label className="dialog-search"><Search /><input value={authorSearch} onChange={(event) => setAuthorSearch(event.target.value)} placeholder="Hledat v katalogu…" /></label>
            <div className="author-actions">
              <button onClick={() => setSelectedAuthors(new Set(DEFAULT_AUTHOR_IDS))}><RotateCcw /> Maturitní výběr</button>
              <button onClick={() => setSelectedAuthors(new Set(allAuthors.map((item) => item.id)))}><Check /> Vybrat všechny</button>
              <button onClick={() => setSelectedAuthors(new Set())}><X /> Vymazat</button>
            </div>
            <div className="author-grid">
              {allAuthors.filter((item) => normalize(item.title).includes(normalize(authorSearch))).map((item) => (
                <button key={item.id} className={selectedAuthors.has(item.id) ? "selected" : ""} onClick={() => toggleAuthor(item.id)}>
                  <span className="picker-avatar"><WikiImage title={item.wikiTitle} alt={item.title} /></span>
                  <span><strong>{item.title}</strong><small>{formatRange(item.start, item.end, item.living)}</small></span>
                  <i>{selectedAuthors.has(item.id) && <Check />}</i>
                </button>
              ))}
            </div>
            <div className="import-author">
              <div><span>PŘIDAT AUTORA Z WIKIPEDIE</span><h3>Není v katalogu?</h3><p>Napiš například „Dostojevskij“. Prototyp načte životopisná data a datovaná významná díla z Wikidat.</p></div>
              <div className="import-row"><input value={importName} onChange={(event) => setImportName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && importAuthor()} placeholder="Jméno autora…" /><button onClick={importAuthor} disabled={importing}>{importing ? <LoaderCircle className="spin" /> : <Plus />} Přidat</button></div>
              {importStatus && <p className="import-status">{importStatus}</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
