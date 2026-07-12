import type { TimelineEntry } from "@/polymet/data/timeline-data";
import TimelineEntryChip from "@/polymet/components/timeline-entry-chip";

interface TimelineTrackProps {
  entries: TimelineEntry[];
  chart: 1 | 2 | 3 | 4 | 5;
  pxPerYear: number;
  activeEntryId?: string;
}

export default function TimelineTrack({
  entries,
  chart,
  pxPerYear,
  activeEntryId,
}: TimelineTrackProps) {
  return (
    <div className="relative h-24 border-b border-border/70 last:border-b-0">
      {entries.map((entry) => (
        <TimelineEntryChip
          key={entry.id}
          entry={entry}
          chart={chart}
          pxPerYear={pxPerYear}
          isActive={entry.id === activeEntryId}
        />
      ))}
    </div>
  );
}
