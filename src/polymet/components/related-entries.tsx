import { Link } from "react-router-dom";
import type { TimelineEntry } from "@/polymet/data/timeline-data";
import { getCategory } from "@/polymet/data/timeline-data";

const CHART_TEXT: Record<number, string> = {
  1: "text-chart-1",
  2: "text-chart-2",
  3: "text-chart-3",
  4: "text-chart-4",
  5: "text-chart-5",
};

interface RelatedEntriesProps {
  entries: TimelineEntry[];
}

export default function RelatedEntries({ entries }: RelatedEntriesProps) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-foreground">
        Around the same time
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => {
          const category = getCategory(entry.category);
          return (
            <Link
              key={entry.id}
              to={`/entry/${entry.id}`}
              className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${CHART_TEXT[category.chart]}`}
                >
                  {category.label}
                </span>
                <h3 className="mt-0.5 font-serif text-[15px] font-medium text-foreground group-hover:text-primary">
                  {entry.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {entry.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
