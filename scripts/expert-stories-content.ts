/**
 * Expert (Stories level 4, C1) lessons story-214..223: ten new emotional / funny stories whose
 * difficulty comes from rare words, not from length (7-9 sentences, ~8-12 words each, like the other
 * levels). Every sentence carries its Arabic, Spanish and Turkish translation, and one gloss per English
 * token in all three languages.
 *
 * Authoring format of a sentence: s(ar, es, tr, spec) where spec is the English sentence written
 * token by token, "token=ar/es/tr | token=ar/es/tr | ...". The English text is rebuilt from the tokens
 * (joined by a space), so the glosses can never drift out of step with the words.
 */

export interface TokenGloss {
  en: string;
  ar: string;
  es: string;
  tr: string;
}

export interface ExpertSentence {
  en: string;
  ar: string;
  es: string;
  tr: string;
  tokens: TokenGloss[];
}

export interface ExpertStory {
  id: string;
  /** order_index inside the stories mode (after story-213's 215). */
  order: number;
  narrator: "male" | "female";
  title: string;
  titleAr: string;
  titleEs: string;
  titleTr: string;
  desc: string;
  descAr: string;
  descEs: string;
  descTr: string;
  /** The hard target words (literal tokens of the story) with an Arabic dictionary gloss. */
  targets: { en: string; ar: string }[];
  sentences: ExpertSentence[];
}

function parse(spec: string): TokenGloss[] {
  return spec.split(" | ").map((part) => {
    const eq = part.indexOf("=");
    if (eq < 1) throw new Error(`bad token spec: ${part}`);
    const en = part.slice(0, eq);
    const [ar, es, tr, ...extra] = part.slice(eq + 1).split("/");
    if (extra.length || ar === undefined || es === undefined || tr === undefined) {
      throw new Error(`token "${en}" needs exactly ar/es/tr glosses: ${part}`);
    }
    return { en, ar: ar.trim(), es: es.trim(), tr: tr.trim() };
  });
}

function s(ar: string, es: string, tr: string, spec: string): ExpertSentence {
  const tokens = parse(spec);
  return { en: tokens.map((t) => t.en).join(" "), ar, es, tr, tokens };
}

