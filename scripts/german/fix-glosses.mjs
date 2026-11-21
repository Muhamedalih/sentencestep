// One-off: gives every separable-verb particle and auxiliary a real learning gloss (the way Duolingo/Babbel hints do):
//   particle  -> "تكملة: <meaning of the whole verb>"      auxiliary -> "<its own meaning> (مساعد)"
import fs from "node:fs";
const P = (v) => `تكملة: ${v}`;
const fixes = {
  "normal-1 s5 #8": "أملك (مساعد)",
  "normal-2 s1 #8": P("استيقظ"), "normal-2 s2 #7": P("ارتدى"), "normal-2 s4 #4": P("انطلق"),
  "normal-2 s7 #8": "كان سـ (مساعد)", "normal-2 s9 #11": P("وصل"),
  "normal-3 s2 #1": "كان لدينا (مساعد)", "normal-3 s3 #9": "كان سـ (مساعد)", "normal-3 s6 #3": P("وصل"),
  "normal-3 s7 #6": P("بدأ"), "normal-3 s8 #3": P("بدا"),
  "normal-4 s6 #5": "كان سـ (مساعد)", "normal-4 s8 #2": P("اتصل"), "normal-4 s9 #4": P("بدا"),
  "normal-5 s2 #1": "كنتُ (مساعد)", "normal-5 s5 #12": "كان لديّ (مساعد)",
  "normal-6 s1 #8": P("ترك"), "normal-6 s6 #10": "كان لديّ (مساعد)", "normal-6 s9 #7": "أملك (مساعد)",
  "normal-7 s6 #2": P("اعترف"),
  "normal-9 s2 #5": P("بدا"), "normal-9 s4 #10": P("وصل"), "normal-9 s6 #5": P("تحقق"),
  "normal-9 s7 #4": P("ملأ"), "normal-9 s7 #11": P("أعاد"),
  "normal-11 s1 #2": P("بدأ"), "normal-11 s2 #12": P("عرض"), "normal-11 s3 #2": P("رفض"), "normal-11 s4 #3": P("انتشر"),
  "normal-10 s4 #11": P("امتد"), "normal-10 s5 #3": P("أقنع"), "normal-10 s8 #5": "لو كان لديها (مساعد)", "normal-10 s9 #5": P("بنى"),
  "normal-12 s2 #3": P("حول"), "normal-12 s2 #5": P("افترض"), "normal-12 s2 #10": "كان سـ (مساعد)",
  "normal-12 s3 #8": P("وزن"), "normal-12 s4 #12": P("بدا"), "normal-12 s5 #5": P("بدا"), "normal-12 s9 #14": "أملك (مساعد)",
  "normal-13 s3 #9": P("توقف"), "normal-13 s4 #3": P("انطفأ"), "normal-13 s4 #8": P("بدأ"),
  "normal-14 s5 #4": P("بدأ"),
};
const used = new Set();
for (const f of ["normal-01.mjs", "normal-02-06.mjs", "normal-07-14.mjs"]) {
  const p = new URL(`./content/${f}`, import.meta.url);
  const { lessons } = await import(p.href);
  for (const l of lessons) for (const s of l.sentences) s.gl = s.gl.map((g, i) => {
    const k = `${l.sourceId} ${s.src} #${i}`; if (fixes[k]) { used.add(k); return fixes[k]; } return g; });
  const lines = lessons.map((l) => `  { sourceId: ${JSON.stringify(l.sourceId)}, title: ${JSON.stringify(l.title)}, description: ${JSON.stringify(l.description)},\n    sentences: [\n${l.sentences.map((s) => `      { src: ${JSON.stringify(s.src)}, de: ${JSON.stringify(s.de)}, gl: ${JSON.stringify(s.gl)} },`).join("\n")}\n    ] },`);
  fs.writeFileSync(new URL(p), `// German daily lessons (ids as in the database). gl = one Arabic gloss per whitespace word of de.\n// A separable-verb particle is glossed "تكملة: <the whole verb>", an auxiliary "<its meaning> (مساعد)".\nexport const lessons = [\n${lines.join("\n")}\n];\n`);
}
const missing = Object.keys(fixes).filter((k) => !used.has(k));
console.log("applied", used.size, "of", Object.keys(fixes).length, missing.length ? "MISSING " + missing : "");
