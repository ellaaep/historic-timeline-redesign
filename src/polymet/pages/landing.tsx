import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroSection from "@/polymet/components/hero-section";
import FeatureGrid from "@/polymet/components/feature-grid";

export default function Landing() {
  return (
    <>
      <HeroSection />
      <FeatureGrid />

      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-border bg-card p-8 text-center sm:flex-row sm:text-left lg:p-10">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                Six centuries, one shared axis.
              </h2>
              <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
                Jump into the explorer and start tracing how people, power,
                and ideas moved together through time.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/explorer">
                Open the Explorer
                <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
