import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingTimelinePreview from "@/polymet/components/landing-timeline-preview";
import { ENTRIES, ERAS, CATEGORIES } from "@/polymet/data/timeline-data";

const STATS = [
  { value: "625", label: "years mapped" },
  { value: `${ENTRIES.length}+`, label: "entries" },
  { value: `${CATEGORIES.length}`, label: "layers" },
  { value: `${ERAS.length}`, label: "eras" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-noise-texture">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:py-24">
        <div>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            A clearer way to read history
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            History has layers.
            <br />
            <span className="text-primary">See how they connect.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Strata lines up people, works, rulers, wars and inventions on one
            shared axis — so you can see what happened at the same time, not
            just read about it in isolation.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/explorer">
                Open the Explorer
                <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={`/entry/${ENTRIES[0].id}`}>See an example</Link>
            </Button>
          </div>

          <dl className="mt-10 grid grid-cols-4 gap-4 border-t border-border pt-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-serif text-xl font-semibold text-foreground">
                  {stat.value}
                </dd>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:pl-4">
          <LandingTimelinePreview />
        </div>
      </div>
    </section>
  );
}
