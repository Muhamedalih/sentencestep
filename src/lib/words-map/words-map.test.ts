import assert from "node:assert/strict";
import test from "node:test";

import { lessonCounts, pickSession, workingLevel } from "@/lib/words-map/pick";
import type { PickGroup, PickWord } from "@/lib/words-map/pick";
import { listWords, summarizeMap, wordState } from "@/lib/words-map/state";
import type { MapGroup, MapWord } from "@/lib/words-map/state";

/** A topic of `n` words named `<prefix>1`..`<prefix>n`, ids `<id>-<i>`. */
function topic(id: string, level: number, order: number, prefix: string, n: number) {
  const ids = Array.from({ length: n }, (_, i) => `${id}-${i + 1}`);
  const group: PickGroup = { id, level, order, wordIds: ids };
  const words: PickWord[] = ids.map((wid, i) => ({
    id: wid,
    groupId: id,
    word: `${prefix}${i + 1}`,
    order: i + 1,
  }));
  return { group, words };
}

const family = topic("family", 1, 1, "fam", 25);
const animals = topic("animals", 1, 2, "ani", 30);
const house = topic("house", 1, 3, "hou", 25);
const clothes = topic("clothes", 1, 4, "clo", 25);
const travel = topic("travel", 2, 5, "tra", 25);
const all = [family, animals, house, clothes, travel];
const groups = all.map((t) => t.group);
const words = all.flatMap((t) => t.words);

test("a word's state comes from the bank's shelf first, then from Word Lists progress", () => {
  const w = { id: "a", w: "apple" };
  assert.equal(wordState(w, { apple: "stable" }, new Set()), "stable");
  assert.equal(wordState(w, { apple: "active" }, new Set(["a"])), "settling");
  assert.equal(wordState(w, { apple: "waiting" }, new Set()), "new");
  assert.equal(wordState(w, {}, new Set(["a"])), "new");
  assert.equal(wordState(w, {}, new Set()), "unseen");
});

test("the map's figures count each word once, by topic and by level", () => {
  const mapWords: MapWord[] = [
    { id: "1", g: "family", w: "aunt", m: "x" },
    { id: "2", g: "family", w: "uncle", m: "x" },
    { id: "3", g: "travel", w: "map", m: "x" },
    { id: "4", g: "travel", w: "ticket", m: "x" },
  ];
  const mapGroups: MapGroup[] = [
    { id: "family", level: 1, order: 1, wordIds: ["1", "2"] },
    { id: "travel", level: 2, order: 2, wordIds: ["3", "4"] },
  ];
  const f = summarizeMap(mapGroups, mapWords, { aunt: "stable", map: "active" }, new Set(["2"]));
  assert.deepEqual(
    {
      stable: f.all.stable,
      settling: f.all.settling,
      new: f.all.new,
      unseen: f.all.unseen,
      met: f.all.met,
    },
    { stable: 1, settling: 1, new: 1, unseen: 1, met: 3 },
  );
  assert.equal(f.byTopic.get("family")!.met, 2);
  assert.equal(f.byLevel.get(2)!.met, 1);
  assert.equal(f.stateOf.get("4"), "unseen");
});

test("the list puts today's words first, then settling, new, stable, unseen; and filters", () => {
  const mapWords: MapWord[] = [
    { id: "1", g: "g", w: "alpha", m: "a" },
    { id: "2", g: "g", w: "bravo", m: "b" },
    { id: "3", g: "g", w: "charlie", m: "c" },
    { id: "4", g: "g", w: "delta", m: "d" },
  ];
  const g: MapGroup[] = [{ id: "g", level: 1, order: 1, wordIds: ["1", "2", "3", "4"] }];
  const stateOf = new Map<string, "unseen" | "new" | "settling" | "stable">([
    ["1", "unseen"],
    ["2", "stable"],
    ["3", "settling"],
    ["4", "new"],
  ]);
  const base = { query: "", filter: "all" as const, level: 0 };
  assert.deepEqual(
    listWords(mapWords, g, stateOf, base).map((w) => w.w),
    ["charlie", "delta", "bravo", "alpha"],
  );
  assert.deepEqual(
    listWords(mapWords, g, stateOf, { ...base, firstIds: ["1"] }).map((w) => w.w)[0],
    "alpha",
  );
  assert.deepEqual(
    listWords(mapWords, g, stateOf, { ...base, filter: "stable" }).map((w) => w.w),
    ["bravo"],
  );
  assert.deepEqual(
    listWords(mapWords, g, stateOf, { ...base, query: "CHAR" }).map((w) => w.w),
    ["charlie"],
  );
  assert.deepEqual(
    listWords(mapWords, g, stateOf, { ...base, query: "d" }).map((w) => w.w),
    ["delta", "bravo"].filter((w) => w === "delta"),
  );
  assert.deepEqual(listWords(mapWords, g, stateOf, { ...base, level: 2 }), []);
});

