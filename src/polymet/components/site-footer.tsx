import { Link } from "react-router-dom";
import { LayersIcon } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayersIcon className="h-3.5 w-3.5" />
          </span>
          <span className="font-serif text-sm font-semibold text-foreground">
            Strata
          </span>
          <span className="text-xs text-muted-foreground">
            · history, laid out clearly
          </span>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link to="/explorer" className="hover:text-foreground">
            Explorer
          </Link>
          <span>© {new Date().getFullYear()} Strata</span>
        </div>
      </div>
    </footer>
  );
}
