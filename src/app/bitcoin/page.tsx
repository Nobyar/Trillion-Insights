import type { Metadata } from "next";
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { BitcoinView } from "@/components/bitcoin-view";
import { PageFrame } from "@/components/frames";
import { loadBitcoinPage } from "@/lib/load";

export const metadata: Metadata = {
  title: "Bitcoin",
  description:
    "Bitcoin's live market cap beside the trillion-dollar companies, with IBIT options, headlines, and the path through $1 trillion.",
};

export default function Page() {
  return (
    <PageFrame>
      <Suspense fallback={<p className="loading">Loading Bitcoin…</p>}>
        <BitcoinBody />
      </Suspense>
    </PageFrame>
  );
}

async function BitcoinBody() {
  "use cache";
  cacheLife("minutes");
  cacheTag("desk");
  const result = await loadBitcoinPage().then(
    (page) => ({ page, error: null as string | null }),
    (error: unknown) => ({
      page: null,
      error: error instanceof Error ? error.message : "Bitcoin failed to load.",
    }),
  );
  if (!result.page) return <p className="note">{result.error}</p>;
  return <BitcoinView page={result.page} />;
}
