/**
 * Numbers and symbols are written the way they are SAID. The typing screen asks for digits as keystrokes but a
 * learner hears "ninety percent", and it never asks for a key for "%": so "90%" becomes "ninety percent".
 * Years are the one case with several spoken forms: they are converted in the usual way and reported for review.
 */
const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const ORDINALS = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  5: "fifth",
  6: "sixth",
  7: "seventh",
  8: "eighth",
  9: "ninth",
  10: "tenth",
  11: "eleventh",
  12: "twelfth",
  13: "thirteenth",
  14: "fourteenth",
  15: "fifteenth",
  16: "sixteenth",
  17: "seventeenth",
  18: "eighteenth",
  19: "nineteenth",
  20: "twentieth",
  30: "thirtieth",
};

function below1000(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${below1000(n % 100)}` : ""}`;
}

export function numberToWords(n) {
  if (n < 1000) return below1000(n);
  const part = (value, unit) => (value ? `${numberToWords(value)} ${unit}` : "");
  const parts = [
    part(Math.floor(n / 1e9), "billion"),
    part(Math.floor((n % 1e9) / 1e6), "million"),
    part(Math.floor((n % 1e6) / 1e3), "thousand"),
    n % 1000 ? below1000(n % 1000) : "",
  ];
  return parts.filter(Boolean).join(" ");
}

export function yearToWords(y) {
  if (y === 2000) return "two thousand";
  if (y > 2000 && y < 2010) return `two thousand ${ONES[y - 2000]}`;
  const high = Math.floor(y / 100);
  const low = y % 100;
  if (low === 0) return `${below1000(high)} hundred`;
  return `${below1000(high)} ${low < 10 ? `oh ${ONES[low]}` : below1000(low)}`;
}

/** Spells the numbers of a text; returns the new text and the list of replacements to show. */
export function spellNumbers(text) {
  const changes = [];
  const out = text.replace(/(?<![\w.,])(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(st|nd|rd|th)?(%)?/g, (all, int, frac, ord, pct) => {
    const n = Number(int.replace(/,/g, ""));
    let words;
    if (ord) words = ORDINALS[n] ?? null;
    else if (frac) words = `${numberToWords(n)} point ${[...frac].map((d) => ONES[Number(d)]).join(" ")}`;
    else if (!int.includes(",") && int.length === 4 && n >= 1100 && n <= 2099 && !pct) words = yearToWords(n);
    else words = numberToWords(n);
    if (words === null) return all;
    if (pct) words += " percent";
    changes.push({ from: all, to: words, year: !frac && !ord && !int.includes(",") && int.length === 4 && n >= 1100 && n <= 2099 && !pct });
    return words;
  });
  return { text: out, changes };
}
