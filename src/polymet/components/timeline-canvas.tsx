import { useRef } from "react";
import type { Category, CategoryId, TimelineEntry } from "@/polymet/data/timeline-data";
import { YEAR_MAX, YEAR_MIN } from "@/polymet/data/timeline-data";
import TimelineRuler from "@/polymet/components/timeline-ruler";
import TimelineTrack from "@/polymet/components/timeline-track";
import EraBand from "@/polymet/components/era-band";

interface TimelineCanvasProps {
  categories: Category[];
  entriesByCategory: Record<CategoryId, TimelineEntry[]>;
  pxPerYear: number;
  activeEntryId?: string;
}

export default function TimelineCanvas({
  categories,
  entriesByCategory,
  pxPerYear,
  activeEntryId,
}: TimelineCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalWidth = (YEAR_MAX - YEAR_MIN) * pxPerYear;

  return (
    <div className="flex overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex w-32 shrink-0 flex-col border-r border-border bg-muted/30 sm:w-44">
        <div className="h-11 border-b border-border" />
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex h-24 flex-col justify-center border-b border-border/70 px-3 last:border-b-0"
          >
            <span className="font-serif text-[13.5px] font-semibold leading-tight text-foreground sm:text-sm">
              {category.label}
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              {entriesByCategory[category.id]?.length ?? 0} entries
            </span>
          </div>
        ))}
        <div className="h-9" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-x-auto">
        <div style={{ width: totalWidth, minWidth: "100%" }}>
          <TimelineRuler pxPerYear={pxPerYear} />
          {categories.map((category) => (
            <TimelineTrack
              key={category.id}
              entries={entriesByCategory[category.id] ?? []}
              chart={category.chart}
              pxPerYear={pxPerYear}
              activeEntryId={activeEntryId}
            />
          ))}
          <EraBand pxPerYear={pxPerYear} />
        </div>
      </div>
    </div>
  );
}
