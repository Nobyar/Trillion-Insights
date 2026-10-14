"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="sheet">
      <div className="rules" aria-hidden="true" />
      <p className="kicker">Stalled</p>
      <h1>The desk could not finish loading.</h1>
      <p className="deck">{error.message || "Something failed while fetching quotes."}</p>
      <p style={{ marginTop: 16 }}>
        <button className="edition" type="button" onClick={() => reset()}>
          Try again
        </button>
      </p>
    </div>
  );
}
