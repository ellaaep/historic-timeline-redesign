import { useMemo, useState } from "react";
import { SearchXIcon, LayersIcon } from "lucide-react";
import SiteHeader from "@/polymet/components/site-header";
import TimelineToolbar from "@/polymet/components/timeline-toolbar";
import TimelineSidebar from "@/polymet/components/timeline-sidebar";
import TimelineCanvas from "@/polymet/components/timeline-canvas";
import {
  CATEGORIES,
  ENTRIES,
  type CategoryId,
  type TimelineEntry,
} from "@/polymet/data/timeline-data";
import { DEFAULT_PX_PER_YEAR, MAX_PX_PER_YEAR, MIN_PX_PER_YEAR } from "@/polymet/lib/timeline-scale";

export default function TimelineExplorer() {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [pxPerYear, setPxPerYear] = useState(DEFAULT_PX_PER_YEAR);

  const visibleCategories = useMemo(
    () => CATEGORIES.filter((c) => activeCategories.includes(c.id)),
    [activeCategories]
  );

  const matchesQuery = (entry: TimelineEntry) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.subtitle.toLowerCase().includes(q) ||
      entry.summary.toLowerCase().includes(q) ||
      entry.tags.some((t) => t.toLowerCase().includes(q))
    );
  };

  const entriesByCategory = useMemo(() => {
    const map: Record<CategoryId, TimelineEntry[]> = {
      people: [],
      works: [],
      rulers: [],
      history: [],
      inventions: [],
    };
    for (const entry of ENTRIES) {
      if (matchesQuery(entry)) map[entry.category].push(entry);
    }
    return map;
  }, [query]);

  const totalMatches = useMemo(
    () =>
      visibleCategories.reduce(
        (sum, c) => sum + (entriesByCategory[c.id]?.length ?? 0),
        0
      ),
    [visibleCategories, entriesByCategory]
  );

  const handleToggleCategory = (id: CategoryId) => {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Explorer
          </h1>
          <p className="text-sm text-muted-foreground">
            Pan across six centuries, toggle layers, and zoom in on any
            moment.
          </p>
        </div>

        <TimelineToolbar
          query={query}
          onQueryChange={setQuery}
          resultCount={totalMatches}
          pxPerYear={pxPerYear}
          onZoomIn={() =>
            setPxPerYear((v) => Math.min(v + 2, MAX_PX_PER_YEAR))
          }
          onZoomOut={() =>
            setPxPerYear((v) => Math.max(v - 2, MIN_PX_PER_YEAR))
          }
          onFit={() => setPxPerYear(DEFAULT_PX_PER_YEAR)}
        />

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <div className="lg:w-64 lg:shrink-0">
            <TimelineSidebar
              activeCategories={activeCategories}
              onToggleCategory={handleToggleCategory}
            />
          </div>

          <div className="min-w-0 flex-1">
            {visibleCategories.length === 0 ? (
              <EmptyState
                icon={LayersIcon}
                title="No layers selected"
                description="Turn on at least one layer from the sidebar to see the timeline."
              />
            ) : totalMatches === 0 ? (
              <EmptyState
                icon={SearchXIcon}
                title="No matches"
                description={`Nothing found for "${query}". Try a different search term.`}
              />
            ) : (
              <TimelineCanvas
                categories={visibleCategories}
                entriesByCategory={entriesByCategory}
                pxPerYear={pxPerYear}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof LayersIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-serif text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
