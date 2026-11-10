import { test } from "node:test";
import assert from "node:assert/strict";

import { nearestHour, returnChoices } from "./choices";
import {
  firstName,
  minutesLabel,
  nameableWord,
  personalPush,
  personalReminderEmail,
  reminderPath,
} from "./message";

const at = (hour: number, minute = 0) => new Date(2026, 10, 10, hour, minute);

test("nearestHour: rounds to the hour on the clock, 15:29 down and 15:30 up, past midnight too", () => {
  assert.equal(nearestHour(at(15, 29)), 15);
  assert.equal(nearestHour(at(15, 30)), 16);
  assert.equal(nearestHour(at(23, 45)), 0);
});

test("returnChoices: the first time is the hour of today's session, the second is 8 pm", () => {
  const afternoon = returnChoices(at(15, 10));
  assert.deepEqual(afternoon.primary, { hour: 15, sameTime: true });
  assert.deepEqual(afternoon.secondary, { hour: 20, sameTime: false });
  const morning = returnChoices(at(9, 40));
  assert.deepEqual(morning.primary, { hour: 10, sameTime: true });
  assert.equal(morning.secondary.hour, 20);
});

test("returnChoices: in the evening the second time is midday, never two evening times", () => {
  for (const hour of [19, 20, 21]) {
    const choices = returnChoices(at(hour, 0));
    assert.equal(choices.primary.hour, hour);
    assert.equal(choices.secondary.hour, 12, `at ${hour}:00`);
  }
  assert.equal(returnChoices(at(22, 0)).secondary.hour, 20);
});

test("returnChoices: a session at night is not offered 'the same time', and 8 pm leads", () => {
  for (const hour of [23, 0, 2, 5, 6]) {
    const choices = returnChoices(at(hour, 0));
    assert.deepEqual(choices.primary, { hour: 20, sameTime: false }, `at ${hour}:00`);
    assert.equal(choices.secondary.hour, 12);
  }
  // 06:40 rounds up to 7, the first hour a reminder may fall on.
  assert.deepEqual(returnChoices(at(6, 40)).primary, { hour: 7, sameTime: true });
});

test("returnChoices: the two times always differ", () => {
  for (let hour = 0; hour < 24; hour++) {
    const { primary, secondary } = returnChoices(at(hour, 0));
    assert.notEqual(primary.hour, secondary.hour, `at ${hour}:00`);
  }
});

test("minutesLabel: Arabic has its own forms, the others a short unit", () => {
  assert.equal(minutesLabel("ar", 1), "دقيقة واحدة");
  assert.equal(minutesLabel("ar", 2), "دقيقتين");
  assert.equal(minutesLabel("ar", 3), "3 دقائق");
  assert.equal(minutesLabel("ar", 12), "12 دقيقة");
  assert.equal(minutesLabel("en", 3), "3 minutes");
  assert.equal(minutesLabel("en", 1), "1 minute");
  assert.equal(minutesLabel("es", 3), "3 min");
  assert.equal(minutesLabel("tr", 3), "3 dk");
  assert.equal(minutesLabel("en", 0), "1 minute");
});

test("personalPush: names the lesson and the word in every language, and degrades without them", () => {
  for (const language of ["ar", "es", "tr", "en"] as const) {
    const full = personalPush(language, { title: "At the Café", word: "because", minutes: 3 });
    assert.ok(full.body.includes("At the Café"), `${language} names the lesson`);
    assert.ok(full.body.includes("because"), `${language} names the word`);
    assert.ok(full.title.length > 0 && full.title.length <= 60, `${language} title`);

    const noWord = personalPush(language, { title: "At the Café", word: null, minutes: 3 });
    assert.ok(noWord.body.includes("At the Café") && !noWord.body.includes("because"));

    const bare = personalPush(language, { title: null, word: null, minutes: 3 });
    assert.ok(bare.body.length > 10 && !bare.body.includes("null"));
  }
});

test("personalReminderEmail: subject, lesson, word and a button that opens the lesson itself", () => {
  const mail = personalReminderEmail({
    origin: "https://example.test",
    language: "ar",
    displayName: "Sara Ahmed",
    reminder: { title: "At the Café", word: "because", minutes: 3 },
    path: "/learn/normal/at-the-cafe",
  });
  assert.ok(mail.subject.includes("At the Café"));
  assert.ok(mail.html.includes("because"));
  assert.ok(mail.html.includes("https://example.test/learn/normal/at-the-cafe"));
  assert.ok(mail.html.includes("Sara") && !mail.html.includes("Ahmed"), "first name only");
  assert.ok(mail.text.includes("because"));
});

