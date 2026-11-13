import assert from "node:assert/strict";
import test from "node:test";

import { availableTabs, parseListsTab, showsTabs, tabHref } from "@/lib/words-hub/tabs";

test("Topics is always a tab; Core and Saved come only with what they show", () => {
  assert.deepEqual(availableTabs({ core: false, saved: false }), ["groups"]);
  assert.deepEqual(availableTabs({ core: true, saved: false }), ["groups", "core"]);
  assert.deepEqual(availableTabs({ core: false, saved: true }), ["groups", "saved"]);
  assert.deepEqual(availableTabs({ core: true, saved: true }), ["groups", "core", "saved"]);
});

test("the Map tab takes Core's place, and ?tab=map opens it only when it is offered", () => {
  assert.deepEqual(availableTabs({ core: true, saved: true, map: true }), [
    "groups",
    "map",
    "saved",
  ]);
  assert.deepEqual(availableTabs({ core: false, saved: false, map: true }), ["groups", "map"]);
  assert.equal(tabHref("map"), "/learn/word-lists?tab=map");
  assert.equal(parseListsTab("map", { core: true, saved: true, map: true }), "map");
  assert.equal(parseListsTab("map", { core: true, saved: true }), "groups");
  assert.equal(parseListsTab("core", { core: true, saved: true, map: true }), "groups");
});

test("a page with a single tab draws no tab bar", () => {
  assert.equal(showsTabs({ core: false, saved: false }), false);
  assert.equal(showsTabs({ core: true, saved: false }), true);
  assert.equal(showsTabs({ core: false, saved: true }), true);
});

test("each tab leads to its own address, and Topics keeps the Word Lists address", () => {
  assert.equal(tabHref("groups"), "/learn/word-lists");
  assert.equal(tabHref("core"), "/learn/word-lists?tab=core");
  assert.equal(tabHref("saved"), "/learn/words/saved");
});

test("?tab=core opens Core only for a learner who has it; anything else is Topics", () => {
  const both = { core: true, saved: true };
  assert.equal(parseListsTab("core", both), "core");
  assert.equal(parseListsTab(["core", "x"], both), "core");
  assert.equal(parseListsTab("core", { core: false, saved: true }), "groups");
  assert.equal(parseListsTab("saved", both), "groups");
  assert.equal(parseListsTab(undefined, both), "groups");
  assert.equal(parseListsTab("CORE", both), "groups");
});
