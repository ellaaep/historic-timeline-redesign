import { SearchIcon, ZoomInIcon, ZoomOutIcon, Maximize2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MAX_PX_PER_YEAR, MIN_PX_PER_YEAR } from "@/polymet/lib/timeline-scale";

interface TimelineToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  resultCount: number;
  pxPerYear: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export default function TimelineToolbar({
  query,
  onQueryChange,
  resultCount,
  pxPerYear,
  onZoomIn,
  onZoomOut,
  onFit,
}: TimelineToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search people, events, works…"
          className="pl-9"
        />

        {query && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {resultCount} found
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onFit}
          className="hidden sm:inline-flex"
        >
          Fit all
        </Button>
        <div className="flex items-center rounded-md border border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none rounded-l-md"
            onClick={onZoomOut}
            disabled={pxPerYear <= MIN_PX_PER_YEAR}
            aria-label="Zoom out"
          >
            <ZoomOutIcon className="h-4 w-4" />
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none rounded-r-md"
            onClick={onZoomIn}
            disabled={pxPerYear >= MAX_PX_PER_YEAR}
            aria-label="Zoom in"
          >
            <ZoomInIcon className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 sm:hidden"
          onClick={onFit}
          aria-label="Fit all"
        >
          <Maximize2Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
