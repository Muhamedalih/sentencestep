/** German rules de-b2-01 ... de-b2-15 (past tenses, the future, the passive). */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_B2_1: Readonly<Record<string, RuleTeach>> = {
  "de-b2-01": {
    idea: lines(
      "The Präteritum is the past tense of writing: stories, news, reports. Regular verbs add -te to the stem: machen → machte, wohnen → wohnte.",
      "الـ Präteritum هو ماضي الكتابة: القصص والأخبار والتقارير. الأفعال المنتظمة تضيف -te إلى الجذر: machen ← machte، wohnen ← wohnte.",
      "El Präteritum es el pasado de la escritura: cuentos, noticias, informes. Los verbos regulares añaden -te a la raíz: machen → machte, wohnen → wohnte.",
      "Präteritum yazının geçmiş zamanıdır: hikâye, haber, rapor. Düzenli fiiller köke -te ekler: machen → machte, wohnen → wohnte.",
    ),
    right: "Als Kind [wohnte] ich in Basra.",
    wrong: "Als Kind [wohnt] ich in Basra.",
    notes: [
      note(
        "detail",
        lines(
          "ich and er / sie / es have the same form: ich wohnte, er wohnte. du adds -st (du wohntest), wir and sie add -n (wir wohnten), ihr adds -t (ihr wohntet).",
          "ich وer / sie / es لهما الصيغة نفسها: ich wohnte، er wohnte. وdu تضيف -st (du wohntest)، وwir وsie تضيفان -n (wir wohnten)، وihr تضيف -t (ihr wohntet).",
          "ich y er / sie / es tienen la misma forma: ich wohnte, er wohnte. du añade -st (du wohntest), wir y sie añaden -n (wir wohnten), ihr añade -t (ihr wohntet).",
          "ich ve er / sie / es aynı biçimdedir: ich wohnte, er wohnte. du -st (du wohntest), wir ve sie -n (wir wohnten), ihr -t (ihr wohntet) alır.",
        ),
        ["Er [wohnte] in Berlin.", "Wir [wohnten] in Berlin."],
      ),
      note(
        "exception",
        lines(
          "If the stem ends in -t or -d, add -ete: arbeiten → arbeitete, warten → wartete.",
          "إذا انتهى الجذر بـ -t أو -d فأضف -ete: arbeiten ← arbeitete، warten ← wartete.",
          "Si la raíz acaba en -t o -d, añade -ete: arbeiten → arbeitete, warten → wartete.",
          "Kök -t veya -d ile bitiyorsa -ete ekle: arbeiten → arbeitete, warten → wartete.",
        ),
        ["Er [arbeitete] zehn Jahre in Wien."],
      ),
    ],
    items: [
      "Als Kind [wohnte] ich in Basra.{wohnen}",
      "Er [arbeitete] zehn Jahre in Wien.{arbeiten}",
      "Sie [lachte] laut.{lachen}",
      "Gestern [spielte] er Fußball.{spielen}",
      "Er [kaufte] ein Auto.{kaufen}",
      "Sie [lernte] Deutsch.{lernen}",
    ],
  },
  "de-b2-02": {
    idea: lines(
      "Irregular (strong) verbs change the vowel in the Präteritum and take no ending for ich and er / sie / es: gehen → ging, kommen → kam, sehen → sah.",
      "الأفعال الشاذة (القوية) تغيّر حرف العلة في الـ Präteritum ولا تأخذ نهاية مع ich وer / sie / es: gehen ← ging، kommen ← kam، sehen ← sah.",
      "Los verbos irregulares (fuertes) cambian la vocal en el Präteritum y no llevan terminación con ich y er / sie / es: gehen → ging, kommen → kam, sehen → sah.",
      "Düzensiz (güçlü) fiiller Präteritum'da ünlü değiştirir ve ich ile er / sie / es için ek almaz: gehen → ging, kommen → kam, sehen → sah.",
    ),
    right: "Er [ging] nach Hause.",
    wrong: "Er [gehte] nach Hause.",
    notes: [
      note(
        "detail",
        lines(
          "The other persons add endings: du gingst, wir gingen, ihr gingt. Learn the three forms of each verb: gehen – ging – gegangen.",
          "بقية الأشخاص تضيف نهايات: du gingst، wir gingen، ihr gingt. تعلّم الصيغ الثلاث لكل فعل: gehen – ging – gegangen.",
          "Las otras personas añaden terminaciones: du gingst, wir gingen, ihr gingt. Aprende las tres formas de cada verbo: gehen – ging – gegangen.",
          "Diğer kişiler ek alır: du gingst, wir gingen, ihr gingt. Her fiilin üç biçimini öğren: gehen – ging – gegangen.",
        ),
        ["Du [gingst] nach Hause.", "Wir [gingen] nach Hause."],
      ),
    ],
    items: [
      "Er [ging] nach Hause.{gehen}",
      "Sie [kam] spät.{kommen}",
      "Wir [sahen] einen Film.{sehen}",
      "Ich [las] ein Buch.{lesen}",
      "Er [schrieb] einen Brief.{schreiben}",
      "Sie [fuhren] nach Berlin.{fahren}",
    ],
  },
  "de-b2-03": {
    idea: lines(
      "Mixed verbs change the vowel like strong verbs and take -te like regular ones: bringen → brachte, denken → dachte, kennen → kannte, wissen → wusste.",
      "الأفعال المختلطة تغيّر حرف العلة مثل القوية وتأخذ -te مثل المنتظمة: bringen ← brachte، denken ← dachte، kennen ← kannte، wissen ← wusste.",
      "Los verbos mixtos cambian la vocal como los fuertes y toman -te como los regulares: bringen → brachte, denken → dachte, kennen → kannte, wissen → wusste.",
      "Karışık fiiller güçlü fiiller gibi ünlü değiştirir, düzenliler gibi -te alır: bringen → brachte, denken → dachte, kennen → kannte, wissen → wusste.",
    ),
    right: "Er [brachte] Blumen mit.",
    wrong: "Er [bringte] Blumen mit.",
    notes: [
      note(
        "detail",
        lines(
          "There are only a few: bringen, denken, kennen, nennen, rennen, wissen, senden. Their participle also ends in -t: gebracht, gedacht, gekannt, gewusst.",
          "هي قليلة: bringen وdenken وkennen وnennen وrennen وwissen وsenden. واسم المفعول منها ينتهي أيضاً بـ -t: gebracht وgedacht وgekannt وgewusst.",
          "Son pocos: bringen, denken, kennen, nennen, rennen, wissen, senden. Su participio también acaba en -t: gebracht, gedacht, gekannt, gewusst.",
          "Sayıları azdır: bringen, denken, kennen, nennen, rennen, wissen, senden. Ortaçları da -t ile biter: gebracht, gedacht, gekannt, gewusst.",
        ),
        ["Ich [dachte] an dich.", "Er hat Blumen ge[bracht]."],
      ),
    ],
    items: [
      "Er [brachte] Blumen mit.{bringen}",
      "Ich [dachte] an dich.{denken}",
      "Wir [kannten] ihn gut.{kennen}",
      "Sie [nannte] ihren Hund Max.{nennen}",
      "Ich [wusste] das nicht.{wissen}",
      "Er [rannte] zum Bus.{rennen}",
    ],
  },
  "de-b2-04": {
    idea: lines(
      "The Plusquamperfekt is the past before another past: hatte / war + participle. Ich hatte schon gegessen, als er kam.",
      "الـ Plusquamperfekt هو ماضٍ قبل ماضٍ آخر: hatte / war + اسم المفعول. Ich hatte schon gegessen, als er kam.",
      "El Plusquamperfekt es el pasado anterior a otro pasado: hatte / war + participio. Ich hatte schon gegessen, als er kam.",
      "Plusquamperfekt başka bir geçmişten önceki geçmiştir: hatte / war + ortaç. Ich hatte schon gegessen, als er kam.",
    ),
    right: "Ich [hatte] schon gegessen, als er kam.",
    wrong: "Ich [habe] schon gegessen, als er kam.",
    notes: [
      note(
        "detail",
        lines(
          "It works like the Perfekt, but with the helper in the past: hatte + participle (haben verbs), war + participle (sein verbs). It tells which event came first.",
          "يعمل مثل الـ Perfekt لكن بالفعل المساعد في الماضي: hatte + اسم المفعول (أفعال haben)، وwar + اسم المفعول (أفعال sein). ويبيّن أي الحدثين وقع أولاً.",
          "Funciona como el Perfekt, pero con el auxiliar en pasado: hatte + participio (verbos con haben), war + participio (verbos con sein). Indica qué hecho fue primero.",
          "Perfekt gibi çalışır ama yardımcı fiil geçmiştedir: hatte + ortaç (haben fiilleri), war + ortaç (sein fiilleri). Hangi olayın önce olduğunu gösterir.",
        ),
        ["Als ich ankam, [war] der Zug schon abgefahren."],
      ),
    ],
    items: [
      "Ich [hatte] schon gegessen, als er kam.",
      "Wir [waren] schon gegangen, als es regnete.",
      "Er [hatte] das Buch schon gelesen.",
      "Sie [hatte] lange gewartet, bevor der Bus kam.",
      "Als ich ankam, [war] der Zug schon abgefahren.",
      "[Hattest] du das gewusst?",
    ],
  },
  "de-b2-05": {
    idea: lines(
      "In speech, use the Perfekt; in writing (stories, news, reports) use the Präteritum. For sein, haben and the modal verbs use the Präteritum in speech too.",
      "في الكلام استعمل الـ Perfekt، وفي الكتابة (القصص والأخبار والتقارير) استعمل الـ Präteritum. ومع sein وhaben والأفعال المساعدة استعمل الـ Präteritum حتى في الكلام.",
      "Al hablar, usa el Perfekt; al escribir (cuentos, noticias, informes) usa el Präteritum. Con sein, haben y los modales usa el Präteritum también al hablar.",
      "Konuşmada Perfekt, yazıda (hikâye, haber, rapor) Präteritum kullan. sein, haben ve kipli fiillerde konuşmada da Präteritum kullan.",
    ),
    right: "Im Gespräch: Ich [habe] ihn gesehen.",
    wrong: "Im Gespräch: Ich [sah] ihn.",
    notes: [
      note(
        "detail",
        lines(
          "Both are correct grammar. The difference is style: ich sah ihn sounds like a book, ich habe ihn gesehen sounds like a conversation. In the south of Germany people use the Perfekt even more.",
          "كلاهما صحيح نحوياً. الفرق في الأسلوب: ich sah ihn تبدو كلغة الكتب، وich habe ihn gesehen تبدو كلغة الحديث. وفي جنوب ألمانيا يستعملون الـ Perfekt أكثر.",
          "Las dos son gramaticalmente correctas. La diferencia es el estilo: ich sah ihn suena a libro, ich habe ihn gesehen suena a conversación. En el sur de Alemania se usa aún más el Perfekt.",
          "İkisi de dilbilgisi olarak doğrudur. Fark üsluptadır: ich sah ihn kitap gibi, ich habe ihn gesehen sohbet gibi duyulur. Güney Almanya'da Perfekt daha da çok kullanılır.",
        ),
        ["In der Zeitung: Der Präsident [besuchte] Berlin."],
      ),
    ],
    items: [
      "Im Gespräch: Ich [habe] ihn gesehen.{Perfekt: haben}",
      "In einer Geschichte: Er [sah] sie.{Präteritum: sehen}",
      "Im Gespräch: Wir [sind] nach Berlin gefahren.{Perfekt: sein}",
      "In der Zeitung: Der Präsident [besuchte] Berlin.{Präteritum: besuchen}",
      "Im Gespräch: Gestern [war] ich krank.{Präteritum: sein}",
      "In einem Roman: Sie [lächelte] und ging.{Präteritum: lächeln}",
    ],
  },
  "de-b2-06": {
    idea: lines(
      "werden + infinitive can also express a guess about now, often with wohl, sicher or bestimmt: Er wird wohl krank sein.",
      "يمكن أن تعبّر werden + المصدر عن تخمين بشأن الحاضر، غالباً مع wohl أو sicher أو bestimmt: Er wird wohl krank sein.",
      "werden + infinitivo también puede expresar una suposición sobre ahora, a menudo con wohl, sicher o bestimmt: Er wird wohl krank sein.",
      "werden + mastar şimdiyle ilgili bir tahmini de anlatabilir, çoğu zaman wohl, sicher veya bestimmt ile: Er wird wohl krank sein.",
    ),
    right: "Er [wird] wohl krank sein.",
    wrong: "Er [wurde] wohl krank sein.",
    notes: [
      note(
        "detail",
        lines(
          "Words that show a guess: wohl, sicher, bestimmt, vermutlich, wahrscheinlich. Without them the sentence would be a plan: Er wird krank sein = he will be ill.",
          "كلمات التخمين: wohl وsicher وbestimmt وvermutlich وwahrscheinlich. وبدونها تصبح الجملة خطة: Er wird krank sein = سيكون مريضاً.",
          "Palabras que muestran una suposición: wohl, sicher, bestimmt, vermutlich, wahrscheinlich. Sin ellas la frase sería un plan: Er wird krank sein = estará enfermo.",
          "Tahmini gösteren sözcükler: wohl, sicher, bestimmt, vermutlich, wahrscheinlich. Onlar olmadan cümle bir plan olur: Er wird krank sein = hasta olacak.",
        ),
        ["Das [wird] sicher teuer sein."],
      ),
    ],
    items: [
      "Er [wird] wohl krank sein.",
      "Sie [wird] bestimmt schon zu Hause sein.",
      "Das [wird] sicher teuer sein.",
      "Es [wird] wohl regnen.",
      "Er [wird] vermutlich schon da sein.",
      "Sie [werden] wahrscheinlich spät kommen.",
    ],
  },
  "de-b2-07": {
    idea: lines(
      "The Futur II is werden + participle + haben / sein. It says that something will be finished by a time, or it guesses about the past: Er wird es vergessen haben.",
      "الـ Futur II هو werden + اسم المفعول + haben / sein. يقول إن شيئاً سيكون قد انتهى بحلول وقت ما، أو يخمّن عن الماضي: Er wird es vergessen haben.",
      "El Futur II es werden + participio + haben / sein. Dice que algo estará terminado para un momento, o supone algo del pasado: Er wird es vergessen haben.",
      "Futur II werden + ortaç + haben / sein'dır. Bir şeyin belli bir zamana kadar bitmiş olacağını söyler veya geçmiş hakkında tahmin yürütür: Er wird es vergessen haben.",
    ),
    right: "Er [wird] das bis morgen gemacht haben.",
    wrong: "Er [wird] das bis morgen machen haben.",
    notes: [
      note(
        "detail",
        lines(
          "It is rare. Use it for a guess about the past (Er wird den Zug verpasst haben) or for «already done by then» (Bis Juni werden wir umgezogen sein).",
          "وهو نادر. استعمله لتخمين عن الماضي (Er wird den Zug verpasst haben) أو لـ «سيكون قد تم حينها» (Bis Juni werden wir umgezogen sein).",
          "Es raro. Úsalo para una suposición sobre el pasado (Er wird den Zug verpasst haben) o para «ya estará hecho para entonces» (Bis Juni werden wir umgezogen sein).",
          "Nadirdir. Geçmiş hakkındaki tahmin (Er wird den Zug verpasst haben) veya «o zamana kadar bitmiş olur» (Bis Juni werden wir umgezogen sein) için kullan.",
        ),
        ["Bis Juni [werden] wir umgezogen sein."],
      ),
    ],
    items: [
      "Bis morgen [werde] ich das Buch gelesen haben.",
      "Sie [wird] schon nach Hause gegangen sein.",
      "Er [wird] den Zug verpasst haben.",
      "Bis Juni [werden] wir umgezogen sein.",
      "Du [wirst] das längst vergessen haben.",
      "Das [wird] ihn sehr geärgert haben.",
    ],
  },
  "de-b2-08": {
    idea: lines(
      "The passive says what happens to something, not who does it: werden + participle at the end. Das Haus wird gebaut. Hier wird Deutsch gesprochen.",
      "المبني للمجهول يقول ما يحدث لشيء لا من يفعله: werden + اسم المفعول في الآخر. Das Haus wird gebaut. Hier wird Deutsch gesprochen.",
      "La pasiva dice lo que le pasa a algo, no quién lo hace: werden + participio al final. Das Haus wird gebaut. Hier wird Deutsch gesprochen.",
      "Edilgen çatı bir şeye ne olduğunu söyler, kimin yaptığını değil: werden + sonda ortaç. Das Haus wird gebaut. Hier wird Deutsch gesprochen.",
    ),
    right: "Das Haus [wird] gebaut.",
    wrong: "Das Haus [wirst] gebaut.",
    notes: [
      note(
        "mistake",
        lines(
          "Arabic changes the vowels inside the verb. German uses a helper: werden. And werden here is not the future: Das Haus wird gebaut = is being built.",
          "العربية تغيّر حركات الفعل (كُتِبَ). أما الألمانية فتستعمل فعلاً مساعداً: werden. وهنا werden ليست مستقبلاً: Das Haus wird gebaut = يُبنى الآن.",
          "El español usa «se» o ser + participio. El alemán usa werden + participio. Y aquí werden no es el futuro: Das Haus wird gebaut = se está construyendo.",
          "Türkçe fiile -il / -in ekler. Almanca werden yardımcı fiilini kullanır. Burada werden gelecek zaman değildir: Das Haus wird gebaut = yapılıyor.",
        ),
        ["Die Tür [wird] geschlossen."],
      ),
    ],
    items: [
      "Das Haus [wird] gebaut.",
      "Hier [wird] Deutsch gesprochen.",
      "Die Tür [wird] geschlossen.",
      "Der Kuchen [wird] gebacken.",
      "Die Hausaufgaben [werden] gemacht.",
      "Das Essen [wird] gekocht.",
    ],
  },
  "de-b2-09": {
    idea: lines(
      "In the past the passive uses wurde / wurden: Das Haus wurde 1990 gebaut. In the Perfekt it is ist ... worden: Das Haus ist 1990 gebaut worden.",
      "في الماضي يستعمل المبني للمجهول wurde / wurden: Das Haus wurde 1990 gebaut. وفي الـ Perfekt يكون ist ... worden: Das Haus ist 1990 gebaut worden.",
      "En pasado la pasiva usa wurde / wurden: Das Haus wurde 1990 gebaut. En el Perfekt es ist ... worden: Das Haus ist 1990 gebaut worden.",
      "Geçmişte edilgen wurde / wurden kullanır: Das Haus wurde 1990 gebaut. Perfekt'te ist ... worden olur: Das Haus ist 1990 gebaut worden.",
    ),
    right: "Das Haus [wurde] 1990 gebaut.",
    wrong: "Das Haus [wird] 1990 gebaut.",
    notes: [
      note(
        "exception",
        lines(
          "In the Perfekt passive the participle of werden is worden, not geworden: Das Haus ist gebaut worden. geworden is only for werden as a normal verb: Er ist Arzt geworden.",
          "في الـ Perfekt للمجهول يكون اسم المفعول من werden هو worden وليس geworden: Das Haus ist gebaut worden. أما geworden فلـ werden كفعل عادي: Er ist Arzt geworden.",
          "En el Perfekt pasivo el participio de werden es worden, no geworden: Das Haus ist gebaut worden. geworden es solo para werden como verbo normal: Er ist Arzt geworden.",
          "Edilgen Perfekt'te werden'in ortacı worden'dir, geworden değil: Das Haus ist gebaut worden. geworden sadece normal fiil olan werden içindir: Er ist Arzt geworden.",
        ),
        ["Das Buch ist von ihm geschrieben [worden]."],
      ),
    ],
    items: [
      "Das Haus [wurde] 1990 gebaut.",
      "Die Brücke [wurde] letztes Jahr repariert.",
      "Wir [wurden] eingeladen.",
      "Er [wurde] gefragt.",
      "Das Buch ist von ihm geschrieben [worden].",
      "Die Tür ist geöffnet [worden].",
    ],
  },
  "de-b2-10": {
    idea: lines(
      "With a modal verb the passive ends in the participle + werden: Das muss gemacht werden. Hier darf nicht geraucht werden.",
      "مع الفعل المساعد ينتهي المبني للمجهول بـ اسم المفعول + werden: Das muss gemacht werden. Hier darf nicht geraucht werden.",
      "Con un verbo modal la pasiva acaba en participio + werden: Das muss gemacht werden. Hier darf nicht geraucht werden.",
      "Kipli fiille edilgen, ortaç + werden ile biter: Das muss gemacht werden. Hier darf nicht geraucht werden.",
    ),
    right: "Das Haus muss gebaut [werden].",
    wrong: "Das Haus muss gebaut [wird].",
    notes: [
      note(
        "detail",
        lines(
          "The modal is the only conjugated verb: muss, kann, soll, darf. The last verb is always the infinitive werden, whatever the subject.",
          "الفعل المساعد وحده يُصرَّف: muss وkann وsoll وdarf. والفعل الأخير دائماً المصدر werden مهما كان الفاعل.",
          "El modal es el único verbo conjugado: muss, kann, soll, darf. El último verbo es siempre el infinitivo werden, sea cual sea el sujeto.",
          "Çekimlenen tek fiil kipli fiildir: muss, kann, soll, darf. Son fiil özne ne olursa olsun mastar werden'dir.",
        ),
        ["Alle Fragen müssen beantwortet [werden]."],
      ),
    ],
    items: [
      "Das muss sofort gemacht [werden].",
      "Hier darf nicht geraucht [werden].",
      "Das Auto kann repariert [werden].",
      "Die Tür soll geschlossen [werden].",
      "Alle Fragen müssen beantwortet [werden].",
      "Der Brief muss heute geschickt [werden].",
    ],
  },
  "de-b2-11": {
    idea: lines(
      "To name who acts in a passive sentence, use von + dative: von einem Künstler gemalt. For a cause or means use durch + accusative: durch einen Unfall.",
      "لتسمية من يقوم بالفعل في الجملة المبنية للمجهول استعمل von + حالة الجر: Das Bild wurde von einem Künstler gemalt. وللسبب أو الوسيلة استعمل durch + المفعول به: durch einen Unfall.",
      "Para nombrar quién hace la acción en una frase pasiva usa von + dativo: Das Bild wurde von einem Künstler gemalt. Para una causa o un medio usa durch + acusativo: durch einen Unfall.",
      "Edilgen cümlede eylemi yapanı söylemek için von + Dativ kullan: Das Bild wurde von einem Künstler gemalt. Neden veya araç için durch + Akkusativ kullan: durch einen Unfall.",
    ),
    right: "Das Bild wurde [von] einem Künstler gemalt.",
    wrong: "Das Bild wurde [durch] einem Künstler gemalt.",
    notes: [
      note(
        "detail",
        lines(
          "von is for a person or group that acts, durch for an event or a thing that causes it: Er wurde von der Polizei gefragt. Er wurde durch den Lärm geweckt.",
          "von للشخص أو الجماعة التي تفعل، وdurch لحدث أو شيء يسبّب: Er wurde von der Polizei gefragt. Er wurde durch den Lärm geweckt.",
          "von es para una persona o un grupo que actúa, durch para un hecho o una cosa que lo causa: Er wurde von der Polizei gefragt. Er wurde durch den Lärm geweckt.",
          "von eylemi yapan kişi veya grup, durch nedeni oluşturan olay veya şey içindir: Er wurde von der Polizei gefragt. Er wurde durch den Lärm geweckt.",
        ),
        ["Er wurde [durch] den Lärm geweckt."],
      ),
    ],
    items: [
      "Das Haus wurde [von] meinem Vater gebaut.",
      "Der Mann wurde [von] der Polizei gefragt.",
      "Die Stadt wurde [durch] ein Erdbeben zerstört.",
      "Das Buch wurde [von] ihr geschrieben.",
      "Er wurde [durch] einen Unfall verletzt.",
      "Sie wurde [von] ihren Freunden eingeladen.",
    ],
  },
  "de-b2-12": {
    idea: lines(
      "sein + participle shows a state, the result: Die Tür ist geschlossen. werden + participle shows the process: Die Tür wird geschlossen.",
      "sein + اسم المفعول يبيّن الحالة (النتيجة): Die Tür ist geschlossen. وwerden + اسم المفعول يبيّن العملية: Die Tür wird geschlossen.",
      "sein + participio muestra un estado, el resultado: Die Tür ist geschlossen. werden + participio muestra el proceso: Die Tür wird geschlossen.",
      "sein + ortaç bir durumu, sonucu gösterir: Die Tür ist geschlossen. werden + ortaç süreci gösterir: Die Tür wird geschlossen.",
    ),
    right: "Die Tür [ist] geschlossen.",
    wrong: "Die Tür [hat] geschlossen.",
    notes: [
      note(
        "detail",
        lines(
          "Compare: Die Tür wird geschlossen = someone is closing it now. Die Tür ist geschlossen = it is closed (the result). In shops: Das Geschäft ist geöffnet.",
          "قارن: Die Tür wird geschlossen = أحدهم يغلقه الآن. Die Tür ist geschlossen = هو مغلق (النتيجة). وفي المحلات: Das Geschäft ist geöffnet.",
          "Compara: Die Tür wird geschlossen = alguien la está cerrando ahora. Die Tür ist geschlossen = está cerrada (el resultado). En tiendas: Das Geschäft ist geöffnet.",
          "Karşılaştır: Die Tür wird geschlossen = biri şimdi kapatıyor. Die Tür ist geschlossen = kapalı (sonuç). Dükkânlarda: Das Geschäft ist geöffnet.",
        ),
        ["Die Tür [wird] geschlossen."],
      ),
    ],
    items: [
      "Die Tür [ist] geschlossen.",
      "Das Geschäft [ist] heute geöffnet.",
      "Der Tisch [ist] reserviert.",
      "Die Zimmer [sind] besetzt.",
      "Das Konzert [war] ausverkauft.",
      "Der Weg [ist] gesperrt.",
    ],
  },
  "de-b2-13": {
    idea: lines(
      "German often avoids the passive: with man (Man sagt ...), with sich lassen + infinitive (Das lässt sich machen), or with -bar (lösbar = can be solved).",
      "كثيراً ما تتجنّب الألمانية المبني للمجهول: بـ man (Man sagt ...) أو بـ sich lassen + المصدر (Das lässt sich machen) أو بـ -bar (lösbar = يمكن حلّه).",
      "El alemán suele evitar la pasiva: con man (Man sagt ...), con sich lassen + infinitivo (Das lässt sich machen) o con -bar (lösbar = se puede resolver).",
      "Almanca edilgenden sık kaçınır: man ile (Man sagt ...), sich lassen + mastar ile (Das lässt sich machen) veya -bar ile (lösbar = çözülebilir).",
    ),
    right: "Das [lässt] sich leicht machen.",
    wrong: "Das [lassen] sich leicht machen.",
    notes: [
      note(
        "detail",
        lines(
          "man + active is the most common: Man sagt, dass ... = It is said that ... The verb lassen agrees with the subject: Das lässt sich machen, Die Aufgaben lassen sich lösen.",
          "الأكثر شيوعاً man + المبني للمعلوم: Man sagt, dass ... = يُقال إنّ ... ويتفق الفعل lassen مع الفاعل: Das lässt sich machen، Die Aufgaben lassen sich lösen.",
          "Lo más común es man + activa: Man sagt, dass ... = Se dice que ... El verbo lassen concuerda con el sujeto: Das lässt sich machen, Die Aufgaben lassen sich lösen.",
          "En yaygını man + etken fiildir: Man sagt, dass ... = ... denir. lassen özneyle uyumlu olur: Das lässt sich machen, Die Aufgaben lassen sich lösen.",
        ),
        ["[Man] sagt, dass er krank ist.", "Die Aufgaben [lassen] sich lösen."],
      ),
    ],
    items: [
      "Das [lässt] sich leicht machen.",
      "Das Problem [lässt] sich nicht lösen.",
      "Die Aufgabe ist [lösbar].",
      "Das Wasser ist [trinkbar].",
      "Diese Tasche [lässt] sich waschen.",
      "Der Text ist gut [lesbar].",
    ],
  },
  "de-b2-14": {
    idea: lines(
      "sein + zu + infinitive has a passive meaning: «can be done» or «must be done». Das Problem ist leicht zu lösen = it can be solved easily.",
      "sein + zu + المصدر له معنى المبني للمجهول: «يمكن فعله» أو «يجب فعله». Das Problem ist leicht zu lösen = يمكن حلّه بسهولة.",
      "sein + zu + infinitivo tiene sentido pasivo: «se puede hacer» o «hay que hacer». Das Problem ist leicht zu lösen = se puede resolver fácilmente.",
      "sein + zu + mastar edilgen anlamlıdır: «yapılabilir» veya «yapılmalıdır». Das Problem ist leicht zu lösen = kolayca çözülebilir.",
    ),
    right: "Das Problem ist leicht [zu] lösen.",
    wrong: "Das Problem ist leicht [lösen].",
    notes: [
      note(
        "detail",
        lines(
          "The meaning comes from the context: Das ist schwer zu verstehen = can be understood only with difficulty. Die Regeln sind zu beachten = must be followed.",
          "يأتي المعنى من السياق: Das ist schwer zu verstehen = لا يُفهم إلا بصعوبة. Die Regeln sind zu beachten = يجب اتباعها.",
          "El sentido viene del contexto: Das ist schwer zu verstehen = solo se entiende con dificultad. Die Regeln sind zu beachten = hay que seguirlas.",
          "Anlam bağlamdan gelir: Das ist schwer zu verstehen = zor anlaşılır. Die Regeln sind zu beachten = uyulmalıdır.",
        ),
        ["Die Regeln sind [zu] beachten."],
      ),
    ],
    items: [
      "Das Problem ist leicht [zu] lösen.",
      "Das Formular ist bis Montag [zu] schicken.",
      "Die Regeln sind [zu] beachten.",
      "Das ist schwer [zu] verstehen.",
      "Der Fehler ist leicht [zu] finden.",
      "Dieser Text ist nicht [zu] lesen.",
    ],
  },
  "de-b2-15": {
    idea: lines(
      "A passive can have no subject at all: Es wird getanzt = people are dancing. When another word starts the sentence, es disappears: Hier wird getanzt.",
      "يمكن للمبني للمجهول ألا يكون له فاعل أبداً: Es wird getanzt = يُرقص. وعندما تبدأ الجملة بكلمة أخرى يختفي es: Hier wird getanzt.",
      "Una pasiva puede no tener sujeto: Es wird getanzt = se baila. Cuando otra palabra abre la frase, es desaparece: Hier wird getanzt.",
      "Edilgen cümlenin hiç öznesi olmayabilir: Es wird getanzt = dans ediliyor. Cümleye başka bir sözcük gelirse es düşer: Hier wird getanzt.",
    ),
    right: "Es [wird] viel gelacht.",
    wrong: "Es [ist] viel gelacht.",
    notes: [
      note(
        "exception",
        lines(
          "es only stands at the start: Es wird getanzt, but Heute Abend wird getanzt (not Heute Abend wird es getanzt). The verb is always singular.",
          "لا يقف es إلا في بداية الجملة: Es wird getanzt، لكن Heute Abend wird getanzt (وليس Heute Abend wird es getanzt). والفعل دائماً مفرد.",
          "es solo va al inicio: Es wird getanzt, pero Heute Abend wird getanzt (no Heute Abend wird es getanzt). El verbo es siempre singular.",
          "es sadece başta durur: Es wird getanzt, ama Heute Abend wird getanzt (Heute Abend wird es getanzt değil). Fiil her zaman tekildir.",
        ),
        ["Heute Abend [wird] getanzt."],
      ),
    ],
    items: [
      "Es [wird] getanzt.",
      "Es [wurde] viel geredet.",
      "Es [wird] hier nicht geraucht.",
      "Es [wurde] bis spät gefeiert.",
      "Es [wird] heute Abend getanzt.",
      "Es [wurde] laut gelacht.",
    ],
  },
};