export const expertStories: ExpertStory[] = [
  // ---------------------------------------------------------------- 214
  {
    id: "story-214",
    order: 216,
    narrator: "male",
    title: "The Rooster Next Door",
    titleAr: "الديك الذي بجواري",
    titleEs: "El gallo de al lado",
    titleTr: "Yan Evin Horozu",
    desc: "Six months of dawn screaming, and then one terrible silence",
    descAr: "ستة أشهر من الصراخ عند الفجر، ثم صمت واحد رهيب",
    descEs: "Seis meses de gritos al amanecer, y de pronto un silencio terrible",
    descTr: "Altı ay şafak çığlıkları, sonra korkunç bir sessizlik",
    targets: [
      { en: "eerie", ar: "مخيف وغريب" },
      { en: "wheezing", ar: "يتنفس بصعوبة" },
      { en: "tormentor", ar: "معذِّب" },
    ],
    sentences: [
      s(
        "طوال ستة أشهر، كان ديك جاري يصرخ عند الفجر.",
        "Durante seis meses, el gallo de mi vecino gritó al amanecer",
        "Altı ay boyunca komşumun horozu şafakta bağırdı",
        "For=لمدة/durante/boyunca | six=ستة/seis/altı | months,=أشهر/meses/ay | my=لي/mi/benim | neighbor's=جاري/vecino/komşumun | rooster=ديك/gallo/horoz | screamed=صرخ/gritó/bağırdı | at=عند/al/-de | dawn=الفجر/amanecer/şafak",
      ),
      s(
        "جرّبت سدادات الأذن والوسائد وقصيدة وقحة للغاية.",
        "Probé tapones, almohadas y un poema sumamente grosero",
        "Kulak tıkaçlarını, yastıkları ve son derece kaba bir şiiri denedim",
        "I=أنا/yo/ben | tried=جرّبت/probé/denedim | earplugs,=سدادات الأذن/tapones/kulak tıkacı | pillows,=وسائد/almohadas/yastık | and=و/y/ve | one=واحدة/un/bir | extremely=للغاية/sumamente/son derece | rude=وقحة/grosero/kaba | poem=قصيدة/poema/şiir",
      ),
      s(
        "هزّت السيدة أوكافور كتفيها وحسب، ووصفته بأنه دقيق في مواعيده.",
        "La señora Okafor solo se encogió de hombros y lo llamó puntual",
        "Bayan Okafor sadece omuz silkti ve ona dakik dedi",
        "Mrs.=السيدة/señora/Bayan | Okafor=أوكافور/Okafor/Okafor | merely=فقط/simplemente/sadece | shrugged=هزّت كتفيها/se encogió de hombros/omuz silkti | and=و/y/ve | called=وصفته/llamó/dedi | him=إياه/lo/ona | punctual=دقيق في مواعيده/puntual/dakik",
      ),
      s(
        "ثم، في أحد أيام الاثنين، ابتلع صمتٌ مخيف الشارع.",
        "Entonces, un lunes, un silencio inquietante se tragó la calle",
        "Sonra, bir pazartesi, ürkütücü bir sessizlik sokağı yuttu",
        "Then,=ثم/entonces/sonra | one=في أحد/un/bir | Monday,=الاثنين/lunes/pazartesi | an=ال/un/bir | eerie=مخيف/inquietante/ürkütücü | silence=صمت/silencio/sessizlik | swallowed=ابتلع/se tragó/yuttu | the=ال/la/-ı | street=شارع/calle/sokak",
      ),
      s(
        "بحلول الظهر كنت أطرق بابها، مذعوراً.",
        "Al mediodía golpeaba su puerta, frenético",
        "Öğleye doğru telaşla kapısını çalıyordum",
        "By=بحلول/para/-e doğru | noon,=الظهر/mediodía/öğle | I=أنا/yo/ben | was=كنت/estaba/-yordum | knocking=أطرق/golpeando/çalıyordum | on=على/en/üzerine | her=ها/su/onun | door,=الباب/puerta/kapı | frantic=مذعوراً/frenético/telaşlı",
      ),
      s(
        "كان الديك ملفوفاً بمنشفة، يتنفس بصعوبة وبضعف.",
        "El gallo yacía envuelto en una toalla, resollando débilmente",
        "Horoz bir havluya sarılı yatıyor, güçsüzce hırıldıyordu",
        "The=ال/el/o | rooster=ديك/gallo/horoz | lay=كان مستلقياً/yacía/yatıyordu | wrapped=ملفوفاً/envuelto/sarılı | in=في/en/içinde | a=ال/una/bir | towel,=منشفة/toalla/havlu | wheezing=يتنفس بصعوبة/resollando/hırıldayarak | weakly=بضعف/débilmente/güçsüzce",
      ),
      s(
        "همست: «أصابه برد، وهو متجهم منذ أيام».",
        'Susurró: "Cogió un resfriado, y está enfurruñado"',
        'Fısıldadı: "Üşüttü ve küsmüş durumda"',
        '"He=هو/él/o | caught=أصابه/pilló/yakalandı | a=ال/un/bir | chill,"=برد/resfriado/üşütme | she=هي/ella/o | whispered,=همست/susurró/fısıldadı | "and=و/y/ve | he\'s=إنه/está/o | sulking"=متجهم/enfurruñado/küskün',
      ),
      s(
        "أدركت، وقد أصابني الذعر، أنني اشتقت إلى معذِّبي.",
        "Horrorizado, me di cuenta de que había echado de menos a mi torturador",
        "Dehşete düşerek işkencecimi özlediğimi fark ettim",
        "Horrified,=مذعوراً/horrorizado/dehşete düşmüş | I=أنا/yo/ben | realized=أدركت/me di cuenta/fark ettim | I=أنني/yo/ben | had=كنت/había/-mıştım | missed=اشتقت/echado de menos/özlemiştim | my=لـ/mi/benim | tormentor=معذِّبي/torturador/işkencecim",
      ),
      s(
        "عند فجر اليوم التالي، صاح الديك، فصفقت له.",
        "Al amanecer del día siguiente, cantó, y yo aplaudí",
        "Ertesi günün şafağında öttü, ben de alkışladım",
        "At=عند/al/-de | dawn=فجر/amanecer/şafak | the=ال/el/- | next=التالي/siguiente/ertesi | day,=يوم/día/gün | he=هو/él/o | crowed,=صاح/cantó/öttü | and=و/y/ve | I=أنا/yo/ben | applauded=صفقت/aplaudí/alkışladım",
      ),
    ],
  },
  // ---------------------------------------------------------------- 215
  {
    id: "story-215",
    order: 217,
    narrator: "male",
    title: "The Parrot Told Everyone",
    titleAr: "الببغاء الذي أخبر الجميع",
    titleEs: "El loro que se lo contó a todos",
    titleTr: "Herkese Anlatan Papağan",
    desc: "He told his secret only to his parrot, which was a terrible idea",
    descAr: "أسرّ بسرّه لببغائه وحده، وكانت تلك فكرة سيئة جداً",
    descEs: "Le contó su secreto solo a su loro, una pésima idea",
    descTr: "Sırrını yalnızca papağanına anlattı, bu çok kötü bir fikirdi",
    targets: [
      { en: "hopelessly", ar: "بلا أمل" },
      { en: "crimson", ar: "قرمزي" },
      { en: "gossip", ar: "نمّام" },
    ],
    sentences: [
      s(
        "همس دانيال بسرّه لببغائه غاس وحده.",
        "Daniel le susurró su secreto solo a su loro, Gus",
        "Daniel sırrını yalnızca papağanı Gus'a fısıldadı",
        "Daniel=دانيال/Daniel/Daniel | whispered=همس/susurró/fısıldadı | his=ـه/su/onun | secret=سرّه/secreto/sır | only=فقط/solo/yalnızca | to=إلى/a/-e | his=ـه/su/onun | parrot,=ببغاء/loro/papağan | Gus=غاس/Gus/Gus",
      ),
      s(
        "«أنا واقع في حب رانيا من المخبز، بلا أمل».",
        '"Estoy perdidamente enamorado de Rania, la de la panadería"',
        '"Fırındaki Rania\'ya umutsuzca âşığım"',
        '"I\'m=أنا/estoy/ben | hopelessly=بلا أمل/perdidamente/umutsuzca | in=في/en/içinde | love=الحب/amor/aşk | with=مع/con/ile | Rania=رانيا/Rania/Rania | from=من/de/-den | the=ال/la/- | bakery"=المخبز/panadería/fırın',
      ),
      s(
        "لأسابيع لم يكرر غاس شيئاً، فشعر دانيال بالأمان.",
        "Durante semanas, Gus no repitió nada, así que Daniel se sintió a salvo",
        "Haftalarca Gus hiçbir şey tekrarlamadı, bu yüzden Daniel kendini güvende hissetti",
        "For=لمدة/durante/boyunca | weeks,=أسابيع/semanas/hafta | Gus=غاس/Gus/Gus | repeated=كرر/repitió/tekrarladı | nothing,=لا شيء/nada/hiçbir şey | so=لذلك/así que/bu yüzden | Daniel=دانيال/Daniel/Daniel | felt=شعر/sintió/hissetti | safe=بالأمان/a salvo/güvende",
      ),
      s(
        "ثم جاءت رانيا لتناول الشاي، فنحنح غاس.",
        "Luego Rania vino a tomar el té, y Gus se aclaró la garganta",
        "Sonra Rania çaya geldi ve Gus boğazını temizledi",
        "Then=ثم/luego/sonra | Rania=رانيا/Rania/Rania | came=جاءت/vino/geldi | for=لـ/a/için | tea,=الشاي/té/çay | and=و/y/ve | Gus=غاس/Gus/Gus | cleared=نحنح/aclaró/temizledi | his=ـه/su/onun | throat=حلقه/garganta/boğaz",
      ),
      s(
        "«واقع في الحب بلا أمل!» نعق غاس، «رانيا من المخبز!»",
        '"¡Perdidamente enamorado!", chilló Gus, "¡Rania, la de la panadería!"',
        '"Umutsuzca âşık!" diye ciyakladı Gus, "Fırındaki Rania!"',
        '"Hopelessly=بلا أمل/perdidamente/umutsuzca | in=في/en/içinde | love!"=الحب/amor/aşk | Gus=غاس/Gus/Gus | squawked,=نعق/chilló/ciyakladı | "Rania=رانيا/Rania/Rania | from=من/de/-den | the=ال/la/- | bakery!"=المخبز/panadería/fırın',
      ),
      s(
        "احمرّ وجه دانيال حتى صار قرمزياً واختبأ خلف الستارة.",
        "Daniel se puso carmesí y se escondió detrás de la cortina",
        "Daniel kıpkırmızı oldu ve perdenin arkasına saklandı",
        "Daniel=دانيال/Daniel/Daniel | turned=أصبح/se puso/oldu | crimson=قرمزياً/carmesí/kıpkırmızı | and=و/y/ve | hid=اختبأ/se escondió/saklandı | behind=خلف/detrás de/arkasına | the=ال/la/- | curtain=الستارة/cortina/perde",
      ),
      s(
        "ضحكت رانيا بشدة حتى كادت تسكب شايها.",
        "Rania rió tan fuerte que casi derramó su té",
        "Rania o kadar güldü ki neredeyse çayını döküyordu",
        "Rania=رانيا/Rania/Rania | laughed=ضحكت/rió/güldü | so=جداً/tanto/o kadar | hard=بشدة/fuerte/sert | she=هي/ella/o | nearly=كادت/casi/neredeyse | spilled=تسكب/derramó/döktü | her=ـها/su/onun | tea=شاي/té/çay",
      ),
      s(
        "«نمّام فظيع»، قالت لغاس، «لكنه ساعي رسائل ممتاز».",
        '"Chismoso terrible", le dijo a Gus, "pero un mensajero excelente"',
        '"Berbat bir dedikoducu", dedi Gus\'a, "ama mükemmel bir haberci"',
        '"Terrible=فظيع/terrible/berbat | gossip,"=نمّام/chismoso/dedikoducu | she=هي/ella/o | told=قالت/dijo/dedi | Gus,=لغاس/a Gus/Gus\'a | "but=لكن/pero/ama | an=ال/un/bir | excellent=ممتاز/excelente/mükemmel | messenger"=ساعي رسائل/mensajero/haberci',
      ),
      s(
        "دعاها دانيال أخيراً إلى موعد، وصرخ غاس: «قولي نعم!»",
        'Daniel por fin la invitó a salir, y Gus gritó: "¡Di que sí!"',
        'Daniel sonunda ona çıkma teklif etti ve Gus bağırdı: "Evet de!"',
        'Daniel=دانيال/Daniel/Daniel | finally=أخيراً/por fin/sonunda | asked=دعا/invitó/davet etti | her=ـها/la/onu | out,=للخروج/a salir/dışarı | and=و/y/ve | Gus=غاس/Gus/Gus | screamed,=صرخ/gritó/bağırdı | "Say=قولي/di/de | yes!"=نعم/sí/evet',
      ),
    ],
  },
  // ---------------------------------------------------------------- 216
  {
    id: "story-216",
    order: 218,
    narrator: "male",
    title: "Seventy-Eight and Swiping",
    titleAr: "ثمانية وسبعون وما زال يمرّر",
    titleEs: "Setenta y ocho años, y deslizando",
    titleTr: "Yetmiş Sekiz Yaşında ve Kaydırıyor",
    desc: "A grandfather joins a dating app and meets a match with a secret of her own",
    descAr: "جدّ ينضم إلى تطبيق مواعدة ويقابل امرأة لها سرّها الصغير أيضاً",
    descEs: "Un abuelo se une a una aplicación de citas y conoce a alguien con su propio secreto",
    descTr: "Bir dede flört uygulamasına katılır ve kendi küçük sırrı olan biriyle tanışır",
    targets: [
      { en: "scandalized", ar: "مصدوم" },
      { en: "nonchalantly", ar: "ببرود" },
      { en: "bicker", ar: "يتشاجر" },
    ],
    sentences: [
      s(
        "في الثامنة والسبعين، انضم وليد إلى تطبيق مواعدة بدافع الملل.",
        "A los setenta y ocho años, Walid se unió a una aplicación de citas por aburrimiento",
        "Yetmiş sekiz yaşında Velid, sıkıntıdan bir flört uygulamasına katıldı",
        "At=في/a/-de | seventy-eight,=ثمانية وسبعين/setenta y ocho/yetmiş sekiz | Walid=وليد/Walid/Velid | joined=انضم/se unió/katıldı | a=إلى/una/bir | dating=مواعدة/citas/flört | app=تطبيق/aplicación/uygulama | out=بدافع/por/-dan | of=من/de/- | boredom=الملل/aburrimiento/sıkıntı",
      ),
      s(
        "صُدم أحفاده، لكنه تجاهلهم.",
        "Sus nietos estaban escandalizados, pero él los ignoró",
        "Torunları şoke olmuştu ama o onları görmezden geldi",
        "His=ـه/sus/onun | grandchildren=أحفاده/nietos/torunları | were=كانوا/estaban/-ydı | scandalized,=مصدومين/escandalizados/şoke olmuş | but=لكن/pero/ama | he=هو/él/o | ignored=تجاهل/ignoró/görmezden geldi | them=هم/los/onları",
      ),
      s(
        "ببرود، كتب عمره ثمانية وستين.",
        "Con indiferencia, anotó su edad como sesenta y ocho",
        "Umursamazca yaşını altmış sekiz olarak yazdı",
        "Nonchalantly,=ببرود/con indiferencia/umursamazca | he=هو/él/o | listed=كتب/anotó/yazdı | his=ـه/su/onun | age=عمره/edad/yaş | as=على أنه/como/olarak | sixty-eight=ثمانية وستين/sesenta y ocho/altmış sekiz",
      ),
      s(
        "وكانت سلمى، شريكته في التطبيق، قد أنقصت من عمرها عشر سنوات أيضاً.",
        "Su pareja, Salma, también se había quitado diez años",
        "Eşleşmesi Selma da on yıl kırpmıştı",
        "His=ـه/su/onun | match,=شريكته/pareja/eşleşmesi | Salma,=سلمى/Salma/Selma | had=كانت/había/-mıştı | also=أيضاً/también/de | trimmed=أنقصت/quitado/kırpmıştı | ten=عشر/diez/on | years=سنوات/años/yıl",
      ),
      s(
        "التقيا في مقهى، يختبئ كل منهما خلف قائمة الطعام.",
        "Se encontraron en un café, escondidos detrás de los menús",
        "Bir kafede buluştular, menülerin ardına saklanarak",
        "They=هما/ellos/onlar | met=التقيا/se encontraron/buluştular | at=في/en/-de | a=ال/un/bir | café,=مقهى/café/kafe | hiding=يختبئان/escondidos/saklanarak | behind=خلف/detrás de/arkasına | menus=قوائم الطعام/menús/menüler",
      ),
      s(
        "«كن صادقاً»، تنهدت سلمى، «كم عمرك؟»",
        '"Sé sincero", suspiró Salma, "¿cuántos años tienes?"',
        '"Dürüst ol", diye iç çekti Selma, "kaç yaşındasın?"',
        '"Be=كن/sé/ol | honest,"=صادقاً/sincero/dürüst | Salma=سلمى/Salma/Selma | sighed,=تنهدت/suspiró/iç çekti | "how=كم/cuántos/kaç | old=عمراً/años/yaşında | are=أنت/tienes/-sın | you?"=أنت/tú/sen',
      ),
      s(
        "«ثمانية وسبعون»، اعترف، «مع ركبة سيئة».",
        '"Setenta y ocho", confesó, "con una rodilla mala"',
        '"Yetmiş sekiz", diye itiraf etti, "bir de kötü bir dizle"',
        '"Seventy-eight,"=ثمانية وسبعون/setenta y ocho/yetmiş sekiz | he=هو/él/o | confessed,=اعترف/confesó/itiraf etti | "with=مع/con/ile | a=ال/una/bir | bad=سيئة/mala/kötü | knee"=ركبة/rodilla/diz',
      ),
      s(
        "«تسعة وسبعون»، ابتسمت بمكر، «مع مفصل ورك من التيتانيوم».",
        '"Setenta y nueve", sonrió, "con una cadera de titanio"',
        '"Yetmiş dokuz", diye sırıttı, "bir de titanyum kalçayla"',
        '"Seventy-nine,"=تسعة وسبعون/setenta y nueve/yetmiş dokuz | she=هي/ella/o | grinned,=ابتسمت بمكر/sonrió/sırıttı | "with=مع/con/ile | a=ال/una/bir | titanium=تيتانيوم/de titanio/titanyum | hip"=ورك/cadera/kalça',
      ),
      s(
        "تقاسما الحلوى وبدآ يتشاجران بمرح حول من يبدو أصغر سناً.",
        "Compartieron el postre y empezaron a discutir sobre quién parecía más joven",
        "Tatlıyı paylaştılar ve kimin daha genç göründüğü konusunda atışmaya başladılar",
        "They=هما/ellos/onlar | shared=تقاسما/compartieron/paylaştılar | dessert=الحلوى/postre/tatlı | and=و/y/ve | began=بدآ/empezaron/başladılar | to=أن/a/-meye | bicker=يتشاجرا/discutir/atışmaya | about=حول/sobre/hakkında | who=من/quién/kimin | looked=يبدو/parecía/göründüğü | younger=أصغر/más joven/daha genç",
      ),
    ],
  },
  // ---------------------------------------------------------------- 217
  {
    id: "story-217",
    order: 219,
    narrator: "male",
    title: "Stuck in the Chicken Suit",
    titleAr: "عالق في بدلة الدجاجة",
    titleEs: "Atrapado en el disfraz de pollo",
    titleTr: "Tavuk Kostümünde Mahsur",
    desc: "The zipper jams at the worst possible moment, right when his ex walks by",
    descAr: "ينحشر السحّاب في أسوأ لحظة، وتمرّ حبيبته السابقة تماماً",
    descEs: "La cremallera se atasca en el peor momento, justo cuando pasa su ex",
    descTr: "Fermuar en kötü anda sıkışır, tam o sırada eski sevgilisi yanından geçer",
    targets: [
      { en: "sweltering", ar: "خانق الحرارة" },
      { en: "jammed", ar: "انحشر" },
      { en: "humiliated", ar: "مُهان" },
    ],
    sentences: [
      s(
        "رقص عمر أمام مطعم «كريسبي تشيكن» بزي دجاجة.",
        "Omar bailaba frente a Crispy Chicken con un disfraz de pollo",
        "Ömer, Crispy Chicken'ın önünde tavuk kostümüyle dans ediyordu",
        "Omar=عمر/Omar/Ömer | danced=رقص/bailaba/dans ediyordu | outside=أمام/frente a/önünde | Crispy=كريسبي/Crispy/Crispy | Chicken=تشيكن/Chicken/Chicken | in=بـ/con/-le | a=ال/un/bir | chicken=دجاجة/pollo/tavuk | costume=زي/disfraz/kostüm",
      ),
      s(
        "في جمعة خانقة الحرارة، انحشر السحّاب وحبسه في الداخل.",
        "Un viernes sofocante, la cremallera se atascó y lo dejó atrapado dentro",
        "Bunaltıcı bir cuma günü fermuar sıkıştı ve onu içeride hapsetti",
        "One=في/un/bir | sweltering=خانقة الحرارة/sofocante/bunaltıcı | Friday,=جمعة/viernes/cuma | the=ال/la/- | zipper=السحّاب/cremallera/fermuar | jammed,=انحشر/se atascó/sıkıştı | trapping=حابساً/atrapándolo/hapsederek | him=إياه/a él/onu | inside=داخلاً/dentro/içeride",
      ),
      s(
        "تصبّب العرق على ظهره بينما بدأ المتسوقون بتصويره.",
        "El sudor le caía por la espalda mientras los clientes empezaban a grabarlo",
        "Alışverişçiler onu çekmeye başlarken sırtından ter boşalıyordu",
        "Sweat=العرق/sudor/ter | poured=تصبّب/caía/döküldü | down=على/por/aşağı | his=ـه/su/onun | back=ظهره/espalda/sırt | as=بينما/mientras/-ken | shoppers=المتسوقون/compradores/alışverişçiler | began=بدأ/empezaron/başladı | filming=التصوير/a grabar/çekmeye",
      ),
      s(
        "ثم لمح حبيبته السابقة دينا تتمشى نحوه.",
        "Entonces vio a su exnovia, Dina, que se acercaba paseando",
        "Sonra eski sevgilisi Dina'nın ona doğru yürüdüğünü fark etti",
        "Then=ثم/entonces/sonra | he=هو/él/o | spotted=لمح/vio/fark etti | his=ـه/su/onun | ex-girlfriend,=حبيبته السابقة/exnovia/eski sevgilisi | Dina,=دينا/Dina/Dina | strolling=تتمشى/paseando/yürüyen | closer=أقرب/más cerca/yaklaşan",
      ),
      s(
        "تجمّد، ورفرف مرة، وتظاهر بأنه طائر.",
        "Se quedó helado, aleteó una vez y fingió ser un pájaro",
        "Dondu, bir kez kanat çırptı ve kuş gibi davrandı",
        "He=هو/él/o | froze,=تجمّد/se quedó helado/dondu | flapped=رفرف/aleteó/çırptı | once,=مرة/una vez/bir kez | and=و/y/ve | pretended=تظاهر/fingió/rol yaptı | to=أن/-/-mek | be=يكون/ser/olmak | a=ال/un/bir | bird=طائراً/pájaro/kuş",
      ),
      s(
        "تفحصت دينا المنقار وقالت: «عمر، أعرف هذه المشية».",
        'Dina estudió el pico y dijo: "Omar, conozco esa forma de andar"',
        'Dina gagayı inceledi ve dedi: "Ömer, o yürüyüşü tanırım"',
        'Dina=دينا/Dina/Dina | studied=تفحصت/estudió/inceledi | the=ال/el/- | beak=المنقار/pico/gaga | and=و/y/ve | said,=قالت/dijo/dedi | "Omar,=عمر/Omar/Ömer | I=أنا/yo/ben | know=أعرف/conozco/biliyorum | that=تلك/esa/o | walk"=المشية/forma de andar/yürüyüş',
      ),
      s(
        "شدّت السحّاب بصبر حتى انفتح أخيراً.",
        "Tiró de la cremallera con paciencia hasta que cedió",
        "Sonunda açılana kadar fermuarı sabırla çekti",
        "She=هي/ella/o | tugged=شدّت/tiró de/çekti | the=ال/la/- | zipper=السحّاب/cremallera/fermuar | patiently=بصبر/con paciencia/sabırla | until=حتى/hasta que/-e kadar | it=هو/se/o | gave=انفتح/cedió/açıldı | way=أخيراً/paso/yol",
      ),
      s(
        "غارقاً في العرق ومُهاناً، عرض عليها دجاجاً مجانياً مدى الحياة.",
        "Empapado y humillado, le ofreció pollo gratis de por vida",
        "Sırılsıklam ve küçük düşmüş halde ona ömür boyu bedava tavuk teklif etti",
        "Drenched=غارقاً/empapado/sırılsıklam | and=و/y/ve | humiliated,=مُهاناً/humillado/küçük düşmüş | he=هو/él/o | offered=عرض/ofreció/teklif etti | her=ـها/le/ona | free=مجاني/gratis/bedava | chicken=دجاج/pollo/tavuk | for=مدى/de por/boyunca | life=الحياة/vida/hayat",
      ),
      s(
        "«اتفقنا»، ابتسمت، «لكن ارتدِ البدلة في موعدنا الثاني».",
        '"Trato hecho", sonrió, "pero ponte el disfraz en la segunda cita"',
        '"Anlaştık", diye gülümsedi, "ama ikinci randevuda kostümü giy"',
        '"Deal,"=اتفقنا/trato hecho/anlaştık | she=هي/ella/o | smiled,=ابتسمت/sonrió/gülümsedi | "but=لكن/pero/ama | wear=ارتدِ/ponte/giy | the=ال/el/- | suit=البدلة/disfraz/kostümü | on=في/en/-de | date=الموعد/cita/randevu | two"=الثاني/dos/iki',
      ),
    ],
  },
  // ---------------------------------------------------------------- 218
  {
    id: "story-218",
    order: 220,
    narrator: "male",
    title: "The Last Haircut",
    titleAr: "آخر حلاقة",
    titleEs: "El último corte",
    titleTr: "Son Tıraş",
    desc: "After fifty years a barber closes up, and his very first customer walks in",
    descAr: "بعد خمسين عاماً يغلق حلاق محله، فيدخل عليه أول زبون عرفه",
    descEs: "Tras cincuenta años un barbero cierra, y entra su primer cliente",
    descTr: "Elli yıl sonra bir berber dükkânı kapatır ve ilk müşterisi içeri girer",
    targets: [
      { en: "shuffled", ar: "مشى متثاقلاً" },
      { en: "meticulously", ar: "بدقة متناهية" },
      { en: "crumpled", ar: "مجعّد" },
    ],
    sentences: [
      s(
        "بعد خمسين عاماً، كنس حدّاد محل الحلاقة للمرة الأخيرة.",
        "Tras cincuenta años, Haddad barrió su barbería por última vez",
        "Elli yıl sonra Haddad berber dükkânını son kez süpürdü",
        "After=بعد/tras/sonra | fifty=خمسين/cincuenta/elli | years,=عاماً/años/yıl | Haddad=حدّاد/Haddad/Haddad | swept=كنس/barrió/süpürdü | his=ـه/su/onun | barbershop=محل الحلاقة/barbería/berber dükkânı | one=مرة/una/bir | last=أخيرة/última/son | time=مرة/vez/kez",
      ),
      s(
        "كانت المرايا ملفوفة، والمذياع صامتاً، والرفوف فارغة.",
        "Los espejos estaban envueltos, la radio en silencio, los estantes vacíos",
        "Aynalar sarılmıştı, radyo susmuştu, raflar bomboştu",
        "The=ال/los/- | mirrors=المرايا/espejos/aynalar | were=كانت/estaban/-ydı | wrapped,=ملفوفة/envueltos/sarılmıştı | the=ال/la/- | radio=المذياع/radio/radyo | silent,=صامت/en silencio/sessizdi | the=ال/los/- | shelves=الرفوف/estantes/raflar | bare=فارغة/vacíos/boştu",
      ),
      s(
        "رنّ الجرس، ودخل العجوز سمير متثاقلاً ومعه عصا.",
        "Sonó la campanilla, y el viejo Samir entró arrastrando los pies con un bastón",
        "Zil çaldı ve yaşlı Samir bastonuyla ayaklarını sürüyerek içeri girdi",
        "A=ال/una/bir | bell=جرس/campana/zil | rang,=رنّ/sonó/çaldı | and=و/y/ve | old=العجوز/viejo/yaşlı | Samir=سمير/Samir/Samir | shuffled=دخل متثاقلاً/entró arrastrando los pies/ayaklarını sürüdü | in=إلى الداخل/dentro/içeri | with=ومعه/con/ile | a=ال/un/bir | cane=عصا/bastón/baston",
      ),
      s(
        "«هل تذكرني؟» سأل. «أول زبون لك».",
        '"¿Me recuerdas?", preguntó. "Tu primer cliente"',
        '"Beni hatırlıyor musun?" diye sordu. "İlk müşterin"',
        '"Remember=تذكّر/recuerdas/hatırlıyor musun | me?"=إياي/me/beni | he=هو/él/o | asked.=سأل/preguntó/diye sordu | "Your=ـك/tu/senin | first=أول/primer/ilk | customer"=زبون/cliente/müşteri',
      ),
      s(
        "توقف مقص حدّاد، وغامت عيناه بالدموع.",
        "Las tijeras de Haddad se detuvieron, y sus ojos se pusieron vidriosos",
        "Haddad'ın makası durdu ve gözleri buğulandı",
        "Haddad's=حدّاد/de Haddad/Haddad'ın | scissors=مقص/tijeras/makas | paused,=توقف/se detuvieron/durdu | and=و/y/ve | his=ـه/sus/onun | eyes=عيناه/ojos/gözleri | grew=أصبحت/se pusieron/oldu | glassy=دامعة/vidriosos/buğulu",
      ),
      s(
        "«كنت ترتجف بشدة حتى جرحت أذني».",
        '"Temblabas tanto que me cortaste la oreja"',
        '"O kadar titriyordun ki kulağımı kestin"',
        '"You=أنت/tú/sen | trembled=ارتجفت/temblabas/titredin | so=جداً/tanto/o kadar | badly,=بشدة/mal/kötü | you=أنت/tú/sen | nicked=جرحت/cortaste/kestin | my=لي/mi/benim | ear"=أذن/oreja/kulak',
      ),
      s(
        "وضع حدّاد العباءة القديمة حول كتفيه بدقة متناهية.",
        "Haddad colocó meticulosamente la vieja capa a su alrededor",
        "Haddad eski pelerini titizlikle onun omuzlarına örttü",
        "Haddad=حدّاد/Haddad/Haddad | meticulously=بدقة متناهية/meticulosamente/titizlikle | draped=وضع/colocó/örttü | the=ال/la/- | old=القديمة/vieja/eski | cape=العباءة/capa/pelerin | around=حول/alrededor de/etrafına | him=ـه/él/onun",
      ),
      s(
        "ولم يهمس سوى المقص، ناعماً وبلا عجلة.",
        "Solo susurraban las tijeras, suaves y sin prisa",
        "Yalnızca makas fısıldıyordu, yumuşak ve telaşsız",
        "Only=فقط/solo/yalnızca | the=ال/las/- | scissors=المقص/tijeras/makas | whispered,=همس/susurraban/fısıldadı | soft=ناعماً/suaves/yumuşak | and=و/y/ve | unhurried=بلا عجلة/sin prisa/telaşsız",
      ),
      s(
        "وضع سمير ورقة نقدية مجعّدة في كفّ حدّاد، بسعر عام 1974.",
        "Samir puso un billete arrugado en la palma de Haddad, el precio de 1974",
        "Samir Haddad'ın avucuna buruşuk bir banknot bastırdı, 1974'ün fiyatı",
        "Samir=سمير/Samir/Samir | pressed=وضع/puso/bastırdı | a=ال/un/bir | crumpled=مجعّدة/arrugado/buruşuk | bill=ورقة نقدية/billete/banknot | into=في/en/-e | Haddad's=حدّاد/de Haddad/Haddad'ın | palm,=كف/palma/avuç | the=ال/el/- | price=سعر/precio/fiyat | from=من/de/-den | 1974=1974/1974/1974",
      ),
    ],
  },
  // ---------------------------------------------------------------- 219
  {
    id: "story-219",
    order: 221,
    narrator: "female",
    title: "In the Margins",
    titleAr: "على الهوامش",
    titleEs: "En los márgenes",
    titleTr: "Kenar Boşluklarında",
    desc: "A reader falls for a stranger through pencil notes in secondhand books",
    descAr: "قارئة تقع في حب غريب عبر ملاحظات بالقلم الرصاص في كتب مستعملة",
    descEs: "Una lectora se enamora de un desconocido a través de notas a lápiz en libros usados",
    descTr:
      "Bir okur, ikinci el kitaplardaki kurşun kalem notları sayesinde bir yabancıya âşık olur",
    targets: [
      { en: "intrigued", ar: "مثار الفضول" },
      { en: "annotated", ar: "عليه تعليقات" },
      { en: "serendipity", ar: "الصدفة السعيدة" },
    ],
    sentences: [
      s(
        "كانت لينا تشتري روايات مستعملة من أجل ملاحظات القلم الرصاص في هوامشها.",
        "Lena compraba novelas de segunda mano por las notas a lápiz en sus márgenes",
        "Lena ikinci el romanları, kenarlarındaki kurşun kalem notları için alırdı",
        "Lena=لينا/Lena/Lena | bought=اشترت/compraba/alırdı | secondhand=مستعملة/de segunda mano/ikinci el | novels=روايات/novelas/romanlar | for=من أجل/por/için | the=ال/las/- | pencil=القلم الرصاص/lápiz/kurşun kalem | notes=ملاحظات/notas/notlar | in=في/en/-de | their=ها/sus/onların | margins=هوامش/márgenes/kenarlar",
      ),
      s(
        "بجانب سطر حزين، كتب أحدهم بخطّ سريع: «الشجاعة عادة».",
        'Junto a una línea triste, alguien había garabateado: "El valor es un hábito"',
        'Hüzünlü bir satırın yanına biri şunu karalamıştı: "Cesaret bir alışkanlıktır"',
        'Beside=بجانب/junto a/yanında | one=ال/una/bir | sad=حزين/triste/hüzünlü | line,=سطر/línea/satır | someone=أحدهم/alguien/biri | had=قد/había/-mıştı | scribbled,=خطّ/garabateado/karalamıştı | "Courage=الشجاعة/valor/cesaret | is=هي/es/-dır | a=ال/un/bir | habit"=عادة/hábito/alışkanlık',
      ),
      s(
        "بدافع الفضول، كتبت تحته: «ومن علّمك ذلك؟»",
        'Intrigada, escribió debajo: "¿Y quién te enseñó eso?"',
        'Merak ederek altına yazdı: "Bunu sana kim öğretti?"',
        'Intrigued,=مثارة الفضول/intrigada/merak etmiş | she=هي/ella/o | wrote=كتبت/escribió/yazdı | underneath,=تحته/debajo/altına | "And=و/y/ve | who=من/quién/kim | taught=علّمك/enseñó/öğretti | you=أنت/te/sana | that?"=ذلك/eso/bunu',
      ),
      s(
        "بعد أسبوع، كان الكتاب ينتظر على الرف، وعليه تعليقات جديدة.",
        "Una semana después, el libro esperaba en el estante, anotado otra vez",
        "Bir hafta sonra kitap rafta yine notlarla doluydu",
        "A=ال/una/bir | week=أسبوع/semana/hafta | later,=بعد/después/sonra | the=ال/el/- | book=الكتاب/libro/kitap | waited=ينتظر/esperaba/bekliyordu | on=على/en/-de | the=ال/el/- | shelf,=الرف/estante/raf | annotated=عليه تعليقات/anotado/not düşülmüş | again=مجدداً/otra vez/yine",
      ),
      s(
        "لأشهر، تجادلا عبر الورق بخطّ صغير ومرتّب.",
        "Durante meses, discutieron a través del papel con una letra diminuta y ordenada",
        "Aylarca minik, düzgün bir el yazısıyla kâğıt üzerinden tartıştılar",
        "For=لمدة/durante/boyunca | months,=أشهر/meses/ay | they=هما/ellos/onlar | argued=تجادلا/discutieron/tartıştılar | through=عبر/a través de/aracılığıyla | paper=الورق/papel/kâğıt | in=بـ/con/-le | tiny,=صغير/diminuta/minik | tidy=مرتّب/ordenada/düzgün | handwriting=خط اليد/letra/el yazısı",
      ),
      s(
        "أخيراً، قالت الصفحة الأخيرة: «انظري إلى الأعلى. أنا بجانب السلّم».",
        'Por fin, la última página decía: "Mira arriba. Estoy junto a la escalera"',
        'Sonunda son sayfada şöyle yazıyordu: "Yukarı bak. Merdivenin yanındayım"',
        'Finally,=أخيراً/por fin/sonunda | the=ال/la/- | last=الأخيرة/última/son | page=صفحة/página/sayfa | said,=قالت/decía/dedi | "Look=انظري/mira/bak | up.=للأعلى/arriba/yukarı | I\'m=أنا/estoy/ben | by=بجانب/junto a/yanında | the=ال/la/- | ladder"=السلّم/escalera/merdiven',
      ),
      s(
        "رفعت بصرها، فأسقط غريب محمرّ الوجه قلمه.",
        "Ella miró arriba, y un desconocido ruborizado dejó caer su lápiz",
        "O yukarı baktı ve kızaran bir yabancı kalemini düşürdü",
        "She=هي/ella/o | looked=نظرت/miró/baktı | up,=للأعلى/arriba/yukarı | and=و/y/ve | a=ال/un/bir | blushing=محمرّ الوجه/ruborizado/kızaran | stranger=غريب/desconocido/yabancı | dropped=أسقط/dejó caer/düşürdü | his=ـه/su/onun | pencil=قلمه/lápiz/kalem",
      ),
      s(
        "قررت لينا أن الصدفة السعيدة لها خط يد أنيق بشكل مفاجئ.",
        "La serendipia, decidió Lena, tiene una letra sorprendentemente pulcra",
        "Tesadüfün, diye karar verdi Lena, şaşırtıcı derecede düzgün bir el yazısı var",
        "Serendipity,=الصدفة السعيدة/la serendipia/tesadüf | Lena=لينا/Lena/Lena | decided,=قررت/decidió/karar verdi | has=لها/tiene/sahip | surprisingly=بشكل مفاجئ/sorprendentemente/şaşırtıcı biçimde | neat=أنيق/pulcra/düzgün | handwriting=خط اليد/letra/el yazısı",
      ),
    ],
  },
  // ---------------------------------------------------------------- 220
  {
    id: "story-220",
    order: 222,
    narrator: "male",
    title: "Two Tickets",
    titleAr: "تذكرتان",
    titleEs: "Dos entradas",
    titleTr: "İki Bilet",
    desc: "A widower keeps buying a second ticket, until a stranger asks about the empty seat",
    descAr: "أرمل يواصل شراء تذكرة ثانية، حتى تسأله غريبة عن المقعد الفارغ",
    descEs:
      "Un viudo sigue comprando una segunda entrada, hasta que una desconocida pregunta por el asiento vacío",
    descTr:
      "Dul bir adam ikinci bileti almaya devam eder, ta ki bir yabancı boş koltuğu sorana kadar",
    targets: [
      { en: "widower", ar: "أرمل" },
      { en: "wistfully", ar: "بحنين" },
      { en: "murmured", ar: "غمغم" },
    ],
    sentences: [
      s(
        "كل جمعة، كان الأرمل كريم يشتري تذكرتَي سينما.",
        "Cada viernes, el viudo Karim compraba dos entradas de cine",
        "Her cuma dul Kerim iki sinema bileti alırdı",
        "Every=كل/cada/her | Friday,=جمعة/viernes/cuma | the=ال/el/- | widower=الأرمل/viudo/dul | Karim=كريم/Karim/Kerim | bought=اشترى/compraba/alırdı | two=اثنتين/dos/iki | cinema=سينما/cine/sinema | tickets=تذكرتين/entradas/bilet",
      ),
      s(
        "لم تسأل هناء، الصرّافة، عن السبب قط.",
        "Hana, la cajera, nunca preguntó por qué",
        "Kasiyer Hana nedenini hiç sormadı",
        "Hana,=هناء/Hana/Hana | the=ال/la/- | cashier,=الصرّافة/cajera/kasiyer | never=لم/nunca/asla | asked=تسأل/preguntó/sordu | why=لماذا/por qué/neden",
      ),
      s(
        "بحنين، طوى وشاحه فوق المقعد الفارغ.",
        "Con nostalgia, dobló su bufanda sobre el asiento vacío",
        "Hüzünle atkısını boş koltuğun üzerine katladı",
        "Wistfully,=بحنين/con nostalgia/hüzünle | he=هو/él/o | folded=طوى/dobló/katladı | his=ـه/su/onun | scarf=وشاحه/bufanda/atkı | over=فوق/sobre/üzerine | the=ال/el/- | empty=الفارغ/vacío/boş | seat=المقعد/asiento/koltuk",
      ),
      s(
        "يوم الجمعة الماضي كان الفيلم كوميدياً كانت ستعشقه.",
        "El viernes pasado, la película era una comedia que ella habría adorado",
        "Geçen cuma film, onun bayılacağı bir komediydi",
        "Last=الماضي/pasado/geçen | Friday,=الجمعة/viernes/cuma | the=ال/la/- | film=الفيلم/película/film | was=كان/era/-di | a=ال/una/bir | comedy=كوميدياً/comedia/komedi | she=هي/ella/o | would=كانت/habría/-ırdı | have=قد/-/- | adored=تعشقه/adorado/bayılırdı",
      ),
      s(
        "ضحك على كل نكتة، ثم مسح وجنتيه.",
        "Se rió de cada chiste, luego se secó las mejillas",
        "Her fıkraya güldü, sonra yanaklarını sildi",
        "He=هو/él/o | laughed=ضحك/rió/güldü | at=على/de/-e | every=كل/cada/her | joke,=نكتة/chiste/fıkra | then=ثم/luego/sonra | wiped=مسح/secó/sildi | his=ـه/sus/onun | cheeks=وجنتيه/mejillas/yanaklar",
      ),
      s(
        "سألته امرأة متأخرة ولاهثة إن كان المقعد شاغراً.",
        "Una mujer, tarde y sin aliento, preguntó si el asiento estaba libre",
        "Geç kalmış, nefes nefese bir kadın koltuğun boş olup olmadığını sordu",
        "A=ال/una/bir | woman,=امرأة/mujer/kadın | late=متأخرة/tarde/geç | and=و/y/ve | breathless,=لاهثة/sin aliento/nefes nefese | asked=سألت/preguntó/sordu | if=إن كان/si/-ip | the=ال/el/- | seat=المقعد/asiento/koltuk | was=كان/estaba/-di | free=شاغراً/libre/boş",
      ),
      s(
        "تردد كريم، وقد انعقد حلقه، ثم رفع الوشاح.",
        "Karim dudó, con la garganta apretada, y luego levantó la bufanda",
        "Kerim tereddüt etti, boğazı düğümlenmişti, sonra atkıyı kaldırdı",
        "Karim=كريم/Karim/Kerim | hesitated,=تردد/dudó/tereddüt etti | his=ـه/su/onun | throat=حلقه/garganta/boğaz | tight,=منعقد/apretada/düğümlü | then=ثم/luego/sonra | lifted=رفع/levantó/kaldırdı | the=ال/la/- | scarf=الوشاح/bufanda/atkı",
      ),
      s(
        "«كانت ستحبك»، غمغم، «لم تكفّ عن الكلام يوماً».",
        '"Le habrías caído bien", murmuró, "ella nunca dejaba de hablar"',
        '"Seni sevmiş olurdu", diye mırıldandı, "hiç susmazdı"',
        '"She=هي/ella/o | would=كانت/habría/-ırdı | have=قد/-/- | liked=أحبّت/caído bien/severdi | you,"=أنت/te/seni | he=هو/él/o | murmured,=غمغم/murmuró/mırıldandı | "she=هي/ella/o | never=لم/nunca/asla | stopped=تكفّ/dejaba/durdu | talking"=عن الكلام/de hablar/konuşmaktan',
      ),
      s(
        "ابتسمت المرأة وهمست: «إذن سأتحدث بهدوء».",
        'La mujer sonrió y susurró: "Entonces hablaré bajito"',
        'Kadın sırıttı ve fısıldadı: "O zaman sessiz konuşurum"',
        'The=ال/la/- | woman=المرأة/mujer/kadın | grinned=ابتسمت/sonrió/sırıttı | and=و/y/ve | whispered,=همست/susurró/fısıldadı | "Then=إذن/entonces/o zaman | I\'ll=سوف/yo/ben | talk=أتحدث/hablaré/konuşurum | quietly"=بهدوء/en voz baja/sessizce',
      ),
    ],
  },
  // ---------------------------------------------------------------- 221
  {
    id: "story-221",
    order: 223,
    narrator: "female",
    title: "Paid by a Stranger",
    titleAr: "مدفوعة من غريب",
    titleEs: "Pagado por un desconocido",
    titleTr: "Bir Yabancıdan",
    desc: "A free coffee from a stranger starts a chain that nobody wants to break",
    descAr: "قهوة مجانية من غريب تبدأ سلسلة لا يريد أحد كسرها",
    descEs: "Un café gratis de un desconocido empieza una cadena que nadie quiere romper",
    descTr: "Bir yabancıdan ikram edilen kahve, kimsenin kırmak istemediği bir zincir başlatır",
    targets: [
      { en: "speechless", ar: "عاجز عن الكلام" },
      { en: "anonymous", ar: "مجهول" },
      { en: "reciprocated", ar: "ردّ الجميل" },
    ],
    sentences: [
      s(
        "طلبت روث قهوة، وعلمت أن غريباً قد دفع ثمنها.",
        "Ruth pidió un café y se enteró de que un desconocido ya lo había pagado",
        "Ruth kahve sipariş etti ve bir yabancının parasını ödediğini öğrendi",
        "Ruth=روث/Ruth/Ruth | ordered=طلبت/pidió/sipariş verdi | coffee=قهوة/café/kahve | and=و/y/ve | learned=علمت/supo/öğrendi | a=ال/un/bir | stranger=غريباً/desconocido/yabancı | had=قد/había/-mıştı | paid=دفع/pagado/ödemişti",
      ),
      s(
        "«مرّرها للتالي»، قال الباريستا وهو يهزّ كتفيه، «شخص ما فعلها من أجلك».",
        '"Págalo hacia adelante", dijo el barista encogiéndose de hombros, "alguien lo hizo por ti"',
        '"Bunu ileriye aktar", dedi barista omuz silkerek, "biri senin için yaptı"',
        '"Pay=ادفع/paga/öde | it=ها/lo/onu | forward,"=للتالي/adelante/ileriye | the=ال/el/- | barista=الباريستا/barista/barista | shrugged,=هزّ كتفيه/se encogió de hombros/omuz silkti | "someone=شخص/alguien/biri | did=فعل/hizo/yaptı | it=ذلك/eso/onu | for=من أجل/por/için | you"=أنت/ti/senin',
      ),
      s(
        "حدّقت روث في الإيصال، عاجزة عن الكلام، وعيناها تلسعان.",
        "Ruth miró el recibo, sin palabras, con los ojos escociéndole",
        "Ruth fişe baktı, dili tutulmuştu, gözleri yanıyordu",
        "Ruth=روث/Ruth/Ruth | stared=حدّقت/miró fijamente/baktı | at=إلى/a/-e | the=ال/el/- | receipt,=الإيصال/recibo/fiş | speechless,=عاجزة عن الكلام/sin palabras/dili tutulmuş | her=ـها/sus/onun | eyes=عيناها/ojos/gözleri | stinging=تلسعان/escociendo/yanıyor",
      ),
      s(
        "بالطبع، دفعت ثمن كرواسان الزبون التالي.",
        "Naturalmente, pagó el cruasán del siguiente cliente",
        "Doğal olarak, sıradaki müşterinin kruvasanını ödedi",
        "Naturally,=بالطبع/naturalmente/doğal olarak | she=هي/ella/o | paid=دفعت/pagó/ödedi | for=ثمن/por/için | the=ال/el/- | next=التالي/siguiente/sonraki | customer's=الزبون/cliente/müşterinin | croissant=كرواسان/cruasán/kruvasan",
      ),
      s(
        "عند الإغلاق، كان اثنان وأربعون غريباً قد انضمّوا إلى السلسلة.",
        "Al cierre, cuarenta y dos desconocidos se habían unido a la cadena",
        "Kapanışa kadar kırk iki yabancı zincire katılmıştı",
        "By=عند/al/-e kadar | closing,=الإغلاق/cierre/kapanış | forty-two=اثنان وأربعون/cuarenta y dos/kırk iki | strangers=غرباء/desconocidos/yabancı | had=قد/habían/-mıştı | joined=انضمّوا/unido/katılmıştı | the=ال/la/- | chain=السلسلة/cadena/zincir",
      ),
      s(
        "كان بينهم سائق سيارة أجرة متجهم وعروس هاربة.",
        "Entre ellos había un taxista gruñón y una novia fugada",
        "Aralarında huysuz bir taksi şoförü ve kaçak bir gelin vardı",
        "They=هم/ellos/onlar | included=ضمّوا/incluían/arasındaydı | a=ال/un/bir | grumpy=متجهم/gruñón/huysuz | taxi=سيارة أجرة/taxi/taksi | driver=سائق/conductor/şoför | and=و/y/ve | a=ال/una/bir | runaway=هاربة/fugada/kaçak | bride=عروس/novia/gelin",
      ),
      s(
        "في الصباح التالي، وجدت روث السلسلة ما زالت حيّة.",
        "A la mañana siguiente, Ruth encontró la cadena todavía viva",
        "Ertesi sabah Ruth zincirin hâlâ canlı olduğunu gördü",
        "The=ال/la/- | next=التالي/siguiente/ertesi | morning,=صباح/mañana/sabah | Ruth=روث/Ruth/Ruth | found=وجدت/encontró/buldu | the=ال/la/- | chain=السلسلة/cadena/zincir | still=ما زالت/todavía/hâlâ | alive=حية/viva/canlı",
      ),
      s(
        "دفع شخص مجهول مجدداً، تاركاً ملاحظة: «واصل».",
        'Alguien anónimo pagó otra vez, dejando una nota: "Sigue así"',
        'İsimsiz biri yine ödemişti ve not bırakmıştı: "Devam et"',
        'Someone=شخص/alguien/biri | anonymous=مجهول/anónimo/isimsiz | paid=دفع/pagó/ödedi | again,=مجدداً/otra vez/yine | leaving=تاركاً/dejando/bırakarak | a=ال/una/bir | note:=ملاحظة/nota/not | "Keep=واصل/sigue/devam | going"=المسير/así/et',
      ),
      s(
        "حبست روث دموعها وردّت الجميل للصف بأكمله.",
        "Ruth contuvo las lágrimas y correspondió pagando a toda la fila",
        "Ruth gözyaşlarını tuttu ve bütün sıraya karşılık verdi",
        "Ruth=روث/Ruth/Ruth | blinked=رمشت/parpadeó/göz kırptı | back=لتحبس/para contener/geri | tears=الدموع/lágrimas/gözyaşlarını | and=و/y/ve | reciprocated=ردّت الجميل/correspondió/karşılık verdi | for=لـ/por/için | the=ال/toda/- | entire=كامل/entera/bütün | line=الصف/fila/sıra",
      ),
    ],
  },
  // ---------------------------------------------------------------- 222
  {
    id: "story-222",
    order: 224,
    narrator: "male",
    title: "The Hired Girlfriend",
    titleAr: "الحبيبة المستأجرة",
    titleEs: "La novia de alquiler",
    titleTr: "Kiralık Sevgili",
    desc: "He hires an actress to stop his mother's matchmaking, but his mother has a plan too",
    descAr: "يستأجر ممثلة ليوقف تزويج أمه له، لكن لأمه خطتها أيضاً",
    descEs:
      "Contrata a una actriz para frenar a su madre casamentera, pero ella también tiene un plan",
    descTr:
      "Annesinin çöpçatanlığını durdurmak için bir oyuncu tutar, ama annesinin de bir planı vardır",
    targets: [
      { en: "matchmaking", ar: "التوفيق بين العرسان" },
      { en: "rehearsed", ar: "مُتمرَّن عليه" },
      { en: "bewildered", ar: "حائر" },
    ],
    sentences: [
      s(
        "سئم يوسف محاولات أمه في تزويجه، فاستأجر ممثلة.",
        "Harto de las casamenteras de su madre, Yusuf contrató a una actriz",
        "Annesinin çöpçatanlığından bıkan Yusuf bir oyuncu tuttu",
        "Tired=متعب/harto/bıkmış | of=من/de/-den | his=ـه/su/onun | mother's=أمه/de su madre/annesinin | matchmaking,=التزويج/casamentera/çöpçatanlık | Yusuf=يوسف/Yusuf/Yusuf | hired=استأجر/contrató/tuttu | an=ال/una/bir | actress=ممثلة/actriz/oyuncu",
      ),
      s(
        "وصلت نادية ومعها زهور وابتسامة لا تشوبها شائبة وقصة متمرَّن عليها.",
        "Nadia llegó con flores, una sonrisa impecable y una historia ensayada",
        "Nadia çiçekler, kusursuz bir gülümseme ve ezberlenmiş bir hikâyeyle geldi",
        "Nadia=نادية/Nadia/Nadia | arrived=وصلت/llegó/geldi | with=مع/con/ile | flowers,=زهور/flores/çiçek | a=ال/una/bir | flawless=لا تشوبها شائبة/impecable/kusursuz | smile,=ابتسامة/sonrisa/gülümseme | and=و/y/ve | a=ال/una/bir | rehearsed=مُتمرَّنة/ensayada/ezberlenmiş | story=قصة/historia/hikâye",
      ),
      s(
        "عانقتها أمه وقالت: «أهلاً بعودتك يا حبيبتي».",
        'Su madre la abrazó y dijo: "Bienvenida de nuevo, cariño"',
        'Annesi ona sarıldı ve dedi: "Tekrar hoş geldin, canım"',
        'His=ـه/su/onun | mother=أمه/madre/annesi | hugged=عانقت/abrazó/sarıldı | her=ـها/la/ona | and=و/y/ve | said,=قالت/dijo/dedi | "Welcome=أهلاً/bienvenida/hoş | back,=بعودتك/de nuevo/geldin | darling"=حبيبتي/cariño/canım',
      ),
      s(
        "رمش يوسف حائراً بينما تبادلت المرأتان غمزة.",
        "Yusuf parpadeó, desconcertado, mientras las dos mujeres intercambiaban un guiño",
        "İki kadın göz kırpıp anlaşırken Yusuf şaşkınlıkla gözlerini kırptı",
        "Yusuf=يوسف/Yusuf/Yusuf | blinked,=رمش/parpadeó/göz kırptı | bewildered,=حائراً/desconcertado/şaşkın | as=بينما/mientras/-ken | the=ال/las/- | women=المرأتان/mujeres/kadınlar | exchanged=تبادلتا/intercambiaron/değiş tokuş etti | a=ال/un/bir | wink=غمزة/guiño/göz kırpma",
      ),
      s(
        "«استأجرتها الشهر الماضي لتكون جارتك»، شرحت ماما.",
        '"La contraté el mes pasado para que fuera tu vecina", explicó mamá',
        '"Onu geçen ay komşun olarak tuttum", diye açıkladı annem',
        '"I=أنا/yo/ben | hired=استأجرتها/contraté/tuttum | her=ـها/a ella/onu | last=الماضي/pasado/geçen | month=الشهر/mes/ay | as=بصفة/como/olarak | your=ـك/tu/senin | neighbor,"=جارة/vecina/komşu | Mama=ماما/mamá/Anne | explained=شرحت/explicó/açıkladı',
      ),
      s(
        "«دفعتِ لها لتغازلني؟» تلعثم.",
        '"¿Le pagaste para que coqueteara conmigo?", balbuceó',
        '"Benimle flört etsin diye mi para verdin?" diye kekeledi',
        '"You=أنتِ/tú/sen | paid=دفعتِ/pagaste/ödedin | her=ـها/le/ona | to=كي/para/-mek için | flirt=تغازلني/coquetear/flört etmek | with=مع/con/ile | me?"=أنا/conmigo/benimle | he=هو/él/o | sputtered=تلعثم/balbuceó/kekeledi',
      ),
      s(
        "«أمك تدفع أكثر»، هزّت نادية كتفيها، «لكنك تضحك على نكاتي».",
        '"Tu madre paga mejor", se encogió de hombros Nadia, "pero tú te ríes de mis chistes"',
        '"Annen daha iyi ödüyor", dedi Nadia omuz silkerek, "ama sen fıkralarıma gülüyorsun"',
        '"Your=ـك/tu/senin | mother=أم/madre/annen | pays=تدفع/paga/ödüyor | better,"=أكثر/mejor/daha iyi | Nadia=نادية/Nadia/Nadia | shrugged,=هزّت كتفيها/se encogió de hombros/omuz silkti | "but=لكن/pero/ama | you=أنت/tú/sen | laugh=تضحك/te ríes/gülüyorsun | at=على/de/-e | my=لي/mis/benim | jokes"=نكاتي/chistes/fıkralarıma',
      ),
      s(
        "سكبت ماما الشاي وأعلنت أن التمثيل قد انتهى.",
        "Mamá sirvió el té y declaró terminado el fingimiento",
        "Anne çayı doldurdu ve rol yapmanın bittiğini ilan etti",
        "Mama=ماما/mamá/Anne | poured=سكبت/sirvió/doldurdu | the=ال/el/- | tea=الشاي/té/çay | and=و/y/ve | declared=أعلنت/declaró/ilan etti | the=ال/el/- | pretending=التمثيل/fingimiento/rol yapma | over=انتهى/terminado/bitti",
      ),
      s(
        "أثناء الحلوى، نسي أن يتظاهر، ونسيت أن ترحل.",
        "Durante el postre, él olvidó fingir, y ella olvidó irse",
        "Tatlı sırasında o rol yapmayı unuttu, o da gitmeyi unuttu",
        "Over=أثناء/durante/sırasında | dessert,=الحلوى/el postre/tatlı | he=هو/él/o | forgot=نسي/olvidó/unuttu | to=أن/-/-mayı | pretend,=يتظاهر/fingir/rol yapmayı | and=و/y/ve | she=هي/ella/o | forgot=نسيت/olvidó/unuttu | to=أن/-/-mayı | leave=ترحل/irse/gitmeyi",
      ),
    ],
  },
  // ---------------------------------------------------------------- 223
  {
    id: "story-223",
    order: 225,
    narrator: "female",
    title: "The Time Capsule",
    titleAr: "كبسولة الزمن",
    titleEs: "La cápsula del tiempo",
    titleTr: "Zaman Kapsülü",
    desc: "Two friends who drifted apart dig up the jar they buried as children",
    descAr: "صديقتان تباعدتا تنبشان الجرّة التي دفنتاها وهما صغيرتان",
    descEs: "Dos amigas que se distanciaron desentierran el frasco que enterraron de niñas",
    descTr: "Birbirinden uzaklaşan iki arkadaş, çocukken gömdükleri kavanozu çıkarır",
    targets: [
      { en: "oath", ar: "قسم" },
      { en: "estranged", ar: "متباعد" },
      { en: "demolish", ar: "يهدم" },
    ],
    sentences: [
      s(
        "في العاشرة، دفنت سناء وميرا جرّة تحت شجرة تين.",
        "A los diez años, Sana y Mira enterraron un frasco bajo una higuera",
        "On yaşında Sana ile Mira, bir incir ağacının altına bir kavanoz gömdüler",
        "At=في/a/-de | ten,=العاشرة/diez/on | Sana=سناء/Sana/Sana | and=و/y/ve | Mira=ميرا/Mira/Mira | buried=دفنتا/enterraron/gömdüler | a=ال/un/bir | jar=جرّة/frasco/kavanoz | under=تحت/bajo/altına | a=ال/una/bir | fig=تين/higuera/incir | tree=شجرة/árbol/ağaç",
      ),
      s(
        "وختمتا بداخلها سواراً وقسَماً جليلاً.",
        "Dentro sellaron una pulsera y un juramento solemne",
        "İçine bir bilezik ve ciddi bir yemin mühürlediler",
        "Inside,=بداخلها/dentro/içine | they=هما/ellas/onlar | sealed=ختمتا/sellaron/mühürlediler | a=ال/una/bir | bracelet=سواراً/pulsera/bilezik | and=و/y/ve | a=ال/un/bir | solemn=جليلاً/solemne/ciddi | oath=قسماً/juramento/yemin",
      ),
      s(
        "في الثلاثين، كانتا متباعدتين، يفصل بينهما صمت ست سنوات.",
        "A los treinta, estaban distanciadas, separadas por seis años de silencio",
        "Otuz yaşında küstüler, altı yıllık bir sessizlikle ayrılmışlardı",
        "At=في/a/-de | thirty,=الثلاثين/treinta/otuz | they=هما/ellas/onlar | were=كانتا/estaban/-ydı | estranged,=متباعدتين/distanciadas/küsmüş | divided=مفصولتين/separadas/ayrılmış | by=بـ/por/-le | six=ست/seis/altı | years=سنوات/años/yıl | of=من/de/- | silence=الصمت/silencio/sessizlik",
      ),
      s(
        "حين خططت المدينة لهدم الحديقة، استدعتهما رسالة.",
        "Cuando la ciudad planeó demoler el jardín, una carta las convocó",
        "Şehir bahçeyi yıkmayı planlayınca bir mektup onları çağırdı",
        "When=عندما/cuando/-ince | the=ال/la/- | city=المدينة/ciudad/şehir | planned=خططت/planeó/planladı | to=أن/-/-mek | demolish=تهدم/demoler/yıkmayı | the=ال/el/- | garden,=الحديقة/jardín/bahçe | a=ال/una/bir | letter=رسالة/carta/mektup | summoned=استدعت/convocó/çağırdı | them=هما/las/onları",
      ),
      s(
        "وصلتا بتصلب وبدأتا الحفر.",
        "Llegaron con rigidez y empezaron a cavar",
        "Gergin bir şekilde geldiler ve kazmaya başladılar",
        "They=هما/ellas/onlar | arrived=وصلتا/llegaron/geldiler | stiffly=بتصلب/con rigidez/gergin | and=و/y/ve | began=بدأتا/empezaron/başladılar | to=أن/a/-meye | dig=تحفرا/cavar/kazmaya",
      ),
      s(
        "كانت الجرّة صدئة، لكن السوار ما زال يلمع.",
        "El frasco estaba oxidado, pero la pulsera aún brillaba",
        "Kavanoz paslıydı ama bilezik hâlâ parlıyordu",
        "The=ال/el/- | jar=الجرّة/frasco/kavanoz | was=كانت/estaba/-ydı | rusted,=صدئة/oxidado/paslı | but=لكن/pero/ama | the=ال/la/- | bracelet=السوار/pulsera/bilezik | still=ما زال/todavía/hâlâ | glittered=يلمع/brillaba/parlıyordu",
      ),
      s(
        "وتحته ورقة: «لن نصبح أبداً راشدتين مملّتين».",
        'Debajo había una nota: "Nunca seremos adultas aburridas"',
        'Altında bir not vardı: "Asla sıkıcı yetişkinler olmayacağız"',
        'Beneath=تحت/debajo/altında | it=ه/de él/onun | lay=كانت/había/yatıyordu | a=ال/una/bir | note:=ورقة/nota/not | "We=نحن/nosotras/biz | will=سوف/-/-ecek | never=أبداً/nunca/asla | become=نصبح/seremos/olacağız | boring=مملين/aburridas/sıkıcı | adults"=راشدين/adultas/yetişkinler',
      ),
      s(
        "ألقت ميرا نظرة على حقيبة عملها، ثم على معطف سناء الغالي.",
        "Mira miró su maletín, luego el caro abrigo de Sana",
        "Mira evrak çantasına, sonra Sana'nın pahalı paltosuna baktı",
        "Mira=ميرا/Mira/Mira | glanced=ألقت نظرة/miró/baktı | at=على/a/-e | her=ها/su/onun | briefcase,=حقيبة العمل/maletín/evrak çantası | then=ثم/luego/sonra | at=على/a/-e | Sana's=سناء/de Sana/Sana'nın | expensive=الغالي/caro/pahalı | coat=معطف/abrigo/palto",
      ),
      s(
        "ملطختين بالطين حتى المرفقين، جلستا وتحدثتا حتى حلّ الظلام.",
        "Embarradas hasta los codos, se sentaron y hablaron hasta que oscureció",
        "Dirseklerine kadar çamura bulanmış halde oturup karanlık çökene kadar konuştular",
        "Muddy=ملطختان بالطين/embarradas/çamurlu | to=حتى/hasta/-e kadar | the=ال/los/- | elbows,=المرفقين/codos/dirsek | they=هما/ellas/onlar | sat=جلستا/se sentaron/oturdular | and=و/y/ve | talked=تحدثتا/hablaron/konuştular | until=حتى/hasta/-e kadar | dark=الظلام/oscurecer/karanlık",
      ),
    ],
  },
];
