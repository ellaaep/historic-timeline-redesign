import TimelineRuler from "@/polymet/components/timeline-ruler";
import { YEAR_MAX, YEAR_MIN } from "@/polymet/data/timeline-data";

export default function TimelineRulerRender() {
  const pxPerYear = 7;
  const width = (YEAR_MAX - YEAR_MIN) * pxPerYear;

  return (
    <div className="bg-background p-6">
      <div className="w-[900px] overflow-x-auto rounded-md border border-border">
        <div style={{ width }}>
          <TimelineRuler pxPerYear={pxPerYear} />
        </div>
      </div>
    </div>
  );
}
