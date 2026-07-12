import { LayersIcon, SearchIcon, ZoomInIcon, Link2Icon } from "lucide-react";

const FEATURES = [
  {
    icon: LayersIcon,
    title: "Layered by design",
    description:
      "People, works, rulers, wars and inventions each get their own track — toggle any layer on or off to focus on what matters.",
  },
  {
    icon: ZoomInIcon,
    title: "Zoom without losing context",
    description:
      "Scan six centuries at a glance, or zoom into a single decade — the era band always keeps you oriented.",
  },
  {
    icon: SearchIcon,
    title: "Search across everything",
    description:
      "Find a person, event or invention instantly, and jump straight to where it sits on the shared timeline.",
  },
  {
    icon: Link2Icon,
    title: "Everything is connected",
    description:
      "Every entry links to what happened around it — so one figure leads naturally to their era, works and contemporaries.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="border-b border-border py-16 lg:py-20">
      <div className="container">
        <div className="max-w-lg">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Built to make history legible
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Not another feed of disconnected facts — a single organized
            surface for how history actually unfolded.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="mt-4 font-serif text-[15px] font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
