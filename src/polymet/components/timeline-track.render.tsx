import { BrowserRouter } from "react-router-dom";
import TimelineTrack from "@/polymet/components/timeline-track";
import { ENTRIES, YEAR_MAX, YEAR_MIN } from "@/polymet/data/timeline-data";

export default function TimelineTrackRender() {
  const pxPerYear = 7;
  const width = (YEAR_MAX - YEAR_MIN) * pxPerYear;
  const entries = ENTRIES.filter((e) => e.category === "people");

  return (
    <BrowserRouter>
      <div className="bg-background p-6">
        <div className="w-[900px] overflow-x-auto rounded-md border border-border">
          <div style={{ width }}>
            <TimelineTrack entries={entries} chart={1} pxPerYear={pxPerYear} />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
