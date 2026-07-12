import { Link, useLocation } from "react-router-dom";
import { LayersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [{ label: "Explorer", to: "/explorer" }];

export default function SiteHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayersIcon className="h-4.5 w-4.5" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Strata
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                location.pathname === link.to && "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="sm">
          <Link to="/explorer">Open Explorer</Link>
        </Button>
      </div>
    </header>
  );
}
