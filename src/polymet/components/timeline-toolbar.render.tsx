import { useState } from "react";
import TimelineToolbar from "@/polymet/components/timeline-toolbar";

export default function TimelineToolbarRender() {
  const [query, setQuery] = useState("");
  const [pxPerYear, setPxPerYear] = useState(6);

  return (
    <div className="bg-background p-6">
      <div className="w-full max-w-4xl">
        <TimelineToolbar
          query={query}
          onQueryChange={setQuery}
          resultCount={12}
          pxPerYear={pxPerYear}
          onZoomIn={() => setPxPerYear((v) => Math.min(v + 2, 18))}
          onZoomOut={() => setPxPerYear((v) => Math.max(v - 2, 2.5))}
          onFit={() => setPxPerYear(4)}
        />
      </div>
    </div>
  );
}
