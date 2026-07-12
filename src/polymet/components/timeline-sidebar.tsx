import { CATEGORIES, type CategoryId } from "@/polymet/data/timeline-data";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const DOT_TONES: Record<number, string> = {
  1: "bg-chart-1",
  2: "bg-chart-2",
  3: "bg-chart-3",
  4: "bg-chart-4",
  5: "bg-chart-5",
};

interface TimelineSidebarProps {
  activeCategories: CategoryId[];
  onToggleCategory: (id: CategoryId) => void;
}

export default function TimelineSidebar({
  activeCategories,
  onToggleCategory,
}: TimelineSidebarProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 font-serif text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Layers
      </h3>
      {CATEGORIES.map((category) => {
        const isOn = activeCategories.includes(category.id);
        return (
          <label
            key={category.id}
            className={cn(
              "flex cursor-pointer items-start justify-between gap-3 rounded-md p-2 transition-colors hover:bg-muted/60",
              !isOn && "opacity-60"
            )}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  DOT_TONES[category.chart]
                )}
              />

              <div>
                <div className="font-serif text-[13.5px] font-medium leading-tight text-foreground">
                  {category.label}
                </div>
                <div className="text-xs leading-tight text-muted-foreground">
                  {category.description}
                </div>
              </div>
            </div>
            <Switch
              checked={isOn}
              onCheckedChange={() => onToggleCategory(category.id)}
            />
          </label>
        );
      })}
    </div>
  );
}
