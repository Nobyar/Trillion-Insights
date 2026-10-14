"use client";

import { useFormStatus } from "react-dom";
import { refreshDesk } from "@/app/actions";

export function RefreshButton() {
  return (
    <form action={refreshDesk}>
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="edition" type="submit" disabled={pending}>
      {pending ? "Refreshing" : "Refresh"}
    </button>
  );
}
