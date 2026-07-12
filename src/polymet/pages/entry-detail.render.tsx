import { MemoryRouter } from "react-router-dom";
import MainLayout from "@/polymet/layouts/main-layout";
import EntryDetail from "@/polymet/pages/entry-detail";

export default function EntryDetailRender() {
  return (
    <MemoryRouter initialEntries={["/entry/p-einstein"]}>
      <MainLayout>
        <EntryDetail />
      </MainLayout>
    </MemoryRouter>
  );
}
