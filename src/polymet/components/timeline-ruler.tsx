import { YEAR_MAX, YEAR_MIN } from "@/polymet/data/timeline-data";
import { yearToX } from "@/polymet/lib/timeline-scale";

interface TimelineRulerProps {
  pxPerYear: number;
  currentYear?: number;
}

function pickInterval(pxPerYear: number): number {
  const candidates = [10, 20, 25, 50, 100, 200];
  for (const c of candidates) {
    if (c * pxPerYear >= 70) return c;
  }
  return 200;
}

export default function TimelineRuler({
  pxPerYear,
  currentYear,
}: TimelineRulerProps) {
  const interval = pickInterval(pxPerYear);
  const ticks: number[] = [];
  const start = Math.ceil(YEAR_MIN / interval) * interval;
  for (let y = start; y <= YEAR_MAX; y += interval) {
    ticks.push(y);
  }

  return (
    <div className="relative h-11 border-b border-border bg-muted/40">
      {ticks.map((year) => (
        <div
          key={year}
          className="absolute top-0 flex h-full flex-col items-start"
          style={{ left: yearToX(year, pxPerYear) }}
        >
          <span className="mt-2 -translate-x-1/2 whitespace-nowrap font-serif text-[12px] font-medium tracking-wide text-muted-foreground">
            {year}
          </span>
          <span className="absolute bottom-0 h-2 w-px bg-border" />
        </div>
      ))}
      {typeof currentYear === "number" && (
        <div
          className="absolute top-0 z-10 h-full w-px bg-primary/60"
          style={{ left: yearToX(currentYear, pxPerYear) }}
        />
      )}
    </div>
  );
}
