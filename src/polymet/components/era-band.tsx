import { ERAS } from "@/polymet/data/timeline-data";
import { spanWidth, yearToX } from "@/polymet/lib/timeline-scale";
import { cn } from "@/lib/utils";

const BAND_TONES = [
  "bg-chart-1/10 text-chart-1",
  "bg-chart-2/10 text-chart-2",
  "bg-chart-3/10 text-chart-3",
  "bg-chart-4/10 text-chart-4",
  "bg-chart-5/10 text-chart-5",
];

interface EraBandProps {
  pxPerYear: number;
}

export default function EraBand({ pxPerYear }: EraBandProps) {
  return (
    <div className="relative h-9 border-t border-border">
      {ERAS.map((era, i) => {
        const left = yearToX(era.startYear, pxPerYear);
        const width = spanWidth(era.startYear, era.endYear, pxPerYear);
        return (
          <div
            key={era.id}
            title={`${era.label} · ${era.startYear}–${era.endYear}`}
            style={{ left, width }}
            className={cn(
              "absolute top-0 flex h-full items-center justify-center border-r border-background/60 px-2",
              BAND_TONES[i % BAND_TONES.length]
            )}
          >
            <span className="truncate font-serif text-[11.5px] font-semibold uppercase tracking-wide">
              {era.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
