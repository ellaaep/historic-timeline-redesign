import { BrowserRouter } from "react-router-dom";
import RelatedEntries from "@/polymet/components/related-entries";
import { ENTRIES, getRelatedEntries } from "@/polymet/data/timeline-data";

export default function RelatedEntriesRender() {
  const entry = ENTRIES.find((e) => e.id === "p-newton")!;
  const related = getRelatedEntries(entry);

  return (
    <BrowserRouter>
      <div className="bg-background p-8">
        <RelatedEntries entries={related} />
      </div>
    </BrowserRouter>
  );
}
