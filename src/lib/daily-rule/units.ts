/**
 * The units of the syllabus: the groups the library's map shows, each with its name in the four languages and
 * the level it belongs to. A rule says which unit it is in (syllabus.ts); the units run in the order the
 * level opens them.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

import type { RuleLevel } from "./ladder";
import { lines, type Lines } from "./teach-types";

export interface UnitSpec {
  id: string;
  level: RuleLevel;
  title: Lines;
}

const unit = (
  id: string,
  level: RuleLevel,
  en: string,
  ar: string,
  es: string,
  tr: string,
): UnitSpec => ({
  id,
  level,
  title: lines(en, ar, es, tr),
});

export const UNITS: readonly UnitSpec[] = [
  unit("a1-basics", "A1", "Basics", "الأساسيات", "Lo básico", "Temeller"),
  unit(
    "a1-nouns",
    "A1",
    "Nouns and adjectives",
    "الأسماء والصفات",
    "Sustantivos y adjetivos",
    "İsimler ve sıfatlar",
  ),
  unit("a1-present", "A1", "Present simple", "المضارع البسيط", "Presente simple", "Geniş zaman"),
  unit("a1-questions", "A1", "Questions", "الأسئلة", "Preguntas", "Sorular"),
  unit(
    "a1-modals",
    "A1",
    "Modals and requests",
    "الأفعال المساعدة والأوامر",
    "Modales y peticiones",
    "Kip fiilleri ve istekler",
  ),
  unit(
    "a1-linking",
    "A1",
    "Prepositions and linking",
    "حروف الجر والربط",
    "Preposiciones y conectores",
    "Edatlar ve bağlaçlar",
  ),
  unit("a1-past", "A1", "Past", "الماضي", "Pasado", "Geçmiş zaman"),

  unit(
    "a2-tenses",
    "A2-B1",
    "Present and past",
    "الحاضر والماضي",
    "Presente y pasado",
    "Şimdiki ve geçmiş zaman",
  ),
  unit(
    "a2-perfect",
    "A2-B1",
    "Present perfect",
    "الـ present perfect",
    "Pretérito perfecto",
    "Present perfect",
  ),
  unit("a2-future", "A2-B1", "Future", "المستقبل", "Futuro", "Gelecek zaman"),
  unit("a2-modals", "A2-B1", "Modal verbs", "الأفعال المساعدة", "Verbos modales", "Kip fiilleri"),
  unit(
    "a2-comparison",
    "A2-B1",
    "Comparison and degree",
    "المقارنة والدرجة",
    "Comparación y grado",
    "Karşılaştırma ve derece",
  ),
  unit(
    "a2-nouns",
    "A2-B1",
    "Quantity, nouns and pronouns",
    "الكميات والأسماء والضمائر",
    "Cantidad, sustantivos y pronombres",
    "Miktar, isimler ve zamirler",
  ),
  unit(
    "a2-replies",
    "A2-B1",
    "Questions and replies",
    "الأسئلة والردود",
    "Preguntas y respuestas",
    "Sorular ve yanıtlar",
  ),
  unit(
    "a2-clauses",
    "A2-B1",
    "Clauses and linking",
    "الجمل المركبة",
    "Oraciones y conectores",
    "Yan cümleler ve bağlaçlar",
  ),
  unit(
    "a2-patterns",
    "A2-B1",
    "Verb patterns",
    "أنماط الأفعال",
    "Estructuras verbales",
    "Fiil kalıpları",
  ),

  unit(
    "b2-tenses",
    "B2",
    "Advanced tenses",
    "الأزمنة المتقدمة",
    "Tiempos avanzados",
    "İleri zamanlar",
  ),
  unit(
    "b2-conditionals",
    "B2",
    "Conditionals and wishes",
    "الشروط والتمنّي",
    "Condicionales y deseos",
    "Koşul cümleleri ve dilekler",
  ),
  unit(
    "b2-passive",
    "B2",
    "Passive and causative",
    "المبني للمجهول",
    "Voz pasiva y causativa",
    "Edilgen ve ettirgen",
  ),
  unit(
    "b2-reported",
    "B2",
    "Reported speech",
    "الكلام المنقول",
    "Estilo indirecto",
    "Dolaylı anlatım",
  ),
  unit("b2-modals", "B2", "Modal verbs", "الأفعال المساعدة", "Verbos modales", "Kip fiilleri"),
  unit(
    "b2-clauses",
    "B2",
    "Relative and participle clauses",
    "الجمل الموصولة",
    "Oraciones de relativo y de participio",
    "Sıfat ve ortaç yan cümleleri",
  ),
  unit(
    "b2-patterns",
    "B2",
    "Verb patterns",
    "أنماط الأفعال",
    "Estructuras verbales",
    "Fiil kalıpları",
  ),
  unit(
    "b2-linking",
    "B2",
    "Linking and emphasis",
    "الربط والتوكيد",
    "Conectores y énfasis",
    "Bağlaçlar ve vurgulama",
  ),
];

const BY_ID = new Map(UNITS.map((item) => [item.id, item]));

export function unitById(id: string): UnitSpec | undefined {
  return BY_ID.get(id);
}

/** A unit's name in the learner's language (Arabic until one is chosen); the id for a unit that does not exist. */
export function unitTitle(id: string, locale: SupportLocale | null): string {
  return BY_ID.get(id)?.title[locale ?? "ar"] ?? id;
}
