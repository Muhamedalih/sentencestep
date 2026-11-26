import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GermanAlphabetPage } from "@/components/german/german-alphabet-page";
import { isGermanZeroOpen } from "@/lib/learn-language-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "German letters" };

/** The first lesson of the German Words page (permission germanZero): every German letter with its recorded sound. */
export default async function GermanAlphabetRoute() {
  if (!(await isGermanZeroOpen())) redirect("/learn");
  return <GermanAlphabetPage />;
}
