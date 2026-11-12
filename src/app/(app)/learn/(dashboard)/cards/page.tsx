import { redirect } from "next/navigation";

/** The saved words moved inside «كلماتي»: the old address (bookmarks, the Anki export's link) leads there. */
export default function CardsPage() {
  redirect("/learn/words/saved");
}
