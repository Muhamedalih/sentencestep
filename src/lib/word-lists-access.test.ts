import assert from "node:assert/strict";
import test from "node:test";

import { canOpenWordGroup } from "@/lib/word-lists-access";

test("a published topic opens for everyone", () => {
  assert.equal(canOpenWordGroup({ id: "kitchen", status: "published" }, false), true);
  assert.equal(canOpenWordGroup({ id: "kitchen", status: "published" }, true), true);
});

test("a draft topic opens for an admin only", () => {
  assert.equal(canOpenWordGroup({ id: "kitchen", status: "draft" }, true), true);
  assert.equal(canOpenWordGroup({ id: "kitchen", status: "draft" }, false), false);
});

test("a passage's own word list stays closed even to an admin, and an archived topic to everyone", () => {
  assert.equal(canOpenWordGroup({ id: "passage-the-sofa", status: "draft" }, true), false);
  assert.equal(canOpenWordGroup({ id: "kitchen", status: "archived" }, true), false);
  assert.equal(canOpenWordGroup({ id: "kitchen", status: "archived" }, false), false);
  assert.equal(canOpenWordGroup({ id: "kitchen", status: "" }, true), false);
});

test("a German draft topic opens for anyone German is open to, and no other draft does", () => {
  assert.equal(canOpenWordGroup({ id: "de-family", status: "draft" }, false, true), true);
  assert.equal(canOpenWordGroup({ id: "de-family", status: "draft" }, false, false), false);
  assert.equal(canOpenWordGroup({ id: "family", status: "draft" }, false, true), false);
  assert.equal(canOpenWordGroup({ id: "passage-de-x", status: "draft" }, false, true), false);
  assert.equal(canOpenWordGroup({ id: "de-family", status: "archived" }, true, true), false);
});
