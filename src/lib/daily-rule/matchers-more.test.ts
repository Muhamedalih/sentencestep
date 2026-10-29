import assert from "node:assert/strict";
import test from "node:test";

import type { MatchKind } from "@/lib/daily-rule/ladder";
import { candidatesFor } from "@/lib/daily-rule/matchers";
import { EXTRA_MATCHERS } from "@/lib/daily-rule/matchers-more";
import { SYLLABUS } from "@/lib/daily-rule/syllabus";
import { tokenize } from "@/lib/daily-rule/tokens";

/** The words a matcher picked, in order, so an assertion reads as English. */
function picked(kind: MatchKind, sentence: string): string[] {
  const tokens = tokenize(sentence);
  return candidatesFor(kind, tokens, sentence).map((index) => tokens[index]!.text);
}

type Case = [kind: MatchKind, sentence: string, expected: string[]];

/** What each matcher picks, and what it leaves alone. One or two cases for every kind. */
const CASES: Case[] = [
  // A1
  ["subject-pronoun", "She is a nurse.", ["She"]],
  ["subject-pronoun", "Sara is a nurse.", []],
  ["be-negative", "He isn't at home.", ["isn't"]],
  ["be-negative", "He is not at home.", ["not"]],
  ["be-negative", "He doesn't work.", []],
  ["be-question", "Are you ready?", ["Are"]],
  ["be-question", "You are ready.", []],
  ["be-question", "Do you like tea?", []],
  ["be-feeling", "I am hungry.", ["am"]],
  ["be-feeling", "I am 20 years old.", ["am"]],
  ["be-feeling", "I am a doctor.", []],
  ["have-got", "She has got a dog.", ["got"]],
  ["have-got", "She got a dog.", []],
  ["possessive-pronoun", "This bag is mine.", ["mine"]],
  ["possessive-pronoun", "This is my bag.", []],
  ["adverb-manner", "She speaks slowly.", ["slowly"]],
  ["adverb-manner", "She is lovely.", []],
  ["wh-start-more", "Why are you late?", ["Why"]],
  ["wh-start-more", "How much is it?", []],
  ["wh-start-more", "Why are you late.", []],
  ["wh-do", "Where do you live?", ["do"]],
  ["wh-do", "Where is the bank?", []],
  ["how-much-many", "How many books do you have?", ["many"]],
  ["how-much-many", "How are you?", []],
  ["request", "Could you help me?", ["Could"]],
  ["request", "Can I sit here?", ["Can"]],
  ["request", "Could she help?", []],
  ["lets", "Let's go.", ["Let's"]],
  ["like-ing", "I like swimming.", ["swimming"]],
  ["like-ing", "I like dogs.", []],
  ["want-to", "I want to learn.", ["to"]],
  ["want-to", "I want to the shop.", []],
  ["want-to", "I went to school.", []],
  ["place-more", "The cat is behind the door.", ["behind"]],
  ["place-more", "The cat is on the door.", []],
  ["linker-basic", "I was tired because I worked.", ["because"]],
  ["linker-basic", "Because I was tired, I slept.", []],
  ["there-was", "There was a book.", ["was"]],
  ["there-was", "It was a book.", []],

  // A2–B1
  ["when-while", "I was cooking when she called.", ["when"]],
  ["when-while", "When did she call?", []],
  ["used-to", "I used to live here.", ["used"]],
  ["used-to", "I am used to living here.", []],
  ["irregular-participle", "I have seen it.", ["seen"]],
  ["irregular-participle", "I saw it.", []],
  ["time-clause", "I wash my hands before I eat.", ["before"]],
  ["time-clause", "Before dinner, I wash my hands.", []],
  ["for-since", "I have lived here for five years.", ["for"]],
  ["for-since", "I have lived here since 2020.", ["since"]],
  ["for-since", "I live here for fun.", []],
  ["just-already-yet", "I have just finished.", ["just"]],
  ["just-already-yet", "I just finished.", []],
  ["been-gone", "She has gone to Paris.", ["gone"]],
  ["been-gone", "I have been to Paris.", ["been"]],
  ["been-gone", "I have been waiting.", []],
  ["ever-question", "Have you ever eaten sushi?", ["ever"]],
  ["ever-question", "Did you ever eat sushi?", []],
  ["continuous-future", "I am meeting Ali tomorrow.", ["meeting"]],
  ["continuous-future", "I am meeting Ali.", []],
  ["will", "I will help you.", ["will"]],
  ["will", "I'll help you.", ["I'll"]],
  ["will", "If it rains, I will stay.", []],
  ["future-clause", "I will call you when I arrive.", ["when"]],
  ["future-clause", "I called when I arrived.", []],
  ["should", "You should rest.", ["should"]],
  ["should", "You should have rested.", []],
  ["have-to", "I have to go.", ["have"]],
  ["have-to", "I have a car.", []],
  ["may-might", "It might rain.", ["might"]],
  ["may-might", "It might have rained.", []],
  ["could", "I could swim.", ["could"]],
  ["could", "I could have swum.", []],
  ["able-to", "I am able to swim.", ["able"]],
  ["need-to", "I need to go.", ["need"]],
  ["need-to", "I need water.", []],
  ["superlative", "He is the tallest boy.", ["tallest"]],
  ["superlative", "It is the best day.", ["best"]],
  ["superlative", "It is the most beautiful city.", ["most"]],
  ["superlative", "It is the test.", []],
  ["as-as", "She is as tall as me.", ["as"]],
  ["as-as", "Call me as soon as you can.", []],
  ["too-enough", "It is too hot.", ["too"]],
  ["too-enough", "It is hot enough.", ["enough"]],
  ["too-enough", "I like it too.", []],
  ["such", "It was such a big house.", ["such"]],
  ["ed-ing-adjective", "The film is boring.", ["boring"]],
  ["ed-ing-adjective", "I am bored.", ["bored"]],
  ["few-little", "I have a few books.", ["few"]],
  ["few-little", "Few people came.", []],
  ["some-compound", "I want something.", ["something"]],
  ["all-both", "All my friends came.", ["All"]],
  ["all-both", "Both brothers are here.", ["Both"]],
  ["all-both", "They love each other.", []],
  ["the-unique", "The sun is hot.", ["The"]],
  ["the-unique", "The man is hot.", []],
  ["reflexive", "She cut herself.", ["herself"]],
  ["reflexive", "They love each other.", ["each"]],
  ["one-ones", "I like the red one.", ["one"]],
  ["one-ones", "I have one book.", []],
  ["question-tag", "It's cold, isn't it?", ["isn't"]],
  ["question-tag", "Is it cold?", []],
  ["indirect-question", "Do you know where she lives?", ["where"]],
  ["indirect-question", "Where does she live?", []],
  ["so-neither", "I like tea. So do I.", ["So"]],
  ["so-neither", "So much for that.", []],
  ["suggestion", "How about going out?", ["about"]],
  ["suggestion", "Why don't we go?", ["don't"]],
  ["unless", "Unless you hurry, you will be late.", ["Unless"]],
  ["relative-who", "The man who lives next door is a doctor.", ["who"]],
  ["relative-who", "Who is that man?", []],
  ["relative-where", "This is the school where I studied.", ["where"]],
  ["relative-where", "Where is the school?", []],
  ["reported-that", "She said that she was tired.", ["that"]],
  ["reported-that", "I think that is good.", []],
  ["although", "Although it was cold, we went out.", ["Although"]],
  ["although", "It was cold. However, we went out.", ["However"]],
  ["purpose", "I left early in order to be on time.", ["order"]],
  ["purpose", "I left so that I wasn't late.", ["so"]],
  ["verb-to", "I hope to travel.", ["to"]],
  ["verb-to", "I went to school.", []],
  ["verb-obj-to", "She told me to wait.", ["to"]],
  ["verb-obj-to", "I want to go.", []],
  ["like-to", "I prefer to walk.", ["to"]],
  ["like-to", "I prefer walking.", ["walking"]],

  // B2
  ["past-perfect-continuous", "She had been working all day.", ["working"]],
  ["future-continuous", "I will be flying tomorrow.", ["flying"]],
  ["future-perfect", "I will have finished by June.", ["finished"]],
  ["be-used-to", "I am used to getting up early.", ["used"]],
  ["be-used-to", "I used to live there.", []],
  ["third-conditional", "If I had studied, I would have passed.", ["would"]],
  ["third-conditional", "If I studied, I would pass.", []],
  ["wish-past-perfect", "I wish I had studied more.", ["had"]],
  ["wish-past-perfect", "If only I had listened.", ["had"]],
  ["wish-would", "I wish you would stop.", ["would"]],
  ["conditional-linker", "Take an umbrella in case it rains.", ["case"]],
  ["conditional-linker", "You can go provided you finish.", ["provided"]],
  ["would-rather", "I would rather stay.", ["rather"]],
  ["would-rather", "I'd rather stay.", ["rather"]],
  ["passive-modal", "The door must be locked.", ["locked"]],
  ["passive-perfect", "The house has been sold.", ["sold"]],
  ["passive-perfect", "The house is being built.", ["built"]],
  ["passive-reporting", "He is said to be rich.", ["said"]],
  ["causative", "I had my car repaired.", ["repaired"]],
  ["reported-question", "She asked where I lived.", ["where"]],
  ["reported-question", "She asked me if I was ready.", ["if"]],
  ["reported-command", "She told me to sit down.", ["to"]],
  ["reporting-verb", "He admitted stealing the money.", ["admitted"]],
  ["deduction", "He must be tired.", ["must"]],
  ["deduction", "The door must be locked.", []],
  ["deduction-past", "He must have forgotten.", ["must"]],
  ["had-better", "You had better hurry.", ["better"]],
  ["had-better", "You ought to rest.", ["ought"]],
  ["supposed-to", "You are supposed to be here.", ["supposed"]],
  ["non-defining", "My brother, who lives in Erbil, is a doctor.", ["who"]],
  ["non-defining", "The man who lives here is a doctor.", []],
  ["relative-prep", "This is the man with whom I work.", ["whom"]],
  ["participle-clause", "Walking home, I met a friend.", ["Walking"]],
  ["participle-clause", "Walking is fun.", []],
  ["stop-remember", "I stopped smoking.", ["smoking"]],
  ["stop-remember", "I stopped to rest.", ["to"]],
  ["perception-ing", "I saw him running.", ["running"]],
  ["make-let", "She made me wait.", ["wait"]],
  ["despite", "Despite the rain, we went out.", ["Despite"]],
  ["despite", "In spite of the rain, we went out.", ["spite"]],
  ["formal-linker", "It is cheap. Moreover, it is strong.", ["Moreover"]],
  ["cleft", "It was Ali who broke it.", ["who"]],
  ["cleft", "What I need is a rest.", ["What"]],
  ["inversion", "Never have I seen this.", ["Never"]],
  ["inversion", "Not only did he win, but he also broke the record.", ["only"]],
  ["less-fewer", "There are fewer cars.", ["fewer"]],
  ["less-fewer", "A number of students came.", ["number"]],
  ["the-more", "The more you practise, the better you get.", ["The"]],
  ["dependent-prep", "She is good at maths.", ["at"]],
];

test("each matcher picks the word it is about, and leaves the sentences that only look like it", () => {
  for (const [kind, sentence, expected] of CASES) {
    assert.deepEqual(picked(kind, sentence), expected, `${kind}: ${sentence}`);
  }
});

test("every matcher is on the syllabus and has at least one case above", () => {
  const onSyllabus = new Set(SYLLABUS.map((rule) => rule.match));
  const tested = new Set(CASES.map(([kind]) => kind));
  for (const kind of Object.keys(EXTRA_MATCHERS)) {
    assert.ok(onSyllabus.has(kind as MatchKind), `${kind} is used by a rule`);
    assert.ok(tested.has(kind as MatchKind), `${kind} is tested`);
  }
});

test("a rule with no matcher picks nothing", () => {
  assert.deepEqual(picked("none", "She is a nurse."), []);
});
