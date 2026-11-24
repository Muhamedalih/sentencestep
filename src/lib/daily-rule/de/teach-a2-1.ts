/** German rules de-a2-01 ... de-a2-15 (the Perfekt and the dative). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_A2_1: Readonly<Record<string, RuleTeach>> = {
  "de-a2-01": {
    idea: lines(
      "The Perfekt is the past tense of speech: haben (or sein) in the present + a past participle at the end of the sentence.",
      "الـ Perfekt هو الماضي في الكلام: haben (أو sein) في المضارع + اسم المفعول (Partizip II) في آخر الجملة.",
      "El Perfekt es el pasado de la lengua hablada: haben (o sein) en presente + un participio al final de la frase.",
      "Perfekt konuşma dilinin geçmiş zamanıdır: şimdiki zamanda haben (veya sein) + cümle sonunda bir ortaç (Partizip II).",
    ),
    right: "Ich [habe] Deutsch gelernt.",
    wrong: "Ich [bin] Deutsch gelernt.",
    notes: [
      note(
        "mistake",
        lines(
          "The past needs two parts, not one word. Ich habe gegessen (not Ich gegessen). The first part changes with the person, the participle does not.",
          "الماضي يحتاج جزأين لا كلمة واحدة: Ich habe gegessen (وليس Ich gegessen). الجزء الأول يتغيّر مع الشخص، أما الـ Partizip فلا يتغيّر.",
          "El pasado necesita dos partes: Ich habe gegessen (no Ich gegessen). La primera parte cambia con la persona, el participio no.",
          "Geçmiş zaman iki parçalıdır: Ich habe gegessen (Ich gegessen değil). İlk parça kişiye göre değişir, ortaç değişmez.",
        ),
        ["Wir [haben] Pizza gegessen.", "Er [hat] Pizza gegessen."],
      ),
    ],
    items: [
      "Gestern [habe] ich Pizza gegessen.",
      "Wir [haben] Fußball gespielt.",
      "Er [hat] ein Buch gekauft.",
      "Was [hast] du gemacht?",
      "Ihr [habt] viel gelernt.",
      "Sie [hat] mir geholfen.",
    ],
  },
  "de-a2-02": {
    idea: lines(
      "Regular verbs make the participle with ge- + stem + -t: machen → gemacht, lernen → gelernt, spielen → gespielt.",
      "الأفعال المنتظمة تصنع الـ Partizip بـ ge- + الجذر + -t: machen ← gemacht، lernen ← gelernt، spielen ← gespielt.",
      "Los verbos regulares forman el participio con ge- + raíz + -t: machen → gemacht, lernen → gelernt, spielen → gespielt.",
      "Düzenli fiiller ortacı ge- + kök + -t ile yapar: machen → gemacht, lernen → gelernt, spielen → gespielt.",
    ),
    right: "Ich habe Deutsch [gelernt].",
    wrong: "Ich habe Deutsch [gelernen].",
    notes: [
      note(
        "detail",
        lines(
          "If the stem ends in -t or -d, add an e: arbeiten → gearbeitet, warten → gewartet, baden → gebadet.",
          "إذا انتهى الجذر بـ -t أو -d نضيف e: arbeiten ← gearbeitet، warten ← gewartet، baden ← gebadet.",
          "Si la raíz acaba en -t o -d, añade una e: arbeiten → gearbeitet, warten → gewartet, baden → gebadet.",
          "Kök -t veya -d ile bitiyorsa e eklenir: arbeiten → gearbeitet, warten → gewartet, baden → gebadet.",
        ),
        ["Ich habe viel [gearbeitet].", "Wir haben lange [gewartet]."],
      ),
    ],
    items: [
      "Wir haben Fußball [gespielt].{spielen}",
      "Ich habe viel [gearbeitet].{arbeiten}",
      "Er hat ein Haus [gekauft].{kaufen}",
      "Was hast du [gemacht]?{machen}",
      "Sie hat in Berlin [gewohnt].{wohnen}",
      "Wir haben lange [gewartet].{warten}",
    ],
  },
  "de-a2-03": {
    idea: lines(
      "Irregular (strong) verbs make the participle with ge- + stem + -en, and the stem often changes: essen → gegessen, trinken → getrunken.",
      "الأفعال الشاذة (القوية) تصنع الـ Partizip بـ ge- + الجذر + -en، وغالباً يتغيّر الجذر: essen ← gegessen، trinken ← getrunken.",
      "Los verbos irregulares (fuertes) forman el participio con ge- + raíz + -en y la raíz suele cambiar: essen → gegessen, trinken → getrunken.",
      "Düzensiz (güçlü) fiiller ortacı ge- + kök + -en ile yapar ve kök çoğu zaman değişir: essen → gegessen, trinken → getrunken.",
    ),
    right: "Ich habe Pizza [gegessen].",
    wrong: "Ich habe Pizza [gegesst].",
    notes: [
      note(
        "detail",
        lines(
          "Learn three forms for each strong verb: essen – aß – gegessen, trinken – trank – getrunken, schreiben – schrieb – geschrieben.",
          "تعلّم ثلاث صيغ لكل فعل قوي: essen – aß – gegessen، trinken – trank – getrunken، schreiben – schrieb – geschrieben.",
          "Aprende tres formas de cada verbo fuerte: essen – aß – gegessen, trinken – trank – getrunken, schreiben – schrieb – geschrieben.",
          "Her güçlü fiil için üç biçim öğren: essen – aß – gegessen, trinken – trank – getrunken, schreiben – schrieb – geschrieben.",
        ),
        ["Ich habe Wasser [getrunken].", "Er hat einen Brief [geschrieben]."],
      ),
    ],
    items: [
      "Ich habe Kaffee [getrunken].{trinken}",
      "Er hat einen Brief [geschrieben].{schreiben}",
      "Wir haben einen Film [gesehen].{sehen}",
      "Sie hat das Buch [gelesen].{lesen}",
      "Ich habe den Bus [genommen].{nehmen}",
      "Hast du ihn [gefunden]?{finden}",
    ],
  },
  "de-a2-04": {
    idea: lines(
      "Verbs of movement and change use sein in the Perfekt: gehen → ich bin gegangen, fahren → ich bin gefahren, werden → ich bin geworden.",
      "أفعال الحركة والتغيّر تأخذ sein في الـ Perfekt: gehen ← ich bin gegangen، fahren ← ich bin gefahren، werden ← ich bin geworden.",
      "Los verbos de movimiento y cambio usan sein en el Perfekt: gehen → ich bin gegangen, fahren → ich bin gefahren, werden → ich bin geworden.",
      "Hareket ve değişim fiilleri Perfekt'te sein alır: gehen → ich bin gegangen, fahren → ich bin gefahren, werden → ich bin geworden.",
    ),
    right: "Ich [bin] nach Berlin gefahren.",
    wrong: "Ich [habe] nach Berlin gefahren.",
    notes: [
      note(
        "exception",
        lines(
          "sein and bleiben also take sein, though they are not movement: Ich bin gewesen. Ich bin zu Hause geblieben.",
          "sein وbleiben أيضاً تأخذان sein مع أنهما ليستا حركة: Ich bin gewesen. Ich bin zu Hause geblieben.",
          "sein y bleiben también llevan sein, aunque no son movimiento: Ich bin gewesen. Ich bin zu Hause geblieben.",
          "sein ve bleiben de hareket olmadığı hâlde sein alır: Ich bin gewesen. Ich bin zu Hause geblieben.",
        ),
        ["Ich [bin] zu Hause geblieben.", "Er [ist] krank gewesen."],
      ),
    ],
    items: [
      "Wir [sind] nach Hause gegangen.",
      "Er [ist] gestern gekommen.",
      "Ich [bin] zwei Wochen geblieben.",
      "[Bist] du schon einmal geflogen?",
      "Sie [ist] Ärztin geworden.",
      "Ihr [seid] mit dem Zug gefahren.",
    ],
  },
  "de-a2-05": {
    idea: lines(
      "Verbs that start with be-, ver-, er-, ent-, zer- or end in -ieren make the participle without ge-: besuchen → besucht, verstehen → verstanden.",
      "الأفعال التي تبدأ بـ be- أو ver- أو er- أو ent- أو zer- أو تنتهي بـ -ieren تصنع الـ Partizip بدون ge-: besuchen ← besucht، verstehen ← verstanden.",
      "Los verbos que empiezan por be-, ver-, er-, ent-, zer- o acaban en -ieren forman el participio sin ge-: besuchen → besucht, verstehen → verstanden.",
      "be-, ver-, er-, ent-, zer- ile başlayan veya -ieren ile biten fiiller ortacı ge- olmadan yapar: besuchen → besucht, verstehen → verstanden.",
    ),
    right: "Ich habe meine Oma [besucht].",
    wrong: "Ich habe meine Oma [gebesucht].",
    notes: [
      note(
        "exception",
        lines(
          "The stress is not on these prefixes, so ge- would be too much. telefonieren → telefoniert (not getelefoniert).",
          "هذه البادئات لا يقع عليها النبر، فلا حاجة لـ ge-. telefonieren ← telefoniert (وليس getelefoniert).",
          "El acento no cae en estos prefijos, así que ge- sobra. telefonieren → telefoniert (no getelefoniert).",
          "Vurgu bu öneklerde olmadığı için ge- gerekmez. telefonieren → telefoniert (getelefoniert değil).",
        ),
        ["Wir haben lange [telefoniert]."],
      ),
    ],
    items: [
      "Ich habe einen Freund [besucht].{besuchen}",
      "Er hat das nicht [verstanden].{verstehen}",
      "Sie hat uns eine Geschichte [erzählt].{erzählen}",
      "Wir haben lange [telefoniert].{telefonieren}",
      "Ich habe das Auto [verkauft].{verkaufen}",
      "Hast du den Termin [vergessen]?{vergessen}",
    ],
  },
  "de-a2-06": {
    idea: lines(
      "A separable verb puts ge- between the prefix and the stem: aufstehen → aufgestanden, einkaufen → eingekauft.",
      "الفعل المنفصل يضع ge- بين البادئة والجذر: aufstehen ← aufgestanden، einkaufen ← eingekauft.",
      "Un verbo separable pone ge- entre el prefijo y la raíz: aufstehen → aufgestanden, einkaufen → eingekauft.",
      "Ayrılabilen fiil ge-'yi önek ile kök arasına koyar: aufstehen → aufgestanden, einkaufen → eingekauft.",
    ),
    right: "Ich bin um sieben Uhr [aufgestanden].",
    wrong: "Ich bin um sieben Uhr [geaufstanden].",
    notes: [
      note(
        "detail",
        lines(
          "The participle is one word: an|ge|rufen = angerufen. The prefix tells you the verb is separable.",
          "الـ Partizip كلمة واحدة: an|ge|rufen = angerufen. والبادئة تدلّك على أن الفعل منفصل.",
          "El participio es una sola palabra: an|ge|rufen = angerufen. El prefijo indica que el verbo es separable.",
          "Ortaç tek sözcüktür: an|ge|rufen = angerufen. Önek fiilin ayrılabilir olduğunu gösterir.",
        ),
        ["Ich habe meine Mutter [angerufen]."],
      ),
    ],
    items: [
      "Ich habe meine Mutter [angerufen].{anrufen}",
      "Wir haben im Supermarkt [eingekauft].{einkaufen}",
      "Er ist früh [aufgestanden].{aufstehen}",
      "Der Zug ist um acht [angekommen].{ankommen}",
      "Sie hat das Licht [ausgemacht].{ausmachen}",
      "Ich habe die Tür [aufgemacht].{aufmachen}",
    ],
  },
  "de-a2-07": {
    idea: lines(
      "In the Perfekt the participle goes to the very end, however long the sentence is. Everything else stays between the two parts.",
      "في الـ Perfekt يذهب الـ Partizip إلى آخر الجملة مهما طالت. وكل ما عداه يقع بين الجزأين.",
      "En el Perfekt el participio va al final de todo, por larga que sea la frase. Todo lo demás queda entre las dos partes.",
      "Perfekt'te ortaç cümle ne kadar uzun olursa olsun en sona gider. Geri kalan her şey iki parçanın arasında kalır.",
    ),
    right: "Ich habe gestern im Park Fußball [gespielt].",
    wrong: "Ich habe [gespielt] gestern im Park Fußball.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not put the participle right after haben. The two parts hold the sentence like brackets: habe ... gespielt.",
          "لا تضع الـ Partizip بعد haben مباشرة. الجزآن يحيطان بالجملة كالقوسين: habe ... gespielt.",
          "No pongas el participio justo después de haben. Las dos partes encierran la frase como paréntesis: habe ... gespielt.",
          "Ortacı haben'in hemen arkasına koyma. İki parça cümleyi parantez gibi çevreler: habe ... gespielt.",
        ),
        ["Wir haben viel [gelernt]."],
      ),
    ],
    items: [
      "Wir haben gestern den ganzen Tag im Garten [gearbeitet].",
      "Er ist am Wochenende mit dem Zug nach Wien [gefahren].",
      "Ich habe heute Morgen einen Brief an meine Freundin [geschrieben].",
      "Sie hat im Urlaub viele Fotos [gemacht].",
      "Wir sind letztes Jahr nach Spanien [geflogen].",
      "Ich habe meinen Schlüssel zu Hause [vergessen].",
    ],
  },
  "de-a2-08": {
    idea: lines(
      "For sein and haben, speakers prefer the simple past: ich war, du warst, er war, wir waren; ich hatte, du hattest, er hatte, wir hatten.",
      "مع sein وhaben يفضّل المتكلمون الماضي البسيط: ich war، du warst، er war، wir waren؛ ich hatte، du hattest، er hatte، wir hatten.",
      "Con sein y haben se prefiere el pasado simple: ich war, du warst, er war, wir waren; ich hatte, du hattest, er hatte, wir hatten.",
      "sein ve haben için konuşurlar yalın geçmişi tercih eder: ich war, du warst, er war, wir waren; ich hatte, du hattest, er hatte, wir hatten.",
    ),
    right: "Gestern [hatte] ich Hunger.",
    wrong: "Gestern [habe] ich Hunger gehabt.",
    notes: [
      note(
        "exception",
        lines(
          "Even when speaking, say Ich war krank (not Ich bin krank gewesen). The same is true for the modal verbs: ich konnte, ich musste.",
          "حتى في الكلام قل Ich war krank (وليس Ich bin krank gewesen). والأمر نفسه للأفعال المساعدة: ich konnte، ich musste.",
          "Incluso al hablar, di Ich war krank (no Ich bin krank gewesen). Lo mismo con los verbos modales: ich konnte, ich musste.",
          "Konuşurken bile Ich war krank de (Ich bin krank gewesen değil). Kipli fiillerde de aynı: ich konnte, ich musste.",
        ),
        ["Gestern [war] ich krank.", "Ich [konnte] nicht kommen."],
      ),
    ],
    items: [
      "Gestern [war] ich krank.",
      "Wir [waren] im Kino.",
      "Ich [hatte] gestern Hunger.",
      "Er [hatte] keine Zeit.",
      "[Wart] ihr schon in Berlin?",
      "Wo [warst] du gestern?",
    ],
  },
  "de-a2-09": {
    idea: lines(
      "The dative answers «wem?» (to whom?). The articles are dem (masculine, neuter), der (feminine) and den + -n (plural): dem Mann, der Frau, den Kindern.",
      "حالة الجر (Dativ) تجيب عن «wem؟» (لمن؟). أدواتها: dem (للمذكر والمحايد)، der (للمؤنث)، den + -n (للجمع): dem Mann، der Frau، den Kindern.",
      "El dativo responde a «¿a quién?» (wem?). Los artículos son dem (masculino, neutro), der (femenino) y den + -n (plural): dem Mann, der Frau, den Kindern.",
      "Dativ «kime?» (wem?) sorusuna cevap verir. Artikeller: dem (eril, nötr), der (dişil) ve den + -n (çoğul): dem Mann, der Frau, den Kindern.",
    ),
    right: "Ich gebe [dem] Mann das Buch.",
    wrong: "Ich gebe [den] Mann das Buch.",
    notes: [
      note(
        "exception",
        lines(
          "In the plural the noun gets an -n, unless it already ends in -n or -s: den Kindern, but den Frauen and den Autos.",
          "في الجمع يأخذ الاسم -n، إلا إذا انتهى أصلاً بـ -n أو -s: den Kindern، لكن den Frauen وden Autos.",
          "En el plural el sustantivo toma -n, salvo que ya acabe en -n o -s: den Kindern, pero den Frauen y den Autos.",
          "Çoğulda isim -n alır; zaten -n veya -s ile bitiyorsa almaz: den Kindern, ama den Frauen ve den Autos.",
        ),
        ["Wir helfen den [Kindern].", "Er dankt den [Frauen]."],
      ),
    ],
    items: [
      "Ich gebe [dem] Kind einen Apfel.",
      "Sie hilft [der] Frau.",
      "Ich schenke [dem] Lehrer ein Buch.",
      "Ich zeige [dem] Freund das Foto.",
      "Wir geben [der] Katze Milch.",
      "Ich erkläre [dem] Mann den Weg.",
    ],
  },
  "de-a2-10": {
    idea: lines(
      "The dative pronouns are mir, dir, ihm, ihr, uns, euch, ihnen: Kannst du mir helfen? Ich gebe dir das Buch.",
      "ضمائر حالة الجر (Dativ): mir وdir وihm وihr وuns وeuch وihnen: Kannst du mir helfen؟ Ich gebe dir das Buch.",
      "Los pronombres de dativo son mir, dir, ihm, ihr, uns, euch, ihnen: Kannst du mir helfen? Ich gebe dir das Buch.",
      "Dativ zamirleri: mir, dir, ihm, ihr, uns, euch, ihnen: Kannst du mir helfen? Ich gebe dir das Buch.",
    ),
    right: "Kannst du [mir] helfen?",
    wrong: "Kannst du [mich] helfen?",
    notes: [
      note(
        "mistake",
        lines(
          "Do not mix mich (what the action is done to) with mir (to whom). Hilf mir, not Hilf mich. Think of mir as «to me».",
          "لا تخلط بين mich (من يقع عليه الفعل) وmir (لمن). Hilf mir وليس Hilf mich. فكّر في mir على أنها «لي» (حرف اللام).",
          "No mezcles mich (a quien se le hace la acción) con mir (a quién). Hilf mir, no Hilf mich. Piensa en mir como «a mí».",
          "mich (eylemin yöneldiği kişi) ile mir (kime) karıştırma. Hilf mir de, Hilf mich değil. mir'i «bana» olarak düşün.",
        ),
        ["Hilf [mir]!", "Das gefällt [mir]."],
      ),
    ],
    items: [
      "Kannst du [mir] helfen?",
      "Ich gebe [dir] das Buch.",
      "Das Auto gehört [ihm].",
      "Wir danken [ihnen].",
      "Wie geht es [dir]?",
      "Das Essen schmeckt [mir] gut.",
    ],
  },
  "de-a2-11": {
    idea: lines(
      "Some verbs always take the dative: helfen, gefallen, gehören, danken, schmecken, fehlen, passen, antworten, gratulieren.",
      "بعض الأفعال تأخذ حالة الجر (Dativ) دائماً: helfen وgefallen وgehören وdanken وschmecken وfehlen وpassen وantworten وgratulieren.",
      "Algunos verbos llevan siempre dativo: helfen, gefallen, gehören, danken, schmecken, fehlen, passen, antworten, gratulieren.",
      "Bazı fiiller her zaman Dativ alır: helfen, gefallen, gehören, danken, schmecken, fehlen, passen, antworten, gratulieren.",
    ),
    right: "Das Buch gehört [mir].",
    wrong: "Das Buch gehört [mich].",
    notes: [
      note(
        "mistake",
        lines(
          "gefallen and schmecken work like «it pleases me»: Das Auto gefällt mir = I like the car. The thing is the subject, the person is in the dative.",
          "gefallen وschmecken تعملان بمعنى «يعجبني»: Das Auto gefällt mir = أحب السيارة. الشيء هو الفاعل، والشخص في حالة الجر.",
          "gefallen y schmecken funcionan como «me gusta»: Das Auto gefällt mir = me gusta el coche. La cosa es el sujeto y la persona va en dativo.",
          "gefallen ve schmecken «hoşuma gider» gibi çalışır: Das Auto gefällt mir = arabayı beğeniyorum. Şey özne, kişi Dativ'dedir.",
        ),
        ["Das Auto gefällt [mir].", "Die Suppe schmeckt [ihm]."],
      ),
    ],
    items: [
      "Das Buch gehört [mir].",
      "Ich helfe [dir].",
      "Das Kleid gefällt [ihr].",
      "Wir danken [euch].",
      "Die Suppe schmeckt [ihm].",
      "Ich gratuliere [dir].",
    ],
  },
  "de-a2-12": {
    idea: lines(
      "With two objects, the person (dative) usually comes first and the thing (accusative) second: Ich gebe dem Kind einen Apfel. Two pronouns swap: Ich gebe es ihm.",
      "مع مفعولين يأتي الشخص (Dativ) غالباً أولاً ثم الشيء (Akkusativ): Ich gebe dem Kind einen Apfel. أما مع ضميرين فينعكس الترتيب: Ich gebe es ihm.",
      "Con dos objetos, normalmente va primero la persona (dativo) y luego la cosa (acusativo): Ich gebe dem Kind einen Apfel. Con dos pronombres se invierte: Ich gebe es ihm.",
      "İki nesne olduğunda genellikle önce kişi (Dativ), sonra şey (Akkusativ) gelir: Ich gebe dem Kind einen Apfel. İki zamirde sıra tersine döner: Ich gebe es ihm.",
    ),
    right: "Ich gebe [es] ihm.",
    wrong: "Ich gebe [ihm] es.",
    notes: [
      note(
        "detail",
        lines(
          "Typical verbs with two objects: geben, zeigen, schenken, schicken, erklären, kaufen, bringen. Ask: wem? (to whom) and was? (what).",
          "أفعال شائعة بمفعولين: geben وzeigen وschenken وschicken وerklären وkaufen وbringen. اسأل: wem؟ (لمن) وwas؟ (ماذا).",
          "Verbos típicos con dos objetos: geben, zeigen, schenken, schicken, erklären, kaufen, bringen. Pregunta: wem? (a quién) y was? (qué).",
          "İki nesneli tipik fiiller: geben, zeigen, schenken, schicken, erklären, kaufen, bringen. Sor: wem? (kime) ve was? (neyi).",
        ),
        ["Ich schicke [dir] einen Brief."],
      ),
    ],
    items: [
      "Ich gebe [dem] Kind einen Apfel.",
      "Ich gebe [es] ihm.{it}",
      "Wir zeigen [den] Freunden das Haus.",
      "Er schenkt [seiner] Frau Blumen.",
      "Ich kaufe [dir] ein Eis.",
      "Sie schickt [ihm] einen Brief.",
    ],
  },
  "de-a2-13": {
    idea: lines(
      "After aus, bei, mit, nach, seit, von, zu the article is in the dative: mit dem Bus, bei der Arbeit, von meinem Bruder.",
      "بعد aus وbei وmit وnach وseit وvon وzu تكون الأداة في حالة الجر (Dativ): mit dem Bus، bei der Arbeit، von meinem Bruder.",
      "Tras aus, bei, mit, nach, seit, von, zu el artículo va en dativo: mit dem Bus, bei der Arbeit, von meinem Bruder.",
      "aus, bei, mit, nach, seit, von, zu'dan sonra artikel Dativ'dedir: mit dem Bus, bei der Arbeit, von meinem Bruder.",
    ),
    right: "Ich fahre mit [dem] Auto.",
    wrong: "Ich fahre mit [das] Auto.",
    notes: [
      note(
        "detail",
        lines(
          "Feminine nouns take der, plural nouns take den + -n: mit der Freundin, mit den Kindern.",
          "المؤنث يأخذ der والجمع يأخذ den + -n: mit der Freundin، mit den Kindern.",
          "Los femeninos llevan der, los plurales den + -n: mit der Freundin, mit den Kindern.",
          "Dişil isimler der, çoğullar den + -n alır: mit der Freundin, mit den Kindern.",
        ),
        ["Ich gehe mit [der] Freundin.", "Er spielt mit den [Kindern]."],
      ),
    ],
    items: [
      "Ich wohne bei [meiner] Tante.",
      "Er kommt aus [der] Schule.",
      "Wir fahren mit [dem] Zug.",
      "Sie wohnt seit [einem] Jahr hier.",
      "Das Geschenk ist von [meinem] Bruder.",
      "Ich gehe zu [meiner] Oma.",
    ],
  },
  "de-a2-14": {
    idea: lines(
      "Two verbs for one idea: stehen, liegen, sitzen, hängen (where something is, dative) and stellen, legen, setzen, hängen (putting it there, accusative).",
      "زوجان من الأفعال للفكرة نفسها: stehen وliegen وsitzen وhängen (مكان وجود الشيء، Dativ) وstellen وlegen وsetzen وhängen (وضعه هناك، Akkusativ).",
      "Dos verbos para una idea: stehen, liegen, sitzen, hängen (dónde está algo, dativo) y stellen, legen, setzen, hängen (ponerlo allí, acusativo).",
      "Bir fikir için iki fiil: stehen, liegen, sitzen, hängen (bir şeyin nerede olduğu, Dativ) ve stellen, legen, setzen, hängen (oraya koymak, Akkusativ).",
    ),
    right: "Ich [stelle] die Flasche auf den Tisch.",
    wrong: "Ich [stehe] die Flasche auf den Tisch.",
    notes: [
      note(
        "mistake",
        lines(
          "Arabic and English use one verb for «put». German asks how: stellen (upright), legen (flat), setzen (sit down). Then the place takes the accusative.",
          "العربية والإنكليزية تستعملان فعلاً واحداً لـ «وضع». أما الألمانية فتسأل كيف: stellen (عمودياً)، legen (أفقياً)، setzen (إجلاساً). ثم يأخذ المكان Akkusativ.",
          "El español usa un solo verbo para «poner». El alemán pregunta cómo: stellen (de pie), legen (tumbado), setzen (sentar). Luego el lugar va en acusativo.",
          "Türkçede «koymak» tek fiildir. Almanca nasıl diye sorar: stellen (dik), legen (yatay), setzen (oturtmak). Sonra yer Akkusativ alır.",
        ),
        ["Ich [lege] das Buch auf den Tisch.", "Das Buch [liegt] auf dem Tisch."],
      ),
    ],
    items: [
      "Ich [lege] das Buch auf den Tisch.{put flat}",
      "Das Buch [liegt] auf dem Tisch.{lie}",
      "Ich [stelle] die Vase auf den Tisch.{put upright}",
      "Die Vase [steht] auf dem Tisch.{stand}",
      "Ich [setze] das Kind auf den Stuhl.{sit someone}",
      "Das Kind [sitzt] auf dem Stuhl.{sit}",
    ],
  },
  "de-a2-15": {
    idea: lines(
      "Possessives take the dative endings: -em (masculine, neuter), -er (feminine), -en + -n on the noun (plural): mit meinem Bruder, bei meiner Tante, zu meinen Eltern.",
      "ألفاظ الملكية تأخذ نهايات حالة الجر (Dativ): -em (للمذكر والمحايد)، -er (للمؤنث)، -en + -n على الاسم (للجمع): mit meinem Bruder، bei meiner Tante، zu meinen Eltern.",
      "Los posesivos toman las terminaciones del dativo: -em (masculino, neutro), -er (femenino), -en + -n en el sustantivo (plural): mit meinem Bruder, bei meiner Tante, zu meinen Eltern.",
      "İyelik sözcükleri Dativ eklerini alır: -em (eril, nötr), -er (dişil), -en + isimde -n (çoğul): mit meinem Bruder, bei meiner Tante, zu meinen Eltern.",
    ),
    right: "Ich wohne bei [meiner] Tante.",
    wrong: "Ich wohne bei [meine] Tante.",
    notes: [
      note(
        "detail",
        lines(
          "dein, sein, ihr, unser and euer work the same way: mit deinem Freund, bei ihrer Mutter, zu unseren Freunden.",
          "dein وsein وihr وunser وeuer تعمل بالطريقة نفسها: mit deinem Freund، bei ihrer Mutter، zu unseren Freunden.",
          "dein, sein, ihr, unser y euer funcionan igual: mit deinem Freund, bei ihrer Mutter, zu unseren Freunden.",
          "dein, sein, ihr, unser ve euer de aynı şekilde çalışır: mit deinem Freund, bei ihrer Mutter, zu unseren Freunden.",
        ),
        ["Er spricht mit [seinem] Chef.", "Wir gehen zu [unseren] Freunden."],
      ),
    ],
    items: [
      "Ich fahre mit [meinem] Bruder.",
      "Sie wohnt bei [ihrer] Mutter.",
      "Er spricht mit [seinem] Chef.",
      "Ich gebe [meiner] Schwester ein Buch.",
      "Wir gehen zu [unseren] Freunden.",
      "Kommst du mit [deinen] Eltern?",
    ],
  },
};
