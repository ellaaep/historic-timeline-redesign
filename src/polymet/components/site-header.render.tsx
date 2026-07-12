import { BrowserRouter } from "react-router-dom";
import SiteHeader from "@/polymet/components/site-header";

export default function SiteHeaderRender() {
  return (
    <BrowserRouter>
      <SiteHeader />
    </BrowserRouter>
  );
}
