import { BrowserRouter } from "react-router-dom";
import MainLayout from "@/polymet/layouts/main-layout";

export default function MainLayoutRender() {
  return (
    <BrowserRouter>
      <MainLayout>
        <div className="container py-16">
          <p className="text-muted-foreground">Page content goes here.</p>
        </div>
      </MainLayout>
    </BrowserRouter>
  );
}
