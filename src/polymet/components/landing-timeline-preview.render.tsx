import { BrowserRouter } from "react-router-dom";
import LandingTimelinePreview from "@/polymet/components/landing-timeline-preview";

export default function LandingTimelinePreviewRender() {
  return (
    <BrowserRouter>
      <div className="bg-background p-10">
        <LandingTimelinePreview />
      </div>
    </BrowserRouter>
  );
}
