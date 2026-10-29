import assert from "node:assert/strict";
import { test } from "node:test";

import { ruleRowLinks, ruleRowTarget } from "./home-row";

test("the row teaches the rule from today's finished story when that story has a ladder", () => {
  assert.deepEqual(ruleRowTarget({ story: { id: "story-7", level: 1 }, level: 3 }), {
    href: "/learn/today/rule?daily=1&from=story-7",
    levelLabel: "A1",
  });
});

test("the story id is escaped in the link", () => {
  const target = ruleRowTarget({ story: { id: "a b&c", level: 2 }, level: 1 });
  assert.equal(target?.href, "/learn/today/rule?daily=1&from=a%20b%26c");
});

test("without a story, the row is the daily task from the learner's own texts at their level", () => {
  assert.deepEqual(ruleRowTarget({ story: null, level: 2 }), {
    href: "/learn/today/rule?daily=1",
    levelLabel: "A2–B1",
  });
});

test("a story at a level with no ladder falls back to the learner's level", () => {
  assert.deepEqual(ruleRowTarget({ story: { id: "story-9", level: 4 }, level: 3 }), {
    href: "/learn/today/rule?daily=1",
    levelLabel: "B2",
  });
});

test("no row when neither the story's level nor the learner's has a ladder", () => {
  assert.equal(ruleRowTarget({ story: { id: "story-9", level: 4 }, level: 5 }), null);
  assert.equal(ruleRowTarget({ story: null, level: 9 }), null);
});

test("until today's rule is answered, the row links to the rule and its repeat button goes there too", () => {
  const target = { href: "/learn/today/rule?daily=1&from=story-7", levelLabel: "A1" };
  assert.deepEqual(ruleRowLinks(target, false), {
    href: "/learn/today/rule?daily=1&from=story-7",
    repeatHref: "/learn/today/rule?daily=1&from=story-7",
  });
});

test("once answered, the row is no link and its repeat button runs today's session again (redo)", () => {
  const target = { href: "/learn/today/rule?daily=1", levelLabel: "A2–B1" };
  assert.deepEqual(ruleRowLinks(target, true), {
    href: null,
    repeatHref: "/learn/today/rule?daily=1&redo=1",
  });
});
