import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { CompanyView } from "@/components/company-view";
import { PageFrame } from "@/components/frames";
import { loadCompanyPage } from "@/lib/load";
import { fromSlug } from "@/lib/slug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const ticker = fromSlug(symbol);
  return {
    title: ticker,
    description: `${ticker} on Trillion Insights: live market cap, company facts, headlines, options, and history.`,
  };
}

export default function Page({ params }: { params: Promise<{ symbol: string }> }) {
  return (
    <PageFrame>
      <Suspense fallback={<p className="loading">Loading the company…</p>}>
        <CompanyGate params={params} />
      </Suspense>
    </PageFrame>
  );
}

async function CompanyGate({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <CompanyBody symbol={fromSlug(symbol)} />;
}

async function CompanyBody({ symbol }: { symbol: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag("desk");
  const ticker = symbol;
  const page = await loadCompanyPage(ticker);
  if (!page) {
    return (
      <>
        <p className="kicker">Missing</p>
        <h1>{ticker}</h1>
        <p className="deck">
          Yahoo did not return a quote for this ticker. The list is on Trillion Insights.
        </p>
        <p className="takeaway">
          <Link href="/">Back to the list</Link>
        </p>
      </>
    );
  }
  return <CompanyView page={page} />;
}
