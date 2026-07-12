import { Link, useParams } from "react-router-dom";
import { ArrowLeftIcon, MapPinIcon, CalendarIcon } from "lucide-react";
import {
  getCategory,
  getEntry,
  getEraForYear,
  getRelatedEntries,
} from "@/polymet/data/timeline-data";
import RelatedEntries from "@/polymet/components/related-entries";
import { Button } from "@/components/ui/button";

const CHART_BADGE: Record<number, string> = {
  1: "bg-chart-1/12 text-chart-1 border-chart-1/30",
  2: "bg-chart-2/12 text-chart-2 border-chart-2/30",
  3: "bg-chart-3/12 text-chart-3 border-chart-3/30",
  4: "bg-chart-4/12 text-chart-4 border-chart-4/30",
  5: "bg-chart-5/12 text-chart-5 border-chart-5/30",
};

export default function EntryDetail() {
  const { id = "" } = useParams();
  const entry = getEntry(id);

  if (!entry) {
    return (
      <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Entry not found
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This entry may have been renamed or removed. Head back to the
          explorer to keep browsing.
        </p>
        <Button asChild>
          <Link to="/explorer">Back to Explorer</Link>
        </Button>
      </div>
    );
  }

  const category = getCategory(entry.category);
  const era = getEraForYear(entry.startYear);
  const related = getRelatedEntries(entry);
  const initial = entry.title.charAt(0).toUpperCase();

  return (
    <div className="container max-w-3xl py-10 lg:py-16">
      <Link
        to="/explorer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Explorer
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border font-serif text-xl font-semibold ${CHART_BADGE[category.chart]}`}
        >
          {initial}
        </span>
        <div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CHART_BADGE[category.chart]}`}
          >
            {category.label}
          </span>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">
            {entry.title}
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {entry.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-border py-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4" />
          {entry.startYear}
          {entry.endYear ? `–${entry.endYear}` : ""} · {era?.label}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPinIcon className="h-4 w-4" />
          {entry.location}
        </span>
      </div>

      <p className="mt-6 font-reading text-[17px] leading-relaxed text-foreground">
        {entry.detail}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-12">
        <RelatedEntries entries={related} />
      </div>
    </div>
  );
}
