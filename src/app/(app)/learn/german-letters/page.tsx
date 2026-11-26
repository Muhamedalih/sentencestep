import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GermanLettersLesson } from "@/components/german/german-letters-lesson";
import { isGermanZeroOpen } from "@/lib/learn-language-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "German letters" };

/**
 * The German letters lesson, full screen like the lesson player (no header or sidebar). The "germanZero"
 * permission decides who can open it (German must be open too). `?from=words` sends the learner back to
 * the Words page when the lesson ends; anything else goes to Home.
 */
export default async function GermanLettersPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  if (!(await isGermanZeroOpen())) redirect("/learn");
  const from = (await searchParams).from;
  const next = from === "words" ? "/learn/word-lists" : "/learn";
  return <GermanLettersLesson next={next} />;
}
