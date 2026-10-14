"use server";

import { updateTag } from "next/cache";

export async function refreshDesk() {
  updateTag("desk");
}
