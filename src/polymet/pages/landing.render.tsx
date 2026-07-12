import { BrowserRouter } from "react-router-dom";
import MainLayout from "@/polymet/layouts/main-layout";
import Landing from "@/polymet/pages/landing";

export default function LandingRender() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Landing />
      </MainLayout>
    </BrowserRouter>
  );
}
