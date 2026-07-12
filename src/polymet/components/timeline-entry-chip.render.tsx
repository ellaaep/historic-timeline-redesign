import { BrowserRouter } from "react-router-dom";
import TimelineEntryChip from "@/polymet/components/timeline-entry-chip";
import { ENTRIES } from "@/polymet/data/timeline-data";

export default function TimelineEntryChipRender() {
  const span = ENTRIES.find((e) => e.id === "p-shakespeare")!;
  const point = ENTRIES.find((e) => e.id === "h-reformation")!;

  return (
    <BrowserRouter>
      <div className="flex flex-col gap-16 bg-background p-10">
        <div className="relative h-12 w-[420px]">
          <TimelineEntryChip entry={span} chart={1} pxPerYear={7} />
        </div>
        <div className="relative h-12 w-[420px]">
          <TimelineEntryChip entry={point} chart={2} pxPerYear={7} isActive />
        </div>
      </div>
    </BrowserRouter>
  );
}
