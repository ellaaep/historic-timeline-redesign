import { BrowserRouter } from "react-router-dom";
import TimelineExplorer from "@/polymet/pages/timeline-explorer";

export default function TimelineExplorerRender() {
  return (
    <BrowserRouter>
      <TimelineExplorer />
    </BrowserRouter>
  );
}
