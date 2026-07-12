import { BrowserRouter } from "react-router-dom";
import TimelineCanvas from "@/polymet/components/timeline-canvas";
import { CATEGORIES, ENTRIES, type CategoryId } from "@/polymet/data/timeline-data";

export default function TimelineCanvasRender() {
  const entriesByCategory = CATEGORIES.reduce(
    (acc, c) => {
      acc[c.id] = ENTRIES.filter((e) => e.category === c.id);
      return acc;
    },
    {} as Record<CategoryId, typeof ENTRIES>
  );

  return (
    <BrowserRouter>
      <div className="bg-background p-6">
        <TimelineCanvas
          categories={CATEGORIES}
          entriesByCategory={entriesByCategory}
          pxPerYear={6}
        />
      </div>
    </BrowserRouter>
  );
}
