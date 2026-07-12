import { useState } from "react";
import TimelineSidebar from "@/polymet/components/timeline-sidebar";
import { CATEGORIES, type CategoryId } from "@/polymet/data/timeline-data";

export default function TimelineSidebarRender() {
  const [active, setActive] = useState<CategoryId[]>(
    CATEGORIES.map((c) => c.id)
  );

  return (
    <div className="flex min-h-[500px] justify-center bg-background p-6">
      <div className="w-72">
        <TimelineSidebar
          activeCategories={active}
          onToggleCategory={(id) =>
            setActive((prev) =>
              prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
            )
          }
        />
      </div>
    </div>
  );
}
