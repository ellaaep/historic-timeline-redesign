import { Link } from "react-router-dom";
import type { TimelineEntry } from "@/polymet/data/timeline-data";
import { isSpanEntry, spanWidth, yearToX } from "@/polymet/lib/timeline-scale";
import { cn } from "@/lib/utils";

interface ChartStyle {
  bg: string;
  bgSoft: string;
  border: string;
  text: string;
  dot: string;
}

const CHART_STYLES: Record<1 | 2 | 3 | 4 | 5, ChartStyle> = {
  1: {
    bg: "bg-chart-1",
    bgSoft: "bg-chart-1/12",
    border: "border-chart-1/45",
    text: "text-chart-1",
    dot: "bg-chart-1",
  },
  2: {
    bg: "bg-chart-2",
    bgSoft: "bg-chart-2/12",
    border: "border-chart-2/45",
    text: "text-chart-2",
    dot: "bg-chart-2",
  },
  3: {
    bg: "bg-chart-3",
    bgSoft: "bg-chart-3/12",
    border: "border-chart-3/45",
    text: "text-chart-3",
    dot: "bg-chart-3",
  },
  4: {
    bg: "bg-chart-4",
    bgSoft: "bg-chart-4/12",
    border: "border-chart-4/45",
    text: "text-chart-4",
    dot: "bg-chart-4",
  },
  5: {
    bg: "bg-chart-5",
    bgSoft: "bg-chart-5/12",
    border: "border-chart-5/45",
    text: "text-chart-5",
    dot: "bg-chart-5",
  },
};

interface TimelineEntryChipProps {
  entry: TimelineEntry;
  chart: 1 | 2 | 3 | 4 | 5;
  pxPerYear: number;
  isActive?: boolean;
}

export default function TimelineEntryChip({
  entry,
  chart,
  pxPerYear,
  isActive,
}: TimelineEntryChipProps) {
  const styles = CHART_STYLES[chart];
  const left = yearToX(entry.startYear, pxPerYear);
  const asSpan = isSpanEntry(entry.startYear, entry.endYear);
  const initial = entry.title.charAt(0).toUpperCase();

  if (asSpan && entry.endYear) {
    const width = spanWidth(entry.startYear, entry.endYear, pxPerYear);
    return (
      <Link
        to={`/entry/${entry.id}`}
        title={`${entry.title} · ${entry.subtitle}`}
        style={{ left, width }}
        className={cn(
          "group absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 shadow-sm transition-all hover:-translate-y-[calc(50%+2px)] hover:shadow-md",
          styles.bgSoft,
          styles.border,
          isActive && "ring-2 ring-offset-1 ring-offset-background",
          isActive && styles.border
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-background",
            styles.bg
          )}
        >
          {initial}
        </span>
        <span className="truncate font-serif text-[13px] font-medium text-foreground">
          {entry.title}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`/entry/${entry.id}`}
      title={`${entry.title} · ${entry.subtitle}`}
      style={{ left }}
      className={cn(
        "group absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap"
      )}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full border-2 border-background shadow-sm transition-transform group-hover:scale-125",
          styles.dot,
          isActive && "scale-125 ring-2 ring-offset-1 ring-offset-background",
          isActive && styles.border
        )}
      />
      <span
        className={cn(
          "max-w-[140px] truncate rounded-md border bg-card px-2 py-1 text-[12.5px] font-medium text-foreground shadow-sm transition-colors group-hover:border-foreground/30",
          "border-border"
        )}
      >
        {entry.title}
      </span>
    </Link>
  );
}
