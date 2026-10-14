import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { DeskView } from "@/components/desk-view";
import { PageFrame } from "@/components/frames";
import { loadDesk } from "@/lib/load";

export default function Page() {
  return (
    <PageFrame>
      <Suspense fallback={<p className="loading">Loading Trillion Insights…</p>}>
        <DeskBody />
      </Suspense>
    </PageFrame>
  );
}

async function DeskBody() {
  "use cache";
  cacheLife("minutes");
  cacheTag("desk");
  const desk = await loadDesk();
  return <DeskView desk={desk} />;
}
