import Link from "next/link";
import { PageFrame } from "@/components/frames";

export default function NotFound() {
  return (
    <PageFrame>
      <div className="rules" aria-hidden="true" />
      <p className="kicker">Missing</p>
      <h1>That page is not on Trillion Insights.</h1>
      <p className="deck">
        <Link href="/">Back to the list</Link>
      </p>
    </PageFrame>
  );
}
