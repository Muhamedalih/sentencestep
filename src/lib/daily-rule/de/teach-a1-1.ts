/**
 * German rules de-a1-01 ... de-a1-15 (basics, nouns and articles). Same shape as the English rules (../teach-types.ts):
 * the idea in simple English and in Arabic, Spanish and Turkish, a right and a wrong sentence with the part to look
 * at in [brackets], the notes of page two, and six prepared sentences with one blank each.
 */

import { lines, note, type RuleTeach } from "../teach-types";

export const TEACH_DE_A1_1: Readonly<Record<string, RuleTeach>> = {
  "de-a1-01": {
    idea: lines(
      "A subject pronoun says who does the action: ich (I), du (you, to a friend), er (he), sie (she), es (it).",
      "ضمير الفاعل يقول من يقوم بالفعل: ich (أنا)، du (أنتَ للصديق)، er (هو)، sie (هي)، es (للشيء المحايد).",
      "El pronombre sujeto dice quién hace la acción: ich (yo), du (tú), er (él), sie (ella), es (ello).",
      "Özne zamiri eylemi kimin yaptığını söyler: ich (ben), du (sen), er (o, erkek), sie (o, kadın), es (o, nesne).",
    ),
    right: "Mein Bruder wohnt in Berlin. [Er] ist Arzt.",
    wrong: "Mein Bruder wohnt in Berlin. [Es] ist Arzt.",
    notes: [
      note(
        "mistake",
        lines(
          "Always say the subject. Some languages can leave it out, German cannot: Ich bin müde (not Bin müde).",
          "لا بدّ من ذكر الفاعل. العربية قد تحذفه لأن الفعل يدل عليه، أما الألمانية فلا: Ich bin müde (وليس Bin müde).",
          "Di siempre el sujeto. En español se puede omitir, en alemán no: Ich bin müde (no Bin müde).",
          "Özneyi her zaman söyle. Türkçede düşebilir, Almancada düşmez: Ich bin müde (Bin müde değil).",
        ),
        ["[Ich] bin müde.", "Hast [du] Zeit?"],
      ),
      note(
        "detail",
        lines(
          "Things have a gender too, so you say er, sie or es for a thing: Der Tisch ist neu. Er ist groß.",
          "للأشياء جنس أيضاً، فنقول er أو sie أو es عن الشيء حسب جنسه: Der Tisch ist neu. Er ist groß.",
          "Las cosas también tienen género: Der Tisch ist neu. Er ist groß (la mesa es masculina).",
          "Nesnelerin de cinsiyeti vardır: Der Tisch ist neu. Er ist groß (masa eril olduğu için er).",
        ),
        ["Der Tisch ist alt. [Er] ist braun.", "Das Auto ist neu. [Es] ist schnell."],
      ),
    ],
    items: [
      "Das ist Tom. [Er] ist mein Freund.",
      "Das ist Anna. [Sie] wohnt in Wien.",
      "[Ich] heiße Mira.",
      "Hast [du] Zeit?",
      "Der Tisch ist alt. [Er] ist braun.",
      "Das Auto ist neu. [Es] ist schnell.",
    ],
  },
  "de-a1-02": {
    idea: lines(
      "wir means we, ihr means you (more than one friend), sie means they, and Sie with a capital S means you in a polite way.",
      "wir تعني نحن، وihr تعني أنتم (لأصدقاء)، وsie تعني هم/هن، وSie بحرف كبير تعني حضرتك أو حضراتكم (للاحترام).",
      "wir es nosotros, ihr es vosotros (amigos), sie es ellos y Sie, con mayúscula, es usted o ustedes.",
      "wir biz, ihr siz (arkadaşlar), sie onlar ve büyük harfli Sie saygılı sizdir.",
    ),
    right: "Tom und ich, [wir] lernen Deutsch.",
    wrong: "Tom und ich, [ihr] lernen Deutsch.",
    notes: [
      note(
        "detail",
        lines(
          "Use Sie with strangers, older people and at work. It always has a capital S and takes the same verb form as sie (they): Wie heißen Sie?",
          "نستعمل Sie مع الغرباء وكبار السن وفي العمل. وتُكتب دائماً بحرف S كبير ويأخذ الفعل معها شكل sie (هم): Wie heißen Sie؟",
          "Usa Sie con desconocidos, mayores y en el trabajo. Siempre va con S mayúscula y el verbo es igual que con sie (ellos): Wie heißen Sie?",
          "Sie, yabancılarla, yaşlılarla ve iş yerinde kullanılır. Hep büyük S ile yazılır ve fiil sie (onlar) ile aynıdır: Wie heißen Sie?",
        ),
        ["Wie heißen [Sie]?", "Meine Eltern sind nett. [Sie] wohnen in Köln."],
      ),
    ],
    items: [
      "Tom und ich gehen ins Kino. [Wir] haben Zeit.",
      "Kinder, habt [ihr] Hunger?",
      "Meine Eltern sind nett. [Sie] wohnen in Köln.",
      "Herr Meier, wie heißen [Sie]?",
      "[Ihr] seid spät!",
      "Anna und Tim lernen. [Sie] lernen Deutsch.",
    ],
  },
  "de-a1-03": {
    idea: lines(
      "sein (to be) changes with the subject: ich bin, du bist, er / sie / es ist.",
      "الفعل sein (يكون) يتغيّر مع الفاعل: ich bin، du bist، er / sie / es ist.",
      "sein (ser / estar) cambia con el sujeto: ich bin, du bist, er / sie / es ist.",
      "sein (olmak) özneye göre değişir: ich bin, du bist, er / sie / es ist.",
    ),
    right: "Ich [bin] müde.",
    wrong: "Ich [ist] müde.",
    notes: [
      note(
        "mistake",
        lines(
          "Do not leave sein out. Some languages say «I student» with no verb; German needs one: Ich bin Student.",
          "لا تحذف sein. العربية تقول «أنا طالب» بلا فعل، أما الألمانية فتحتاج فعلاً: Ich bin Student.",
          "sein cubre ser y estar: Ich bin Lehrer (soy), Ich bin müde (estoy). No lo omitas.",
          "Türkçedeki -im, -sin gibi ekler yerine Almancada ayrı bir sözcük kullanılır: Ich bin Student.",
        ),
        ["Ich [bin] Student.", "Er [ist] müde."],
      ),
    ],
    items: [
      "Ich [bin] Studentin.",
      "Du [bist] mein Freund.",
      "Er [ist] Lehrer.",
      "Wo [ist] der Bahnhof?",
      "[Bist] du hungrig?",
      "Es [ist] kalt heute.",
    ],
  },
  "de-a1-04": {
    idea: lines(
      "With wir, sie and Sie, sein is sind. With ihr, it is seid.",
      "مع wir وsie وSie يكون الفعل sind، ومع ihr يكون seid.",
      "Con wir, sie y Sie, sein es sind. Con ihr es seid.",
      "wir, sie ve Sie ile sein sind olur. ihr ile seid olur.",
    ),
    right: "Wir [sind] Freunde.",
    wrong: "Wir [seid] Freunde.",
    notes: [
      note(
        "detail",
        lines(
          "sind is also the polite form: Sie sind Herr Meier? (not Sie seid).",
          "sind هي أيضاً صيغة الاحترام: Sie sind Herr Meier؟ (وليس Sie seid).",
          "sind también es la forma de cortesía: Sie sind Herr Meier? (no Sie seid).",
          "sind saygılı biçimdir de: Sie sind Herr Meier? (Sie seid değil).",
        ),
        ["[Sind] Sie Herr Meier?", "Ihr [seid] nett."],
      ),
    ],
    items: [
      "Wir [sind] müde.",
      "Ihr [seid] spät.",
      "Meine Eltern [sind] zu Hause.",
      "[Sind] Sie Frau Berger?",
      "Tom und Anna [sind] Freunde.",
      "[Seid] ihr bereit?",
    ],
  },
  "de-a1-05": {
    idea: lines(
      "haben (to have): ich habe, du hast, er / sie / es hat, wir haben, ihr habt, sie haben.",
      "الفعل haben (يملك): ich habe، du hast، er / sie / es hat، wir haben، ihr habt، sie haben.",
      "haben (tener): ich habe, du hast, er / sie / es hat, wir haben, ihr habt, sie haben.",
      "haben (sahip olmak): ich habe, du hast, er / sie / es hat, wir haben, ihr habt, sie haben.",
    ),
    right: "Er [hat] ein Auto.",
    wrong: "Er [habt] ein Auto.",
    notes: [
      note(
        "exception",
        lines(
          "Only du and er / sie / es are irregular: du hast, er hat (the b disappears).",
          "الاستثناء في du وer / sie / es فقط: du hast وer hat (يختفي حرف b).",
          "Solo du y er / sie / es son irregulares: du hast, er hat (desaparece la b).",
          "Sadece du ve er / sie / es düzensizdir: du hast, er hat (b düşer).",
        ),
        ["Du [hast] Zeit.", "Sie [hat] einen Bruder."],
      ),
    ],
    items: [
      "Ich [habe] einen Bruder.",
      "Du [hast] Hunger.",
      "Sie [hat] eine Katze.",
      "Wir [haben] Zeit.",
      "Ihr [habt] Glück.",
      "[Hast] du ein Handy?",
    ],
  },
  "de-a1-06": {
    idea: lines(
      "A regular verb has a stem and an ending: ich wohne, du wohnst, er wohnt, wir wohnen, ihr wohnt, sie wohnen.",
      "الفعل المنتظم له جذر ونهاية: ich wohne، du wohnst، er wohnt، wir wohnen، ihr wohnt، sie wohnen.",
      "Un verbo regular tiene raíz y terminación: ich wohne, du wohnst, er wohnt, wir wohnen, ihr wohnt, sie wohnen.",
      "Düzenli bir fiilin kökü ve eki vardır: ich wohne, du wohnst, er wohnt, wir wohnen, ihr wohnt, sie wohnen.",
    ),
    right: "Er [wohnt] in Berlin.",
    wrong: "Er [wohnen] in Berlin.",
    notes: [
      note(
        "detail",
        lines(
          "To find the stem, remove -en from the infinitive: wohnen → wohn-. The infinitive is the form in the dictionary.",
          "لتجد الجذر احذف -en من المصدر: wohnen ← wohn-. والمصدر هو الشكل الذي تجده في القاموس.",
          "Para hallar la raíz, quita -en del infinitivo: wohnen → wohn-. El infinitivo es la forma del diccionario.",
          "Kökü bulmak için mastardan -en'i at: wohnen → wohn-. Mastar sözlükteki biçimdir.",
        ),
        ["Ich [lerne] Deutsch.", "Wir [lernen] Deutsch."],
      ),
    ],
    items: [
      "Ich [wohne] in Bagdad.{wohnen}",
      "Du [lernst] Deutsch.{lernen}",
      "Maria [spielt] Fußball.{spielen}",
      "Wir [kaufen] Brot.{kaufen}",
      "Ihr [macht] viel.{machen}",
      "Meine Eltern [leben] in Basra.{leben}",
    ],
  },
  "de-a1-07": {
    idea: lines(
      "In a statement the verb is always the second idea. If something else comes first, the subject moves behind the verb.",
      "في الجملة الخبرية يكون الفعل دائماً في المكانة الثانية. وإذا بدأنا بشيء آخر ينتقل الفاعل بعد الفعل.",
      "En una afirmación el verbo va siempre en segundo lugar. Si empieza otra cosa, el sujeto va detrás del verbo.",
      "Düz cümlede fiil her zaman ikinci sıradadır. Başka bir şey başa gelirse özne fiilin arkasına geçer.",
    ),
    right: "Heute [lerne] ich Deutsch.",
    wrong: "Heute [ich] lerne Deutsch.",
    notes: [
      note(
        "mistake",
        lines(
          "After a time word the verb still comes second: Heute gehe ich (not Heute ich gehe). Arabic often keeps the subject first, German does not.",
          "بعد كلمة الزمن يبقى الفعل ثانياً: Heute gehe ich (وليس Heute ich gehe). العربية قد تُبقي الفاعل أولاً أما الألمانية فلا.",
          "Tras una palabra de tiempo el verbo sigue siendo el segundo: Heute gehe ich (no Heute ich gehe).",
          "Zaman sözcüğünden sonra da fiil ikinci kalır: Heute gehe ich (Heute ich gehe değil).",
        ),
        ["Morgen [fahre] ich nach Köln.", "Dort [wohnt] meine Tante."],
      ),
    ],
    items: [
      "Morgen [fahre] ich nach Köln.{fahren}",
      "Am Montag [habe] ich Zeit.{haben}",
      "Jetzt [esse] ich.{essen}",
      "Dort [wohnt] meine Tante.{wohnen}",
      "Im Sommer [reisen] wir viel.{reisen}",
      "Heute [kommt] Anna.{kommen}",
    ],
  },
  "de-a1-08": {
    idea: lines(
      "Every noun starts with a capital letter, in the middle of a sentence too: der Hund, die Stadt, das Haus.",
      "كل اسم يبدأ بحرف كبير، حتى في وسط الجملة: der Hund، die Stadt، das Haus.",
      "Todos los sustantivos se escriben con mayúscula, también dentro de la frase: der Hund, die Stadt, das Haus.",
      "Her isim büyük harfle başlar, cümlenin ortasında bile: der Hund, die Stadt, das Haus.",
    ),
    right: "Ich habe einen [Hund].",
    wrong: "Ich habe einen [hund].",
    notes: [
      note(
        "detail",
        lines(
          "Only nouns get a capital, not verbs or adjectives: Ich lerne Deutsch (Deutsch is the name of the language, so it is capital).",
          "الأسماء وحدها تُكتب بحرف كبير، لا الأفعال ولا الصفات: Ich lerne Deutsch (اسم اللغة يُكتب بحرف كبير).",
          "Solo los sustantivos llevan mayúscula, no los verbos ni los adjetivos: Ich lerne Deutsch.",
          "Sadece isimler büyük yazılır, fiiller ve sıfatlar değil: Ich lerne Deutsch.",
        ),
        ["Ich lerne [Deutsch].", "Wir essen [Brot]."],
      ),
    ],
    items: [
      "Ich habe einen [Hund].{dog}",
      "Die [Stadt] ist groß.{city}",
      "Wir essen [Brot].{bread}",
      "Das [Haus] ist neu.{house}",
      "Er trinkt [Kaffee].{coffee}",
      "Sie liest ein [Buch].{book}",
    ],
  },
  "de-a1-09": {
    idea: lines(
      "Every German noun has a gender: der (masculine), die (feminine) or das (neuter). Learn each noun with its article.",
      "لكل اسم ألماني جنس: der (مذكر) أو die (مؤنث) أو das (محايد). تعلّم كل اسم مع أداته.",
      "Cada sustantivo alemán tiene género: der (masculino), die (femenino) o das (neutro). Aprende cada sustantivo con su artículo.",
      "Her Almanca ismin cinsiyeti vardır: der (eril), die (dişil) veya das (nötr). Her ismi artikeliyle öğren.",
    ),
    right: "[Der] Tisch ist neu.",
    wrong: "[Die] Tisch ist neu.",
    notes: [
      note(
        "detail",
        lines(
          "The plural is always die: der Mann → die Männer, das Kind → die Kinder.",
          "الجمع دائماً die: der Mann ← die Männer، وdas Kind ← die Kinder.",
          "El plural es siempre die: der Mann → die Männer, das Kind → die Kinder.",
          "Çoğul her zaman die'dir: der Mann → die Männer, das Kind → die Kinder.",
        ),
        ["[Die] Kinder spielen.", "[Die] Männer lesen."],
      ),
      note(
        "mistake",
        lines(
          "The gender does not follow the meaning. A girl is neuter: das Mädchen. Learn the article with every new noun.",
          "الجنس لا يتبع المعنى. البنت محايدة: das Mädchen. تعلّم الأداة مع كل اسم جديد.",
          "El género no sigue el significado: das Mädchen (la niña) es neutro. Aprende el artículo con cada sustantivo.",
          "Cinsiyet anlama uymaz: das Mädchen (kız çocuğu) nötrdür. Her yeni isimle artikeli de öğren.",
        ),
        ["[Das] Mädchen lacht.", "[Die] Sonne scheint."],
      ),
    ],
    items: [
      "[Der] Mann liest.{m}",
      "[Die] Frau trinkt Tee.{f}",
      "[Das] Kind spielt.{n}",
      "[Der] Hund schläft.{m}",
      "[Das] Haus ist groß.{n}",
      "[Die] Sonne scheint.{f}",
    ],
  },
  "de-a1-10": {
    idea: lines(
      "ein goes with masculine and neuter nouns, eine with feminine nouns: ein Tisch, ein Haus, eine Lampe.",
      "ein مع الأسماء المذكرة والمحايدة، وeine مع المؤنثة: ein Tisch، ein Haus، eine Lampe.",
      "ein va con sustantivos masculinos y neutros, eine con femeninos: ein Tisch, ein Haus, eine Lampe.",
      "ein eril ve nötr isimlerle, eine dişil isimlerle kullanılır: ein Tisch, ein Haus, eine Lampe.",
    ),
    right: "Das ist [eine] Katze.",
    wrong: "Das ist [ein] Katze.",
    notes: [
      note(
        "detail",
        lines(
          "ein and eine have no plural. For many things use no article: Ich habe Bücher.",
          "ليس لـ ein وeine جمع. للجمع لا نضع أداة: Ich habe Bücher.",
          "ein y eine no tienen plural. Para varias cosas no se usa artículo: Ich habe Bücher.",
          "ein ve eine'nin çoğulu yoktur. Çoğulda artikel kullanılmaz: Ich habe Bücher.",
        ),
        ["Ich habe [Bücher].", "Wir haben [Katzen]."],
      ),
    ],
    items: [
      "Das ist [ein] Hund.{m}",
      "Das ist [eine] Katze.{f}",
      "Ich habe [ein] Auto.{n}",
      "Sie hat [eine] Schwester.{f}",
      "Das ist [ein] Haus.{n}",
      "Er ist [ein] Lehrer.{m}",
    ],
  },
  "de-a1-11": {
    idea: lines(
      "German nouns make the plural in several ways: -e, -en, -er, -n, -s, an umlaut, or no change. Learn the plural with the noun.",
      "للأسماء الألمانية طرق عدة للجمع: -e و-en و-er و-n و-s أو تغيير الحرف (umlaut) أو بلا تغيير. تعلّم الجمع مع الاسم.",
      "Los sustantivos alemanes forman el plural de varias maneras: -e, -en, -er, -n, -s, diéresis o sin cambio. Aprende el plural con el sustantivo.",
      "Almanca isimler çoğulu çeşitli yollarla yapar: -e, -en, -er, -n, -s, ünlü değişimi veya hiç değişmez. Çoğulu isimle birlikte öğren.",
    ),
    right: "Zwei [Kinder] spielen.",
    wrong: "Zwei [Kinde] spielen.",
    notes: [
      note(
        "detail",
        lines(
          "Write the plural next to the noun in your notes: der Tag, die Tage; die Frau, die Frauen; das Kind, die Kinder; das Auto, die Autos.",
          "اكتب الجمع بجانب الاسم في دفترك: der Tag، die Tage؛ die Frau، die Frauen؛ das Kind، die Kinder؛ das Auto، die Autos.",
          "Anota el plural junto al sustantivo: der Tag, die Tage; die Frau, die Frauen; das Kind, die Kinder; das Auto, die Autos.",
          "Defterine çoğulu isimle birlikte yaz: der Tag, die Tage; die Frau, die Frauen; das Kind, die Kinder; das Auto, die Autos.",
        ),
        ["Drei [Tage]", "Viele [Autos]"],
      ),
    ],
    items: [
      "Zwei [Kinder] spielen.{Kind}",
      "Wir bleiben drei [Tage].{Tag}",
      "Fünf [Frauen] warten.{Frau}",
      "Hier stehen viele [Autos].{Auto}",
      "Sie hat zwei [Katzen].{Katze}",
      "Wir haben zwei [Hunde].{Hund}",
    ],
  },
  "de-a1-12": {
    idea: lines(
      "To say no to a noun, use kein (masculine and neuter) or keine (feminine and plural) instead of ein / eine.",
      "للنفي مع الاسم نستعمل kein (للمذكر والمحايد) أو keine (للمؤنث والجمع) بدل ein / eine.",
      "Para negar un sustantivo usa kein (masculino y neutro) o keine (femenino y plural) en vez de ein / eine.",
      "Bir ismi olumsuz yapmak için ein / eine yerine kein (eril ve nötr) veya keine (dişil ve çoğul) kullan.",
    ),
    right: "Ich habe [kein] Auto.",
    wrong: "Ich habe [nicht] Auto.",
    notes: [
      note(
        "detail",
        lines(
          "With a masculine noun as the object, kein becomes keinen: Ich habe keinen Hund (see the accusative).",
          "إذا كان الاسم المذكر مفعولاً به يصبح kein إلى keinen: Ich habe keinen Hund (انظر قاعدة المفعول به).",
          "Con un sustantivo masculino como objeto, kein pasa a keinen: Ich habe keinen Hund (ver el acusativo).",
          "Eril isim nesne olduğunda kein, keinen olur: Ich habe keinen Hund (Akkusativ kuralına bak).",
        ),
        ["Ich habe [keinen] Hund."],
      ),
    ],
    items: [
      "Ich habe [kein] Auto.{n}",
      "Wir haben [keine] Kinder.",
      "Das ist [kein] Problem.{n}",
      "Sie hat [keine] Zeit.{f}",
      "Hier gibt es [kein] Wasser.{n}",
      "Er hat [keine] Geschwister.",
    ],
  },
  "de-a1-13": {
    idea: lines(
      "mein, dein, sein, ihr say who owns something. They take the same endings as ein: mein Vater, meine Mutter.",
      "mein وdein وsein وihr تقول لمن الشيء. وتأخذ نهايات ein نفسها: mein Vater، meine Mutter.",
      "mein, dein, sein, ihr dicen de quién es algo. Llevan las mismas terminaciones que ein: mein Vater, meine Mutter.",
      "mein, dein, sein, ihr bir şeyin kime ait olduğunu söyler. ein ile aynı ekleri alır: mein Vater, meine Mutter.",
    ),
    right: "[Meine] Mutter kocht.",
    wrong: "[Mein] Mutter kocht.",
    notes: [
      note(
        "mistake",
        lines(
          "sein = his, ihr = her. It depends on the owner, not on the noun: Tom und seine Schwester, Anna und ihr Bruder.",
          "sein = له، وihr = لها. يعتمد على المالك لا على الاسم: Tom und seine Schwester، Anna und ihr Bruder.",
          "sein = su (de él), ihr = su (de ella). Depende del dueño, no del sustantivo: Tom und seine Schwester, Anna und ihr Bruder.",
          "sein = onun (erkek), ihr = onun (kadın). Sahibine bağlıdır, isme değil: Tom und seine Schwester, Anna und ihr Bruder.",
        ),
        ["Tom und [seine] Schwester", "Anna und [ihr] Bruder"],
      ),
    ],
    items: [
      "Das ist [mein] Bruder.{m}",
      "Das ist [meine] Schwester.{f}",
      "Ist das [dein] Buch?{n}",
      "Wo ist [deine] Tasche?{f}",
      "Tom und [seine] Frau wohnen hier.",
      "Anna und [ihr] Mann wohnen hier.",
    ],
  },
  "de-a1-14": {
    idea: lines(
      "unser (our) and euer (your, for several people) work like mein: unser Haus, unsere Katze, euer Auto, eure Tasche.",
      "unser (لنا) وeuer (لكم) يعملان مثل mein: unser Haus، unsere Katze، euer Auto، eure Tasche.",
      "unser (nuestro) y euer (vuestro) funcionan como mein: unser Haus, unsere Katze, euer Auto, eure Tasche.",
      "unser (bizim) ve euer (sizin) mein gibi çalışır: unser Haus, unsere Katze, euer Auto, eure Tasche.",
    ),
    right: "[Unsere] Katze ist klein.",
    wrong: "[Unser] Katze ist klein.",
    notes: [
      note(
        "exception",
        lines(
          "euer loses its e before an ending: euer Auto, but eure Tasche (not euere).",
          "euer تفقد حرف e قبل النهاية: euer Auto، لكن eure Tasche (وليس euere).",
          "euer pierde la e ante una terminación: euer Auto, pero eure Tasche (no euere).",
          "euer, ek almadan önce e'sini kaybeder: euer Auto, ama eure Tasche (euere değil).",
        ),
        ["[Eure] Kinder sind süß.", "Wo ist [euer] Auto?"],
      ),
    ],
    items: [
      "[Unser] Haus ist groß.{n}",
      "Das ist [unsere] Schule.{f}",
      "Wo ist [euer] Auto?{n}",
      "[Eure] Kinder sind süß.",
      "Das ist [unser] Lehrer.{m}",
      "Ist das [eure] Tasche?{f}",
    ],
  },
  "de-a1-15": {
    idea: lines(
      "German joins words into one long noun: Haus + Tür = Haustür. The last word decides the gender: die Tür, so die Haustür.",
      "تجمع الألمانية الكلمات في اسم واحد طويل: Haus + Tür = Haustür. وآخر كلمة تحدد الجنس: die Tür إذن die Haustür.",
      "El alemán une palabras en un sustantivo largo: Haus + Tür = Haustür. La última palabra decide el género: die Tür, así que die Haustür.",
      "Almanca sözcükleri birleştirip tek uzun bir isim yapar: Haus + Tür = Haustür. Cinsiyeti son sözcük belirler: die Tür, yani die Haustür.",
    ),
    right: "Die [Haustür] ist offen.",
    wrong: "Das [Haustür] ist offen.",
    notes: [
      note(
        "detail",
        lines(
          "When a compound looks long, split it from the end: Zahnbürste = Zahn + Bürste (tooth + brush).",
          "إذا بدا الاسم طويلاً فقسّمه من آخره: Zahnbürste = Zahn + Bürste (سن + فرشاة).",
          "Si un compuesto parece largo, divídelo desde el final: Zahnbürste = Zahn + Bürste (diente + cepillo).",
          "Birleşik isim uzun görünürse sondan böl: Zahnbürste = Zahn + Bürste (diş + fırça).",
        ),
        ["Die [Zahnbürste] ist neu.", "Der [Bahnhof] ist weit."],
      ),
    ],
    items: [
      "Die [Haustür] ist offen.{Haus + Tür}",
      "Der [Bahnhof] ist weit.{Bahn + Hof}",
      "Das [Wohnzimmer] ist groß.{Wohn + Zimmer}",
      "Die [Hausaufgabe] ist leicht.{Haus + Aufgabe}",
      "Der [Geburtstag] ist heute.{Geburt + Tag}",
      "Das [Schlafzimmer] ist dunkel.{Schlaf + Zimmer}",
    ],
  },
};
