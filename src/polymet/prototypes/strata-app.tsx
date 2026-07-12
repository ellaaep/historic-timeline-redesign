import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MainLayout from "@/polymet/layouts/main-layout";
import Landing from "@/polymet/pages/landing";
import TimelineExplorer from "@/polymet/pages/timeline-explorer";
import EntryDetail from "@/polymet/pages/entry-detail";

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground">
        That page doesn't exist.
      </p>
      <Link to="/" className="text-sm font-medium text-primary underline">
        Back home
      </Link>
    </div>
  );
}

export default function StrataApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Landing />
            </MainLayout>
          }
        />

        <Route path="/explorer" element={<TimelineExplorer />} />

        <Route
          path="/entry/:id"
          element={
            <MainLayout>
              <EntryDetail />
            </MainLayout>
          }
        />

        <Route
          path="*"
          element={
            <MainLayout>
              <NotFound />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
