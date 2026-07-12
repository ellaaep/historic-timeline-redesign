import type { ReactNode } from "react";
import SiteHeader from "@/polymet/components/site-header";
import SiteFooter from "@/polymet/components/site-footer";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
