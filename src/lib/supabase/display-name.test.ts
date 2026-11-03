import { test } from "node:test";
import assert from "node:assert/strict";

import { angleBracketsError, hasAngleBrackets } from "./display-name";

test("hasAngleBrackets: a name with < or > is rejected", () => {
  assert.equal(hasAngleBrackets("<img src=x onerror=alert(1)>"), true);
  assert.equal(hasAngleBrackets("a<b"), true);
  assert.equal(hasAngleBrackets("a>b"), true);
});

test("hasAngleBrackets: ordinary names in every language pass", () => {
  for (const name of ["Mohammed", "محمد علي", "José Núñez", "Ayşe", "O'Brien"]) {
    assert.equal(hasAngleBrackets(name), false);
  }
});

test("angleBracketsError: every locale and the no-locale fallback have a message", () => {
  for (const locale of ["ar", "es", "tr", null] as const) {
    assert.ok(angleBracketsError(locale).length > 0);
  }
});
