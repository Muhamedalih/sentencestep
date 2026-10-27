import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { firstMetLabel } from "@/lib/word-bank/when-label";

const english = {
  whenToday: "today",
  whenYesterday: "yesterday",
  whenLastWeekday: "last {weekday}",
  whenOnDate: "on {date}",
};

describe("firstMetLabel", () => {
  it("says today, yesterday and the weekday of a day within the last week", () => {
    assert.equal(firstMetLabel("2026-10-27", "2026-10-27", null, english), "today");
    assert.equal(firstMetLabel("2026-10-26", "2026-10-27", null, english), "yesterday");
    // 2026-10-24 is a Saturday, 2026-10-25 a Sunday.
    assert.equal(firstMetLabel("2026-10-24", "2026-10-27", null, english), "last Saturday");
    assert.equal(firstMetLabel("2026-10-25", "2026-10-27", null, english), "last Sunday");
  });

  it("names the date once a week or more has passed", () => {
    assert.equal(firstMetLabel("2026-10-24", "2026-11-10", null, english), "on October 24");
  });

  it("writes the weekday in the learner's language, Spanish and Turkish in lower case", () => {
    const spanish = { ...english, whenLastWeekday: "el {weekday} pasado" };
    assert.equal(firstMetLabel("2026-10-24", "2026-10-27", "es", spanish), "el sábado pasado");
    const turkish = { ...english, whenLastWeekday: "geçen {weekday}" };
    assert.equal(firstMetLabel("2026-10-24", "2026-10-27", "tr", turkish), "geçen cumartesi");
    const arabic = { ...english, whenLastWeekday: "{weekday} الماضي" };
    assert.equal(firstMetLabel("2026-10-25", "2026-10-27", "ar", arabic), "الأحد الماضي");
  });

  it("keeps Western digits in Arabic dates", () => {
    const arabic = { ...english, whenOnDate: "في {date}" };
    const label = firstMetLabel("2026-10-24", "2026-11-10", "ar", arabic);
    assert.match(label, /^في 24 /);
  });
});
