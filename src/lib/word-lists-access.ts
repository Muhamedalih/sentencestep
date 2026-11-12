import { isPassageWordGroupId } from "@/lib/passages/ids";

/**
 * Whether a word group may be opened from the learner's own screens (the topic page, the rounds, the
 * word list), given its status and who is asking.
 *
 * A published topic: anyone (its lock screen then decides who reads the words). A DRAFT topic: an
 * admin only, so the new topics can be tried in the learner's own rounds, exactly as a learner will
 * meet them, before they are published (the row-level rule already hides a draft from everyone who
 * is not an admin; this keeps the rule in the code too). A passage's own word list (id
 * passage-...) is a draft for good and stays closed to everyone here; an admin reads it through the
 * admin preview. An archived topic is closed to all.
 */
export function canOpenWordGroup(
  group: { id: string; status: string },
  viewerIsAdmin: boolean,
): boolean {
  if (group.status === "published") return true;
  if (group.status === "draft") return viewerIsAdmin && !isPassageWordGroupId(group.id);
  return false;
}
