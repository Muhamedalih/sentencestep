/**
 * The units of the German syllabus (syllabus.ts of this folder): the groups the library's map shows, each with
 * its name in the four languages and the level it belongs to, in the order the level opens them.
 */

import type { RuleLevel } from "../ladder";
import { lines } from "../teach-types";
import type { UnitSpec } from "../units";

const unit = (
  id: string,
  level: RuleLevel,
  en: string,
  ar: string,
  es: string,
  tr: string,
): UnitSpec => ({ id, level, title: lines(en, ar, es, tr) });

export const DE_UNITS: readonly UnitSpec[] = [
  unit("de-a1-basics", "A1", "Basics", "الأساسيات", "Lo básico", "Temeller"),
  unit(
    "de-a1-nouns",
    "A1",
    "Nouns and articles",
    "الأسماء وأدوات التعريف",
    "Sustantivos y artículos",
    "İsimler ve artikeller",
  ),
  unit(
    "de-a1-questions",
    "A1",
    "Questions and negation",
    "الأسئلة والنفي",
    "Preguntas y negación",
    "Sorular ve olumsuzluk",
  ),
  unit("de-a1-verbs", "A1", "Verbs", "الأفعال", "Verbos", "Fiiller"),
  unit(
    "de-a1-cases",
    "A1",
    "Accusative and prepositions",
    "المفعول به وحروف الجر",
    "Acusativo y preposiciones",
    "Akkusativ ve edatlar",
  ),
  unit(
    "de-a1-time",
    "A1",
    "Time and daily life",
    "الوقت والحياة اليومية",
    "El tiempo y la vida diaria",
    "Zaman ve günlük hayat",
  ),
  unit("de-a2-perfekt", "A2-B1", "The Perfekt", "الماضي التام (Perfekt)", "El Perfekt", "Perfekt (geçmiş zaman)"),
  unit("de-a2-dative", "A2-B1", "The dative", "حالة الجر (Dativ)", "El dativo", "Dativ (-e hâli)"),
  unit("de-a2-adjectives", "A2-B1", "Adjectives", "الصفات", "Adjetivos", "Sıfatlar"),
  unit(
    "de-a2-clauses",
    "A2-B1",
    "Subordinate clauses",
    "الجمل التابعة",
    "Oraciones subordinadas",
    "Yan cümleler",
  ),
  unit("de-a2-verbs", "A2-B1", "More about verbs", "المزيد عن الأفعال", "Más sobre los verbos", "Fiiller hakkında daha fazlası"),
  unit(
    "de-a2-nouns",
    "A2-B1",
    "Nouns and pronouns",
    "الأسماء والضمائر",
    "Sustantivos y pronombres",
    "İsimler ve zamirler",
  ),
  unit(
    "de-a2-konjunktiv",
    "A2-B1",
    "Polite and unreal",
    "اللطف وغير الواقعي",
    "Cortesía e irreal",
    "Nezaket ve gerçek dışı",
  ),
  unit(
    "de-a2-expressions",
    "A2-B1",
    "Useful patterns",
    "تراكيب مفيدة",
    "Estructuras útiles",
    "Kullanışlı kalıplar",
  ),
  unit("de-b2-past", "B2", "Past and future", "الماضي والمستقبل", "Pasado y futuro", "Geçmiş ve gelecek"),
  unit("de-b2-passive", "B2", "The passive", "المبني للمجهول", "La pasiva", "Edilgen çatı"),
  unit(
    "de-b2-konjunktiv",
    "B2",
    "Konjunktiv and reported speech",
    "الصيغة الشرطية والكلام المنقول",
    "Konjunktiv y estilo indirecto",
    "Konjunktiv ve dolaylı anlatım",
  ),
  unit("de-b2-linking", "B2", "Linking clauses", "ربط الجمل", "Enlazar oraciones", "Cümleleri bağlamak"),
  unit(
    "de-b2-relative",
    "B2",
    "Relative clauses and participles",
    "الجمل الموصولة والصفات الفعلية",
    "Relativas y participios",
    "Ilgi cümleleri ve ortaçlar",
  ),
  unit("de-b2-style", "B2", "Precise style", "الأسلوب الدقيق", "Estilo preciso", "Kesin üslup"),
];
