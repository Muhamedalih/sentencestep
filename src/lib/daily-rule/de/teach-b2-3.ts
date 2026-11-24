/** German rules de-b2-31 ... de-b2-45 (more linking words, relative clauses, participles, precise style). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_B2_3: Readonly<Record<string, RuleTeach>> = {
  "de-b2-31": {
    idea: lines(
      "bevor and ehe (before) open a clause about what happens later. The verb goes to the end: Bevor ich gehe, rufe ich an.",
      "bevor وehe (قبل أن) تفتحان جملة عمّا يحدث لاحقاً. ويذهب الفعل إلى الآخر: Bevor ich gehe, rufe ich an.",
      "bevor y ehe (antes de que) abren una oración sobre lo que ocurre después. El verbo va al final: Bevor ich gehe, rufe ich an.",
      "bevor ve ehe (-meden önce) sonra olan şeyle ilgili cümle açar. Fiil sona gider: Bevor ich gehe, rufe ich an.",
    ),
    right: "[Bevor] ich gehe, rufe ich an.",
    wrong: "[Bevor] ich gehe, [ich rufe] an.",
    notes: [
      note(
        "detail",
        lines(
          "ehe is the same as bevor, but more formal. Do not use nicht in the clause for a normal meaning: Bevor ich gehe (before I leave), not Bevor ich nicht gehe.",
          "ehe مثل bevor لكنها أكثر رسمية. ولا تستعمل nicht في الجملة بالمعنى العادي: Bevor ich gehe (قبل أن أذهب) وليس Bevor ich nicht gehe.",
          "ehe es igual que bevor, pero más formal. No uses nicht en la oración con el sentido normal: Bevor ich gehe (antes de irme), no Bevor ich nicht gehe.",
          "ehe, bevor ile aynıdır ama daha resmîdir. Normal anlamda cümlede nicht kullanma: Bevor ich gehe (gitmeden önce), Bevor ich nicht gehe değil.",
        ),
        ["[Ehe] du gehst, sag Bescheid."],
      ),
    ],
    items: [
      "[Bevor] ich gehe, rufe ich an.",
      "Ich esse, [bevor] ich gehe.",
      "[Ehe] du gehst, sag Bescheid.",
      "Wasch dir die Hände, [bevor] du isst.",
      "Er rief an, [bevor] er kam.",
      "[Ehe] wir essen, waschen wir uns die Hände.",
    ],
  },
  "de-b2-32": {
    idea: lines(
      "sobald (as soon as), solange (as long as) and seitdem (since then) open a clause about time. The verb goes to the end: Sobald ich Zeit habe, rufe ich an.",
      "sobald (حالما) وsolange (ما دام) وseitdem (منذ أن) تفتح جملة عن الزمن. ويذهب الفعل إلى الآخر: Sobald ich Zeit habe, rufe ich an.",
      "sobald (en cuanto), solange (mientras) y seitdem (desde que) abren una oración de tiempo. El verbo va al final: Sobald ich Zeit habe, rufe ich an.",
      "sobald (-er etmez), solange (-diği sürece) ve seitdem (-den beri) zaman cümlesi açar. Fiil sona gider: Sobald ich Zeit habe, rufe ich an.",
    ),
    right: "[Sobald] ich Zeit habe, rufe ich an.",
    wrong: "[Sobald] ich Zeit [habe] ich, rufe an.",
    notes: [
      note(
        "detail",
        lines(
          "seit is a preposition (seit zwei Jahren) and seitdem a conjunction (seitdem er hier wohnt). Use the present when it is still true: Seitdem ich Deutsch lerne, lese ich viel.",
          "seit حرف جر (seit zwei Jahren) وseitdem أداة ربط (seitdem er hier wohnt). واستعمل المضارع إذا كان الأمر مستمراً: Seitdem ich Deutsch lerne, lese ich viel.",
          "seit es una preposición (seit zwei Jahren) y seitdem una conjunción (seitdem er hier wohnt). Usa el presente si sigue siendo cierto: Seitdem ich Deutsch lerne, lese ich viel.",
          "seit bir edattır (seit zwei Jahren), seitdem bir bağlaçtır (seitdem er hier wohnt). Hâlâ sürüyorsa şimdiki zamanı kullan: Seitdem ich Deutsch lerne, lese ich viel.",
        ),
        ["[Seitdem] ich Deutsch lerne, lese ich viel."],
      ),
    ],
    items: [
      "[Sobald] ich Zeit habe, rufe ich an.",
      "Ich bleibe hier, [solange] es regnet.",
      "[Seitdem] er in Berlin wohnt, lernt er Deutsch.",
      "Ruf an, [sobald] du ankommst.",
      "Ich helfe dir, [solange] ich kann.",
      "[Seitdem] ich Deutsch lerne, lese ich viel.",
    ],
  },
  "de-b2-33": {
    idea: lines(
      "sodass (so that, with the result that) opens a clause that gives the result. The verb goes to the end: Es regnete stark, sodass wir zu Hause blieben.",
      "sodass (بحيث) تفتح جملة تعطي النتيجة. ويذهب الفعل إلى الآخر: Es regnete stark, sodass wir zu Hause blieben.",
      "sodass (de modo que) abre una oración que da el resultado. El verbo va al final: Es regnete stark, sodass wir zu Hause blieben.",
      "sodass (öyle ki) sonucu veren bir cümle açar. Fiil sona gider: Es regnete stark, sodass wir zu Hause blieben.",
    ),
    right: "Es regnete stark, [sodass] wir zu Hause blieben.",
    wrong: "Es regnete stark, [sodass] wir blieben zu Hause.",
    notes: [
      note(
        "detail",
        lines(
          "You can also write so dass, or use so + adjective + dass to stress the degree: Es war so kalt, dass wir froren.",
          "ويمكن كتابتها so dass أو استعمال so + صفة + dass للتشديد على الدرجة: Es war so kalt, dass wir froren.",
          "También se escribe so dass, o se usa so + adjetivo + dass para destacar el grado: Es war so kalt, dass wir froren.",
          "so dass diye de yazılabilir; dereceyi vurgulamak için so + sıfat + dass kullanılır: Es war so kalt, dass wir froren.",
        ),
        ["Es war so kalt, [dass] wir froren."],
      ),
    ],
    items: [
      "Es regnete stark, [sodass] wir zu Hause blieben.",
      "Er sprach leise, [sodass] niemand ihn hörte.",
      "Sie arbeitete viel, [sodass] sie krank wurde.",
      "Der Zug hatte Verspätung, [sodass] ich zu spät kam.",
      "Die Musik war laut, [sodass] wir nichts verstanden.",
      "Er lief schnell, [sodass] wir ihn nicht einholten.",
    ],
  },
  "de-b2-34": {
    idea: lines(
      "dessen and deren mean «whose». dessen is for masculine and neuter nouns, deren for feminine and plural. They take no article after them: Der Mann, dessen Auto dort steht.",
      "dessen وderen تعنيان «الذي ... ـه / التي ... ـها». dessen للمذكر والمحايد، وderen للمؤنث والجمع. ولا يأتي بعدهما أداة: Der Mann, dessen Auto dort steht.",
      "dessen y deren significan «cuyo». dessen es para masculino y neutro, deren para femenino y plural. No llevan artículo detrás: Der Mann, dessen Auto dort steht.",
      "dessen ve deren «onun» anlamındadır. dessen eril ve nötr, deren dişil ve çoğul içindir. Arkalarından artikel gelmez: Der Mann, dessen Auto dort steht.",
    ),
    right: "Der Mann, [dessen] Auto dort steht, ist mein Nachbar.",
    wrong: "Der Mann, [der] Auto dort steht, ist mein Nachbar.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not add an article: dessen Auto (not dessen das Auto). And choose dessen / deren by the owner, not by the thing owned: die Frau, deren Auto ... (Frau is feminine).",
          "لا تضف أداة: dessen Auto (وليس dessen das Auto). واختر dessen / deren حسب المالك لا حسب الشيء المملوك: die Frau, deren Auto ... (Frau مؤنثة).",
          "No añadas artículo: dessen Auto (no dessen das Auto). Y elige dessen / deren según el poseedor, no la cosa poseída: die Frau, deren Auto ... (Frau es femenino).",
          "Artikel ekleme: dessen Auto (dessen das Auto değil). dessen / deren'i sahibe göre seç, sahip olunan şeye göre değil: die Frau, deren Auto ... (Frau dişildir).",
        ),
        ["Die Frau, [deren] Mann Arzt ist, wohnt hier."],
      ),
    ],
    items: [
      "Der Mann, [dessen] Auto dort steht, ist mein Nachbar.",
      "Die Frau, [deren] Mann Arzt ist, wohnt hier.",
      "Das Kind, [dessen] Mutter krank ist, bleibt zu Hause.",
      "Die Kinder, [deren] Eltern arbeiten, spielen draußen.",
      "Ich kenne einen Mann, [dessen] Bruder in Wien wohnt.",
      "Das ist die Lehrerin, [deren] Buch ich gelesen habe.",
    ],
  },
  "de-b2-35": {
    idea: lines(
      "A relative clause can start with a preposition: Das ist der Mann, mit dem ich arbeite. The preposition decides the case of the pronoun.",
      "يمكن لجملة الوصل أن تبدأ بحرف جر: Das ist der Mann, mit dem ich arbeite. وحرف الجر هو الذي يحدد حالة الضمير.",
      "Una oración de relativo puede empezar con una preposición: Das ist der Mann, mit dem ich arbeite. La preposición decide el caso del pronombre.",
      "İlgi cümlesi bir edatla başlayabilir: Das ist der Mann, mit dem ich arbeite. Zamirin hâlini edat belirler.",
    ),
    right: "Das ist der Mann, mit [dem] ich arbeite.",
    wrong: "Das ist der Mann, mit [den] ich arbeite.",
    notes: [
      note(
        "detail",
        lines(
          "Think of two steps: first the gender and number of the noun (der Mann → masculine), then the case the preposition needs (mit → dative → dem). Plural dative is denen.",
          "فكّر في خطوتين: أولاً جنس الاسم وعدده (der Mann ← مذكر)، ثم الحالة التي يطلبها حرف الجر (mit ← حالة الجر ← dem). وجمع حالة الجر denen.",
          "Piensa en dos pasos: primero el género y número del sustantivo (der Mann → masculino), luego el caso que pide la preposición (mit → dativo → dem). El dativo plural es denen.",
          "İki adım düşün: önce ismin cinsiyeti ve sayısı (der Mann → eril), sonra edatın istediği hâl (mit → Dativ → dem). Çoğul Dativ denen'dir.",
        ),
        ["Die Freunde, mit [denen] ich reise, sind nett."],
      ),
    ],
    items: [
      "Das ist der Mann, mit [dem] ich arbeite.",
      "Die Frau, mit [der] ich spreche, ist Ärztin.",
      "Das Haus, in [dem] wir wohnen, ist alt.",
      "Die Stadt, in [der] ich geboren bin, ist klein.",
      "Die Freunde, mit [denen] ich reise, sind nett.",
      "Das ist das Buch, von [dem] ich dir erzählt habe.",
    ],
  },
  "de-b2-36": {
    idea: lines(
      "After alles, nichts, etwas, das and a superlative, the relative pronoun is was: Alles, was er sagt, ist wahr. For a place: die Stadt, wo ich wohne.",
      "بعد alles وnichts وetwas وdas وviel وصيغة التفضيل يكون ضمير الوصل was: Alles, was er sagt, ist wahr. وللمكان يمكن استعمال wo: Die Stadt, wo ich geboren bin.",
      "Tras alles, nichts, etwas, das, viel y un superlativo, el pronombre relativo es was: Alles, was er sagt, ist wahr. Para un lugar puedes usar wo: Die Stadt, wo ich geboren bin.",
      "alles, nichts, etwas, das, viel ve bir enüstünlükten sonra ilgi zamiri was'tır: Alles, was er sagt, ist wahr. Yer için wo kullanılabilir: Die Stadt, wo ich geboren bin.",
    ),
    right: "Alles, [was] er sagt, ist wahr.",
    wrong: "Alles, [das] er sagt, ist wahr.",
    notes: [
      note(
        "exception",
        lines(
          "After alles and nichts it is never das: alles, was ... and nichts, was ... In careful writing, for a place, use in der / in dem: Die Stadt, in der ich geboren bin.",
          "بعد alles وnichts لا تكون das أبداً: alles, was ... وnichts, was ... وفي الكتابة الدقيقة للمكان استعمل in der / in dem: Die Stadt, in der ich geboren bin.",
          "Tras alles y nichts nunca es das: alles, was ... y nichts, was ... En escritura cuidada, para un lugar, usa in der / in dem: Die Stadt, in der ich geboren bin.",
          "alles ve nichts'ten sonra asla das olmaz: alles, was ... ve nichts, was ... Özenli yazıda yer için in der / in dem kullan: Die Stadt, in der ich geboren bin.",
        ),
        ["Das ist nichts, [was] ich kenne."],
      ),
    ],
    items: [
      "Alles, [was] er sagt, ist wahr.",
      "Das ist nichts, [was] ich kenne.",
      "Das Beste, [was] ich kenne, ist Tee.",
      "Das ist die Stadt, [wo] ich geboren bin.",
      "Es gibt vieles, [was] ich nicht weiß.",
      "Ich zeige dir das Haus, [wo] ich wohne.",
    ],
  },
  "de-b2-37": {
    idea: lines(
      "The participle I is the infinitive + d, and it works like an adjective: schlafen → schlafend, das schlafende Kind (the child who is sleeping).",
      "اسم الفاعل (Partizip I) هو المصدر + d، ويعمل مثل الصفة: schlafen ← schlafend، das schlafende Kind (الطفل النائم).",
      "El participio I es el infinitivo + d y funciona como un adjetivo: schlafen → schlafend, das schlafende Kind (el niño que duerme).",
      "Partizip I mastar + d'dir ve sıfat gibi çalışır: schlafen → schlafend, das schlafende Kind (uyuyan çocuk).",
    ),
    right: "Das [schlafende] Kind ist süß.",
    wrong: "Das [schlafen] Kind ist süß.",
    notes: [
      note(
        "detail",
        lines(
          "It shows an action that is happening at the same time, and it takes adjective endings: die lachenden Kinder, ein laufender Mann. It can also be an adverb with no ending: Er kam lachend herein.",
          "يدل على فعل يحدث في الوقت نفسه ويأخذ نهايات الصفات: die lachenden Kinder، ein laufender Mann. ويمكن أن يكون ظرفاً بلا نهاية: Er kam lachend herein.",
          "Muestra una acción que ocurre a la vez y toma terminaciones de adjetivo: die lachenden Kinder, ein laufender Mann. También puede ser un adverbio sin terminación: Er kam lachend herein.",
          "Aynı anda olan bir eylemi gösterir ve sıfat ekleri alır: die lachenden Kinder, ein laufender Mann. Eksiz zarf da olabilir: Er kam lachend herein.",
        ),
        ["Er kam [lachend] herein."],
      ),
    ],
    items: [
      "Das [schlafende] Kind ist süß.{schlafen}",
      "Die [lachenden] Kinder spielen.{lachen}",
      "Ich sehe einen [laufenden] Mann.{laufen}",
      "Der [kommende] Winter wird kalt.{kommen}",
      "Die [steigenden] Preise sind ein Problem.{steigen}",
      "Der [folgende] Satz ist wichtig.{folgen}",
    ],
  },
  "de-b2-38": {
    idea: lines(
      "The past participle can be an adjective too, and it takes adjective endings: das gekochte Ei (the egg that was cooked), die geöffnete Tür (the door that is open).",
      "يمكن أن يكون اسم المفعول (Partizip II) صفة أيضاً ويأخذ نهايات الصفات: das gekochte Ei (البيضة المسلوقة)، die geöffnete Tür (الباب المفتوح).",
      "El participio II también puede ser un adjetivo y toma terminaciones de adjetivo: das gekochte Ei (el huevo cocido), die geöffnete Tür (la puerta abierta).",
      "Partizip II de sıfat olabilir ve sıfat ekleri alır: das gekochte Ei (haşlanmış yumurta), die geöffnete Tür (açık kapı).",
    ),
    right: "Das [gekochte] Ei ist heiß.",
    wrong: "Das [kochte] Ei ist heiß.",
    notes: [
      note(
        "detail",
        lines(
          "It describes the result of an action: das geschlossene Geschäft (closed), der gestohlene Wagen (stolen). Add the ending the article asks for: ein gekochtes Ei, ein gekochter Fisch.",
          "يصف نتيجة الفعل: das geschlossene Geschäft (المغلق)، der gestohlene Wagen (المسروقة). وأضف النهاية التي تطلبها الأداة: ein gekochtes Ei، ein gekochter Fisch.",
          "Describe el resultado de una acción: das geschlossene Geschäft (cerrada), der gestohlene Wagen (robado). Añade la terminación que pide el artículo: ein gekochtes Ei, ein gekochter Fisch.",
          "Bir eylemin sonucunu anlatır: das geschlossene Geschäft (kapalı), der gestohlene Wagen (çalıntı). Artikelin istediği eki ekle: ein gekochtes Ei, ein gekochter Fisch.",
        ),
        ["Der [geschlossene] Laden ist leer."],
      ),
    ],
    items: [
      "Das [gekochte] Ei ist heiß.{kochen}",
      "Die [geöffnete] Tür ist breit.{öffnen}",
      "Ich liebe [gebratenen] Fisch.{braten}",
      "Das [gebrochene] Bein heilt.{brechen}",
      "Der [geschlossene] Laden ist leer.{schließen}",
      "Die [gestohlene] Tasche war teuer.{stehlen}",
    ],
  },
  "de-b2-39": {
    idea: lines(
      "In formal writing a participle phrase can stand before the noun, between the article and the noun: der von ihm geschriebene Brief (the letter written by him).",
      "في الكتابة الرسمية يمكن أن تقف عبارة اسم المفعول قبل الاسم بين الأداة والاسم: der von ihm geschriebene Brief (الرسالة التي كتبها).",
      "En la escritura formal una frase con participio puede ir ante el sustantivo, entre el artículo y el sustantivo: der von ihm geschriebene Brief (la carta escrita por él).",
      "Resmî yazıda ortaçlı bir öbek isimden önce, artikel ile isim arasında durabilir: der von ihm geschriebene Brief (onun yazdığı mektup).",
    ),
    right: "Der von ihm [geschriebene] Brief ist lang.",
    wrong: "Der von ihm [geschrieben] Brief ist lang.",
    notes: [
      note(
        "detail",
        lines(
          "Read from the article to the participle: it is a long relative clause squeezed in: der Brief, der von ihm geschrieben wurde. The participle takes the adjective ending, and the noun comes last.",
          "اقرأ من الأداة إلى الـ Partizip: إنها جملة وصل طويلة مضغوطة: der Brief, der von ihm geschrieben wurde. ويأخذ الـ Partizip نهاية الصفة، ويأتي الاسم أخيراً.",
          "Lee desde el artículo hasta el participio: es una oración de relativo larga comprimida: der Brief, der von ihm geschrieben wurde. El participio toma la terminación de adjetivo y el sustantivo va al final.",
          "Artikelden ortaca kadar oku: sıkıştırılmış uzun bir ilgi cümlesidir: der Brief, der von ihm geschrieben wurde. Ortaç sıfat eki alır ve isim en sonda gelir.",
        ),
        ["Das vom Lehrer [gestellte] Problem ist schwer."],
      ),
    ],
    items: [
      "Der von ihm [geschriebene] Brief ist lang.",
      "Die in Berlin [gebaute] Brücke ist neu.",
      "Das vom Lehrer [gestellte] Problem ist schwer.",
      "Der gestern im Fernsehen [gezeigte] Film war spannend.",
      "Die von der Firma [angebotene] Stelle ist gut.",
      "Das auf dem Tisch [liegende] Buch gehört mir.",
    ],
  },
  "de-b2-40": {
    idea: lines(
      "More prepositions take the genitive in formal German: aufgrund, innerhalb, außerhalb, anlässlich, wegen, trotz, statt: aufgrund des Wetters, innerhalb der Stadt.",
      "حروف جر أخرى تأخذ الإضافة (Genitiv) في الألمانية الرسمية: aufgrund وinnerhalb وaußerhalb وanlässlich وwegen وtrotz وstatt: aufgrund des Wetters، innerhalb der Stadt.",
      "Más preposiciones llevan genitivo en alemán formal: aufgrund, innerhalb, außerhalb, anlässlich, wegen, trotz, statt: aufgrund des Wetters, innerhalb der Stadt.",
      "Resmî Almancada daha fazla edat Genitiv alır: aufgrund, innerhalb, außerhalb, anlässlich, wegen, trotz, statt: aufgrund des Wetters, innerhalb der Stadt.",
    ),
    right: "[Aufgrund] des Wetters fällt das Fest aus.",
    wrong: "Aufgrund [dem] Wetter fällt das Fest aus.",
    notes: [
      note(
        "detail",
        lines(
          "Masculine and neuter nouns add -(e)s after des: des Wetters, des Hauses. Feminine and plural use der: der Stadt, der Kinder. These prepositions are typical of writing.",
          "المذكر والمحايد يضيفان -(e)s بعد des: des Wetters، des Hauses. والمؤنث والجمع يستعملان der: der Stadt، der Kinder. وهذه الحروف نموذجية للكتابة.",
          "Los masculinos y neutros añaden -(e)s tras des: des Wetters, des Hauses. Los femeninos y plurales usan der: der Stadt, der Kinder. Estas preposiciones son típicas de la escritura.",
          "Eril ve nötr isimler des'ten sonra -(e)s alır: des Wetters, des Hauses. Dişil ve çoğul der kullanır: der Stadt, der Kinder. Bu edatlar yazıya özgüdür.",
        ),
        ["Er wohnt [außerhalb] der Stadt."],
      ),
    ],
    items: [
      "[Aufgrund] des Wetters fällt das Fest aus.",
      "Er wohnt [außerhalb] der Stadt.",
      "[Innerhalb] einer Woche ist es fertig.",
      "[Anlässlich] seines Geburtstags gibt es Kuchen.",
      "[Aufgrund] einer Krankheit bleibt sie zu Hause.",
      "[Außerhalb] der Öffnungszeiten ist das Büro zu.",
    ],
  },
  "de-b2-41": {
    idea: lines(
      "Many verbs and adjectives have a noun form: -ung (die Entscheidung), -keit / -heit (die Freundlichkeit), -schaft (die Freundschaft). These endings are feminine.",
      "كثير من الأفعال والصفات له صيغة اسمية: -ung (entscheiden ← die Entscheidung)، -keit / -heit (freundlich ← die Freundlichkeit)، -schaft (die Freundschaft). وهذه النهايات مؤنثة دائماً.",
      "Muchos verbos y adjetivos tienen una forma de sustantivo: -ung (entscheiden → die Entscheidung), -keit / -heit (freundlich → die Freundlichkeit), -schaft (die Freundschaft). Estas terminaciones son siempre femeninas.",
      "Birçok fiil ve sıfatın isim biçimi vardır: -ung (entscheiden → die Entscheidung), -keit / -heit (freundlich → die Freundlichkeit), -schaft (die Freundschaft). Bu ekler her zaman dişildir.",
    ),
    right: "Die [Entscheidung] war schwer.",
    wrong: "Der [Entscheidung] war schwer.",
    notes: [
      note(
        "detail",
        lines(
          "Plurals: -ungen, -keiten, -heiten, -schaften (die Entscheidungen). Nouns like these make a text more formal; speech often uses the verb: Wir haben entschieden.",
          "الجمع: -ungen و-keiten و-heiten و-schaften (die Entscheidungen). وأسماء كهذه تجعل النص أكثر رسمية، بينما يستعمل الكلام الفعل غالباً: Wir haben entschieden.",
          "Plurales: -ungen, -keiten, -heiten, -schaften (die Entscheidungen). Sustantivos así hacen el texto más formal; al hablar se usa a menudo el verbo: Wir haben entschieden.",
          "Çoğullar: -ungen, -keiten, -heiten, -schaften (die Entscheidungen). Böyle isimler metni daha resmî yapar; konuşmada çoğu zaman fiil kullanılır: Wir haben entschieden.",
        ),
        ["Die [Entscheidungen] waren schwer."],
      ),
    ],
    items: [
      "Die [Entscheidung] war schwer.{entscheiden}",
      "Seine [Freundlichkeit] gefällt mir.{freundlich}",
      "Die [Wohnung] ist klein.{wohnen}",
      "Die [Gesundheit] ist wichtig.{gesund}",
      "Die [Erfahrung] hilft mir.{erfahren}",
      "Unsere [Freundschaft] ist alt.{Freund}",
    ],
  },
  "de-b2-42": {
    idea: lines(
      "Some verbs with a preposition take a da-word that points to the dass-clause: Ich warte darauf, dass er anruft. Ich freue mich darauf, dass du kommst.",
      "بعض الأفعال ذات حرف الجر تأخذ كلمة da- تشير إلى جملة dass: Ich warte darauf, dass er anruft. Ich freue mich darauf, dass du kommst.",
      "Algunos verbos con preposición llevan una palabra da- que apunta a la oración con dass: Ich warte darauf, dass er anruft. Ich freue mich darauf, dass du kommst.",
      "Edatlı bazı fiiller dass cümlesine işaret eden bir da- sözcüğü alır: Ich warte darauf, dass er anruft. Ich freue mich darauf, dass du kommst.",
    ),
    right: "Ich warte [darauf], dass er anruft.",
    wrong: "Ich warte [auf], dass er anruft.",
    notes: [
      note(
        "detail",
        lines(
          "The da-word (darauf, darüber, daran, dafür, davon, darum) is a placeholder. With the same subject use zu instead of dass: Ich freue mich darauf, dich zu sehen.",
          "كلمة da- (darauf وdarüber وdaran وdafür وdavon وdarum) محلّ مؤقت للجملة. ومع الفاعل نفسه استعمل zu بدل dass: Ich freue mich darauf, dich zu sehen.",
          "La palabra da- (darauf, darüber, daran, dafür, davon, darum) es un sustituto. Con el mismo sujeto usa zu en vez de dass: Ich freue mich darauf, dich zu sehen.",
          "da- sözcüğü (darauf, darüber, daran, dafür, davon, darum) bir yer tutucudur. Özne aynıysa dass yerine zu kullan: Ich freue mich darauf, dich zu sehen.",
        ),
        ["Ich freue mich [darauf], dich zu sehen."],
      ),
    ],
    items: [
      "Ich warte [darauf], dass er anruft.",
      "Ich freue mich [darauf], dass du kommst.",
      "Sie achtet [darauf], dass alle pünktlich sind.",
      "Er bittet [darum], dass wir leise sind.",
      "Wir bestehen [darauf], dass er kommt.",
      "Ich ärgere mich [darüber], dass es regnet.",
    ],
  },
  "de-b2-43": {
    idea: lines(
      "Modal particles (doch, mal, eben, halt, eigentlich, bloß, ruhig, wohl) add feeling to a sentence. They have no fixed translation and they do not stand first.",
      "الأدوات الدقيقة (doch وmal وeben وhalt وeigentlich وbloß وruhig وwohl) تضيف شعوراً إلى الجملة. ليس لها ترجمة ثابتة ولا تقف في الأول.",
      "Las partículas modales (doch, mal, eben, halt, eigentlich, bloß, ruhig, wohl) añaden sentimiento a la frase. No tienen traducción fija y no van al principio.",
      "Modal parçacıklar (doch, mal, eben, halt, eigentlich, bloß, ruhig, wohl) cümleye duygu katar. Sabit çevirileri yoktur ve başta durmazlar.",
    ),
    right: "Komm [doch] mal vorbei!",
    wrong: "Komm [denn] mal vorbei!",
    notes: [
      note(
        "detail",
        lines(
          "doch softens an invitation, mal means «just» (Sag mal!), eben and halt mean «that is how it is» (Das ist eben so), eigentlich means «actually» (Wie spät ist es eigentlich?), ruhig means «go ahead».",
          "doch تلطّف الدعوة، وmal تعني «فقط» (Sag mal!)، وeben وhalt تعنيان «هكذا هو الأمر» (Das ist eben so)، وeigentlich تعني «في الحقيقة» (Wie spät ist es eigentlich؟)، وruhig تعني «تفضّل».",
          "doch suaviza una invitación, mal significa «solo» (Sag mal!), eben y halt significan «así es» (Das ist eben so), eigentlich significa «en realidad» (Wie spät ist es eigentlich?), ruhig significa «adelante».",
          "doch daveti yumuşatır, mal «bir» anlamındadır (Sag mal!), eben ve halt «işte böyle» demektir (Das ist eben so), eigentlich «aslında» demektir (Wie spät ist es eigentlich?), ruhig «çekinme» demektir.",
        ),
        ["Wie spät ist es [eigentlich]?", "Du kannst [ruhig] kommen."],
      ),
    ],
    items: [
      "Komm [doch] mal vorbei!",
      "Das ist [eben] so.",
      "Ich habe [halt] keine Zeit.",
      "Wie spät ist es [eigentlich]?",
      "Du kannst [ruhig] kommen.",
      "Sag [mal], wie geht's?",
    ],
  },
  "de-b2-44": {
    idea: lines(
      "Some verb + noun pairs are fixed: eine Entscheidung treffen (to decide), in Frage stellen (to question), zur Verfügung stellen (to offer). You cannot swap the verb.",
      "بعض أزواج الفعل + الاسم ثابتة ولها معنى واحد: eine Entscheidung treffen (يقرر)، in Frage stellen (يشكّك)، zur Verfügung stellen (يوفّر). ولا يمكن تبديل الفعل.",
      "Algunas parejas verbo + sustantivo son fijas y significan una cosa: eine Entscheidung treffen (decidir), in Frage stellen (cuestionar), zur Verfügung stellen (poner a disposición). No puedes cambiar el verbo.",
      "Bazı fiil + isim çiftleri sabittir ve tek bir anlam taşır: eine Entscheidung treffen (karar vermek), in Frage stellen (sorgulamak), zur Verfügung stellen (sağlamak). Fiili değiştiremezsin.",
    ),
    right: "Wir müssen eine Entscheidung [treffen].",
    wrong: "Wir müssen eine Entscheidung [machen].",
    notes: [
      note(
        "mistake",
        lines(
          "Do not translate the verb word for word. Your language may say «make a decision», but German says treffen: eine Entscheidung treffen. Learn the whole phrase.",
          "لا تترجم الفعل حرفياً. قد تقول لغتك «اتخذ قراراً» لكن الألمانية تقول treffen: eine Entscheidung treffen. تعلّم العبارة كلها.",
          "No traduzcas el verbo palabra por palabra. Tu idioma puede decir «tomar una decisión», pero el alemán dice treffen: eine Entscheidung treffen. Aprende la expresión entera.",
          "Fiili kelimesi kelimesine çevirme. Senin dilin «karar almak» diyebilir ama Almanca treffen der: eine Entscheidung treffen. Bütün kalıbı öğren.",
        ),
        ["Sie [nahm] zu dem Thema Stellung."],
      ),
    ],
    items: [
      "Wir müssen eine Entscheidung [treffen].{decide}",
      "Bitte nehmen Sie [Rücksicht] auf andere.{consideration}",
      "Ich möchte Ihnen meine Hilfe zur Verfügung [stellen].{offer}",
      "Er hat viele Fragen in Betracht [gezogen].{considered}",
      "Sie [nahm] zu dem Thema Stellung.{took a stand}",
      "Wir [stellen] diese Regel in Frage.{question}",
    ],
  },
  "de-b2-45": {
    idea: lines(
      "Many adjectives take a fixed preposition and case: stolz auf (+ accusative), abhängig von (+ dative), zufrieden mit (+ dative), verantwortlich für (+ accusative).",
      "كثير من الصفات يرتبط بحرف جر ثابت وحالة محددة: stolz auf (+ المفعول به)، abhängig von (+ حالة الجر)، zufrieden mit (+ حالة الجر)، interessiert an (+ حالة الجر)، verantwortlich für (+ المفعول به).",
      "Muchos adjetivos van con una preposición fija y un caso: stolz auf (+ acusativo), abhängig von (+ dativo), zufrieden mit (+ dativo), interessiert an (+ dativo), verantwortlich für (+ acusativo).",
      "Birçok sıfat sabit bir edat ve hâlle kullanılır: stolz auf (+ Akkusativ), abhängig von (+ Dativ), zufrieden mit (+ Dativ), interessiert an (+ Dativ), verantwortlich für (+ Akkusativ).",
    ),
    right: "Ich bin stolz [auf] meinen Sohn.",
    wrong: "Ich bin stolz [für] meinen Sohn.",
    notes: [
      note(
        "detail",
        lines(
          "Learn the adjective together with its preposition, like the verbs with a preposition. Typical ones: gespannt auf, neugierig auf, verliebt in, überzeugt von, typisch für, bekannt für.",
          "تعلّم الصفة مع حرف جرها كما تفعل مع الأفعال ذات حرف الجر. أشهرها: gespannt auf وneugierig auf وverliebt in وüberzeugt von وtypisch für وbekannt für.",
          "Aprende el adjetivo junto con su preposición, igual que los verbos con preposición. Típicos: gespannt auf, neugierig auf, verliebt in, überzeugt von, typisch für, bekannt für.",
          "Sıfatı edatıyla birlikte öğren, edatlı fiillerde olduğu gibi. Tipikler: gespannt auf, neugierig auf, verliebt in, überzeugt von, typisch für, bekannt für.",
        ),
        ["Ich bin gespannt [auf] den Film.", "Er ist verliebt [in] sie."],
      ),
    ],
    items: [
      "Ich bin stolz [auf] meinen Sohn.",
      "Er ist abhängig [von] seinen Eltern.",
      "Wir sind zufrieden [mit] dem Ergebnis.",
      "Sie ist interessiert [an] Kunst.",
      "Ich bin gespannt [auf] den Film.",
      "Er ist verantwortlich [für] das Projekt.",
    ],
  },
};