test("the working level is the lowest one not yet 80% met; the next one once it is", () => {
  assert.equal(workingLevel(groups, new Set()), 1);
  const l1 = [family, animals, house, clothes].flatMap((t) => t.group.wordIds);
  const eighty = new Set(l1.slice(0, Math.ceil(l1.length * 0.8)));
  assert.equal(workingLevel(groups, eighty), 2);
  assert.equal(workingLevel(groups, new Set(words.map((w) => w.id))), null);
});

test("a session is four words from four different topics", () => {
  const picked = pickSession({ groups, words, met: new Set(), lessonCount: new Map() });
  assert.equal(picked.length, 4);
  assert.equal(new Set(picked.map((p) => p.groupId)).size, 4);
  // every one from level 1 (travel is level 2)
  assert.ok(picked.every((p) => p.groupId !== "travel"));
});

test("a topic the learner has begun comes before one they have not, and the nearly finished first", () => {
  const met = new Set<string>([
    ...family.group.wordIds.slice(0, 23), // two words left in family
    ...animals.group.wordIds.slice(0, 5), // begun, far from done
  ]);
  const picked = pickSession({ groups, words, met, lessonCount: new Map() });
  assert.equal(picked[0]!.groupId, "family");
  assert.deepEqual(picked[0]!.reason, { kind: "finish", left: 2 });
  assert.equal(picked[1]!.groupId, "animals");
  assert.deepEqual(picked[1]!.reason, { kind: "continue", done: 5, total: 30 });
});

test("among unmet words of one topic the one in more lessons wins, and says so", () => {
  const lessons = lessonCounts({ l1: ["fam7", "fam7", "x"], l2: ["fam7"], l3: ["fam7", "fam3"] });
  assert.equal(lessons.get("fam7"), 3);
  assert.equal(lessons.get("fam3"), 1);
  const picked = pickSession({ groups, words, met: new Set(), lessonCount: lessons });
  const fam = picked.find((p) => p.groupId === "family")!;
  assert.equal(fam.word, "fam7");
  assert.deepEqual(fam.reason, { kind: "seen", lessons: 3 });
});

test("an unbegun topic with unseen words is 'start'; met words are never picked", () => {
  const met = new Set(house.group.wordIds);
  const picked = pickSession({ groups, words, met, lessonCount: new Map() });
  assert.ok(picked.every((p) => p.groupId !== "house"));
  const start = picked.find((p) => p.groupId === "clothes");
  assert.deepEqual(start?.reason, { kind: "start" });
});

test("with fewer open topics than words wanted, a topic gives a second word", () => {
  const only = [family, animals];
  const picked = pickSession({
    groups: only.map((t) => t.group),
    words: only.flatMap((t) => t.words),
    met: new Set(),
    lessonCount: new Map(),
  });
  assert.equal(picked.length, 4);
  assert.equal(new Set(picked.map((p) => p.id)).size, 4);
  assert.equal(new Set(picked.map((p) => p.groupId)).size, 2);
});

test("nothing is picked when every word is met", () => {
  assert.deepEqual(
    pickSession({ groups, words, met: new Set(words.map((w) => w.id)), lessonCount: new Map() }),
    [],
  );
});

test("the same input always gives the same session", () => {
  const a = pickSession({
    groups,
    words,
    met: new Set(["family-1"]),
    lessonCount: new Map([["ani4", 2]]),
  });
  const b = pickSession({
    groups,
    words,
    met: new Set(["family-1"]),
    lessonCount: new Map([["ani4", 2]]),
  });
  assert.deepEqual(a, b);
});
