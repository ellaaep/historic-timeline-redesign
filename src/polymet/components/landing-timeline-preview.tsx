import { CATEGORIES, ENTRIES, YEAR_MAX, YEAR_MIN } from "@/polymet/data/timeline-data";
import TimelineRuler from "@/polymet/components/timeline-ruler";
import TimelineTrack from "@/polymet/components/timeline-track";
import EraBand from "@/polymet/components/era-band";

const PREVIEW_CATEGORIES = CATEGORIES.filter((c) =>
  ["people", "history", "inventions"].includes(c.id)
);
const PX_PER_YEAR = 5.5;
const WIDTH = (YEAR_MAX - YEAR_MIN) * PX_PER_YEAR;

export default function LandingTimelinePreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="pointer-events-none select-none">
        <div style={{ width: WIDTH }}>
          <TimelineRuler pxPerYear={PX_PER_YEAR} currentYear={1789} />
          {PREVIEW_CATEGORIES.map((category) => (
            <TimelineTrack
              key={category.id}
              entries={ENTRIES.filter((e) => e.category === category.id)}
              chart={category.chart}
              pxPerYear={PX_PER_YEAR}
            />
          ))}
          <EraBand pxPerYear={PX_PER_YEAR} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
    </div>
  );
}