test("personalReminderEmail: HTML in a lesson title or word is escaped", () => {
  const mail = personalReminderEmail({
    origin: "https://example.test",
    language: "en",
    displayName: null,
    reminder: { title: "<b>x</b>", word: null, minutes: 3 },
    path: "/learn",
  });
  assert.ok(!mail.html.includes("<b>x</b>"));
  assert.ok(mail.html.includes("&lt;b&gt;x&lt;/b&gt;"));
});

test("reminderPath: only real lesson paths, anything else is Home", () => {
  assert.equal(reminderPath("normal", "at-the-cafe"), "/learn/normal/at-the-cafe");
  assert.equal(reminderPath("stories", "story-12"), "/learn/stories/story-12");
  assert.equal(reminderPath("conversation", "x"), "/learn");
  assert.equal(reminderPath("normal", "../admin"), "/learn");
  assert.equal(reminderPath("normal", null), "/learn");
  assert.equal(reminderPath(null, null), "/learn");
});

test("nameableWord: a plain English word only", () => {
  assert.equal(nameableWord("Because"), "because");
  assert.equal(nameableWord(" don't "), "don't");
  assert.equal(nameableWord("a"), null);
  assert.equal(nameableWord("ab"), null);
  assert.equal(nameableWord("hello world"), null);
  assert.equal(nameableWord("<script>"), null);
  assert.equal(nameableWord("x".repeat(30)), null);
  assert.equal(nameableWord(null), null);
});

test("firstName: the first word of a display name", () => {
  assert.equal(firstName("Mohammed Ali Altaee"), "Mohammed");
  assert.equal(firstName("  Sara "), "Sara");
  assert.equal(firstName(""), null);
  assert.equal(firstName(null), null);
});

import {
  RETURN_MARKER_KEY,
  RETURN_MARKER_MAX_AGE_MS,
  lessonFromPath,
  takeReturnMarker,
  writeReturnMarker,
} from "./marker";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    has: (key: string) => data.has(key),
  };
}

test("lessonFromPath: only a lesson page of a path mode", () => {
  assert.deepEqual(lessonFromPath("/learn/normal/onboarding-beginner"), {
    mode: "normal",
    lessonId: "onboarding-beginner",
  });
  assert.deepEqual(lessonFromPath("/learn/stories/story-3/"), {
    mode: "stories",
    lessonId: "story-3",
  });
  assert.equal(lessonFromPath("/learn"), null);
  assert.equal(lessonFromPath("/learn/conversation/x"), null);
  assert.equal(lessonFromPath("/learn/normal/a/b"), null);
  assert.equal(lessonFromPath("/admin/normal/x"), null);
});

test("marker: written by the guest page, read once after sign-up, then gone", () => {
  const storage = fakeStorage();
  writeReturnMarker(storage, { mode: "normal", lessonId: "onboarding-beginner" }, 1_000);
  assert.ok(storage.has(RETURN_MARKER_KEY));
  const first = takeReturnMarker(storage, 5_000);
  assert.deepEqual(first, { mode: "normal", lessonId: "onboarding-beginner", at: 1_000 });
  assert.equal(storage.has(RETURN_MARKER_KEY), false);
  assert.equal(takeReturnMarker(storage, 6_000), null);
});

test("marker: older than three days, from the future or malformed is ignored (and removed)", () => {
  const old = fakeStorage();
  writeReturnMarker(old, { mode: "stories", lessonId: "s1" }, 0);
  assert.equal(takeReturnMarker(old, RETURN_MARKER_MAX_AGE_MS + 1), null);
  assert.equal(old.has(RETURN_MARKER_KEY), false);

  const future = fakeStorage();
  writeReturnMarker(future, { mode: "normal", lessonId: "x" }, 10_000);
  assert.equal(takeReturnMarker(future, 1_000), null);

  for (const raw of [
    "not json",
    "null",
    '{"mode":"conversation","lessonId":"x","at":1}',
    '{"mode":"normal","lessonId":"../x","at":1}',
    '{"mode":"normal","lessonId":"x"}',
  ]) {
    const storage = fakeStorage({ [RETURN_MARKER_KEY]: raw });
    assert.equal(takeReturnMarker(storage, 2), null, raw);
  }
});

test("marker: a storage that throws never breaks the page", () => {
  const broken = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
  };
  assert.doesNotThrow(() => writeReturnMarker(broken, { mode: "normal", lessonId: "x" }, 1));
  assert.equal(takeReturnMarker(broken, 1), null);
});
