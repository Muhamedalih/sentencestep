/**
 * Arabic/Spanish/Turkish translations for the Novels catalog's
 * descriptions, section titles, and sentences — content_translations rows,
 * same shape saveBookSection already writes for regular Books (content_type
 * 'book'/'book_section'/'book_sentence', status 'approved'). Written and
 * reviewed directly (not machine-translated), matching each novel's English
 * text in insert-novels.ts 1:1 by section/sentence index.
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-novel-translations.ts
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Lang {
  ar: string;
  es: string;
  tr: string;
}

interface SectionTranslation {
  title: Lang;
  sentences: Lang[];
}

interface NovelTranslation {
  id: string;
  description: Lang;
  sections: SectionTranslation[];
}

export const TRANSLATIONS: NovelTranslation[] = [
  {
    id: "book-novel-pride-prejudice",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة جاين أوستن عن الكبرياء والانطباعات الأولى، وقلبي إليزابيث بينيت والسيد دارسي اللذين يتغيران ببطء — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Jane Austen sobre el orgullo, las primeras impresiones y los corazones de Elizabeth Bennet y el señor Darcy que cambian lentamente — un relato personal, no el texto original.",
      tr: "Jane Austen'ın gurur, ilk izlenimler ve Elizabeth Bennet ile Bay Darcy'nin yavaşça değişen kalpleri hakkındaki hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: { ar: "عائلة بينيت", es: "La familia Bennet", tr: "Bennet Ailesi" },
        sentences: [
          {
            ar: "كانت السيدة بينيت في غاية السعادة عندما استأجر شاب ثري ضيعة نذرفيلد القريبة",
            es: "La señora Bennet estaba encantada cuando un joven caballero rico alquiló la cercana propiedad de Netherfield",
            tr: "Bayan Bennet, zengin genç bir beyefendi yakındaki Netherfield malikanesini kiraladığında çok sevindi",
          },
          {
            ar: "كان لعائلة بينيت خمس بنات ولا يوجد ابن يرث منزلهم",
            es: "La familia Bennet tenía cinco hijas y ningún hijo varón que heredara su hogar",
            tr: "Bennet ailesinin beş kızı vardı ve evlerini miras alacak bir oğulları yoktu",
          },
          {
            ar: "كان منزلهم الريفي المريح يقع بهدوء بين الحقول الخضراء على مقربة من بلدة ميريتون الصغيرة",
            es: "Su cómoda casa de campo se hallaba tranquila entre campos verdes no lejos del pequeño pueblo de Meryton",
            tr: "Rahat kır evleri, küçük Meryton kasabasına çok uzak olmayan yeşil tarlaların arasında sessizce duruyordu",
          },
          {
            ar: "كانت إليزابيث الابنة الثانية المعروفة بذكائها السريع وعقلها المستقل",
            es: "Elizabeth era la segunda hija, conocida por su ingenio rápido y su mente independiente",
            tr: "Elizabeth, keskin zekası ve bağımsız aklıyla tanınan ikinci kızdı",
          },
          {
            ar: "أما جين الكبرى فكانت لطيفة وطيبة القلب وترى الجانب الحسن في كل من تقابله تقريبًا",
            es: "Jane, la mayor, era dulce y amable, y veía lo mejor en casi todas las personas que conocía",
            tr: "En büyükleri olan Jane nazik ve kibardı, tanıştığı hemen herkeste en iyiyi görürdü",
          },
          {
            ar: "أما الأختان الصغريان كيتي وليديا فكانتا مهتمتين غالبًا بالضباط وحفلات الرقص والأشرطة الجديدة",
            es: "Las hermanas menores, Kitty y Lydia, solo se preocupaban por los oficiales, los bailes y las cintas nuevas",
            tr: "En küçük kız kardeşler Kitty ve Lydia daha çok subaylar, danslar ve yeni kurdelelerle ilgileniyordu",
          },
          {
            ar: "كان هدف السيدة بينيت الوحيد في الحياة أن ترى بناتها الخمس جميعًا وقد تزوجن زواجًا موفقًا",
            es: "El único objetivo en la vida de la señora Bennet era ver a sus cinco hijas bien casadas",
            tr: "Bayan Bennet'ın hayattaki tek amacı beş kızının da iyi biriyle evlenmesini görmekti",
          },
          {
            ar: "وجد السيد بينيت أن سعي زوجته الدائم للتزويج مزعج ومسلٍّ بهدوء في آنٍ واحد",
            es: "El señor Bennet encontraba los constantes intentos de emparejamiento de su esposa a la vez cansados y discretamente divertidos",
            tr: "Bay Bennet, karısının durmadan çöpçülük yapmasını hem yorucu hem de sessizce eğlenceli buluyordu",
          },
        ],
      },
      {
        title: {
          ar: "حفلة في نذرفيلد",
          es: "Un baile en Netherfield",
          tr: "Netherfield'da Bir Balo",
        },
        sentences: [
          {
            ar: "في حفلة محلية أثبت السيد بنغلي أنه مرح وودود ومحبوب فورًا من الجميع",
            es: "En un baile local, el señor Bingley demostró ser alegre, amable e inmediatamente popular entre todos",
            tr: "Yerel bir baloda Bay Bingley neşeli ve arkadaş canlısı olduğunu kanıtladı ve anında herkesin gözdesi oldu",
          },
          {
            ar: "غصت قاعة الاجتماع المضاءة بالشموع بالموسيقى والضحك والثرثرة الحذرة المتفحصة",
            es: "El salón iluminado con velas bullía de música, risas y chismes cautelosos y atentos",
            tr: "Mumla aydınlatılan salon müzik, kahkaha ve dikkatli, gözlemci dedikodularla uğulduyordu",
          },
          {
            ar: "بدا صديقه السيد دارسي متكبرًا وبعيدًا وغير راغب في الرقص مع الغرباء",
            es: "Su amigo el señor Darcy parecía orgulloso, distante y poco dispuesto a bailar con desconocidos",
            tr: "Arkadaşı Bay Darcy gururlu, mesafeli ve yabancılarla dans etmeye isteksiz görünüyordu",
          },
          {
            ar: "سمعت إليزابيث دارسي يصفها بأنها مقبولة فقط وليست جميلة بما يكفي لإغرائه",
            es: "Elizabeth escuchó por casualidad a Darcy llamarla apenas tolerable y no lo bastante hermosa para tentarlo",
            tr: "Elizabeth, Darcy'nin onu sadece idare eder ve kendisini cezbedecek kadar güzel olmadığını söylediğini duydu",
          },
          {
            ar: "جرحت الإهانة كبرياءها رغم أنها حولتها لاحقًا إلى نكتة خاصة",
            es: "El insulto hirió su orgullo, aunque más tarde lo convirtió en una broma privada",
            tr: "Hakaret gururunu incitti, ancak daha sonra bunu kendi aralarında bir şakaya dönüştürdü",
          },
          {
            ar: "أعادت رواية القصة لصديقاتها بروح فكاهية لاذعة أخفت جرحها الحقيقي",
            es: "Contó la historia a sus amigas con un humor agudo y juguetón que ocultaba su verdadero dolor",
            tr: "Hikayeyi arkadaşlarına, gerçek incinmişliğini gizleyen keskin ve şakacı bir mizahla anlattı",
          },
          {
            ar: "رقص بنغلي مرتين مع جين وبدأ الحي بأكمله يلاحظ ذلك",
            es: "Bingley bailó dos veces con Jane y todo el vecindario empezó a notarlo",
            tr: "Bingley, Jane ile iki kez dans etti ve tüm çevre bunu fark etmeye başladı",
          },
          {
            ar: "كانت السيدة بينيت تتخيل بالفعل حفل زفاف وبالكاد استطاعت كبح حماسها",
            es: "La señora Bennet ya se imaginaba una boda y apenas podía contener su entusiasmo",
            tr: "Bayan Bennet zihninde şimdiden bir düğün canlandırıyordu ve heyecanını zar zor gizleyebiliyordu",
          },
        ],
      },
      {
        title: { ar: "جين وبنغلي", es: "Jane y Bingley", tr: "Jane ve Bingley" },
        sentences: [
          {
            ar: "نما التعلق المتبادل بين جين وبنغلي بسرعة خلال الأسابيع التالية",
            es: "El cariño mutuo entre Jane y Bingley creció rápidamente en las semanas siguientes",
            tr: "Jane ve Bingley arasındaki karşılıklı sevgi, sonraki haftalarda hızla büyüdü",
          },
          {
            ar: "تبادلا نظرات خجولة وحديثًا لطيفًا في كل تجمع تلاه",
            es: "Intercambiaban miradas tímidas y conversaciones amables en cada reunión posterior",
            tr: "Sonraki her toplantıda utangaç bakışlar ve nazik sohbetler paylaştılar",
          },
          {
            ar: "مرضت جين مرضًا شديدًا أثناء زيارتها لأخوات بنغلي واضطرت للبقاء في نذرفيلد",
            es: "Jane enfermó gravemente mientras visitaba a las hermanas de Bingley y tuvo que quedarse en Netherfield",
            tr: "Jane, Bingley'nin kız kardeşlerini ziyaret ederken ciddi şekilde hastalandı ve Netherfield'da kalmak zorunda kaldı",
          },
          {
            ar: "مشت إليزابيث ثلاثة أميال عبر الوحل لتعتني بأختها حتى تشفى",
            es: "Elizabeth caminó tres millas por el barro para cuidar a su hermana hasta que se recuperara",
            tr: "Elizabeth, kız kardeşinin iyileşmesine yardım etmek için çamurun içinde üç mil yürüdü",
          },
          {
            ar: "أثار طرف ثوبها الموحل وشعرها المنفوش صدمة أخوات بنغلي الأنيقتين الحادتي الحكم",
            es: "El dobladillo embarrado y el cabello despeinado por el viento escandalizaron a las elegantes y críticas hermanas de Bingley",
            tr: "Çamurlu eteği ve rüzgardan dağılmış saçları, Bingley'nin zarif ve yargılayıcı kız kardeşlerini şok etti",
          },
          {
            ar: "وجد دارسي نفسه منجذبًا بشكل غير متوقع لذكاء إليزابيث وحديثها المفعم بالحيوية",
            es: "Darcy se encontró inesperadamente atraído por la inteligencia y la animada conversación de Elizabeth",
            tr: "Darcy, kendini beklenmedik bir şekilde Elizabeth'in zekasına ve canlı sohbetine kapılmış buldu",
          },
          {
            ar: "أعجب بالدفء في عينيها حتى وهو يقنع نفسه بأنه لا ينبغي له ذلك",
            es: "Admiraba la calidez de sus ojos incluso mientras se decía que no debía hacerlo",
            tr: "Kendine bunu yapmaması gerektiğini söylerken bile gözlerindeki sıcaklığa hayran kalıyordu",
          },
          {
            ar: "قاوم هذا الانجذاب معتقدًا أن روابط عائلتها أدنى منه بكثير",
            es: "Luchó contra la atracción, convencido de que las conexiones familiares de ella estaban muy por debajo de las suyas",
            tr: "Ailesinin bağlantılarının kendisinden çok daha aşağıda olduğuna inanarak bu çekime karşı direndi",
          },
        ],
      },
      {
        title: {
          ar: "السيد كولينز يتقدم للخطبة",
          es: "El señor Collins se declara",
          tr: "Bay Collins Evlenme Teklif Ediyor",
        },
        sentences: [
          {
            ar: "وصل السيد كولينز، رجل الدين المتباهي، وهو ينوي الزواج من إحدى أخوات بينيت",
            es: "El señor Collins, un clérigo pomposo, llegó con la intención de casarse con una de las hermanas Bennet",
            tr: "Kendini beğenmiş bir din adamı olan Bay Collins, Bennet kız kardeşlerinden biriyle evlenmeyi planlayarak geldi",
          },
          {
            ar: "كان يتحدث باستمرار وبفخر عن راعيته الثرية الليدي كاثرين دي بورغ",
            es: "Hablaba constante y orgullosamente de su rica benefactora, Lady Catherine de Bourgh",
            tr: "Zengin hamisi Leydi Catherine de Bourgh hakkında sürekli ve gururla konuşuyordu",
          },
          {
            ar: "تقدم لإليزابيث سارداً أسبابًا عملية بدلًا من أي مودة حقيقية",
            es: "Le propuso matrimonio a Elizabeth enumerando razones prácticas en lugar de un cariño real",
            tr: "Elizabeth'e gerçek bir sevgi yerine pratik nedenler sıralayarak evlenme teklif etti",
          },
          {
            ar: "رفضته إليزابيث بحزم رغم رعب أمها من فوات زواج آمن",
            es: "Elizabeth lo rechazó con firmeza a pesar del horror de su madre por perder un matrimonio seguro",
            tr: "Annesinin güvenli bir evliliği kaybetmekten duyduğu dehşete rağmen Elizabeth onu kesinlikle reddetti",
          },
          {
            ar: "توسلت السيدة بينيت ووبختها لكن إليزابيث لم تغير رأيها",
            es: "La señora Bennet suplicó y regañó, pero Elizabeth no cambió de opinión",
            tr: "Bayan Bennet yalvardı ve azarladı ama Elizabeth fikrini değiştirmedi",
          },
          {
            ar: "قبلت صديقة إليزابيث المقربة شارلوت لوكاس بالسيد كولينز بدلًا منها طلبًا للأمان المادي",
            es: "La íntima amiga de Elizabeth, Charlotte Lucas, aceptó al señor Collins en su lugar, por seguridad económica",
            tr: "Elizabeth'in yakın arkadaşı Charlotte Lucas, mali güvence için onun yerine Bay Collins'i kabul etti",
          },
          {
            ar: "اعترفت شارلوت بصراحة أنها لا تريد سوى منزل مستقر ومريح لا رومانسية",
            es: "Charlotte admitió sin rodeos que solo quería un hogar estable y cómodo, no romance",
            tr: "Charlotte, sadece rahat ve düzenli bir yuva istediğini, aşk istemediğini açıkça kabul etti",
          },
          {
            ar: "شعرت إليزابيث بخيبة أمل خاصة لأن صديقتها ستتزوج دون أي حب حقيقي",
            es: "Elizabeth se sintió íntimamente decepcionada de que su amiga se casara sin ningún amor verdadero",
            tr: "Elizabeth, arkadaşının gerçek bir aşk olmadan evleneceği için içten içe hayal kırıklığına uğradı",
          },
        ],
      },
      {
        title: {
          ar: "مشاعر دارسي الخفية",
          es: "Los sentimientos ocultos de Darcy",
          tr: "Darcy'nin Gizli Duyguları",
        },
        sentences: [
          {
            ar: "التقت إليزابيث بالضابط الساحر ويكهام الذي روى لها قصة مسيئة عن دارسي",
            es: "Elizabeth conoció al encantador oficial Wickham, quien le contó una historia perjudicial sobre Darcy",
            tr: "Elizabeth, kendisine Darcy hakkında zarar verici bir hikaye anlatan çekici subay Wickham ile tanıştı",
          },
          {
            ar: "تحدث بهدوء وإقناع جاعلًا نفسه يبدو وكأنه الطرف المظلوم",
            es: "Hablaba con suavidad y persuasión, haciéndose pasar por la parte agraviada",
            tr: "Kendini mağdur taraf gibi göstererek yumuşak ve ikna edici bir şekilde konuştu",
          },
          {
            ar: "ادعى ويكهام أن دارسي حرمه بالخداع من ميراث وُعد به",
            es: "Wickham afirmó que Darcy lo había estafado en una herencia que le habían prometido",
            tr: "Wickham, Darcy'nin kendisine vaat edilen bir mirası elinden hile ile aldığını iddia etti",
          },
          {
            ar: "صدقت إليزابيث القصة تمامًا وازداد نفورها من دارسي أكثر",
            es: "Elizabeth creyó la historia por completo y su antipatía hacia Darcy se hizo aún más fuerte",
            tr: "Elizabeth hikayeye tamamen inandı ve Darcy'den hoşlanmaması daha da güçlendi",
          },
          {
            ar: "بدأت تكرر شكاواه لصديقاتها دون أن تتوقف للتشكيك فيها",
            es: "Comenzó a repetir sus quejas a sus amigas sin detenerse a cuestionarlas",
            tr: "Onun şikayetlerini sorgulamak için durmadan arkadaşlarına tekrarlamaya başladı",
          },
          {
            ar: "في الوقت نفسه، أعجب دارسي بإليزابيث أكثر مع كل حديث رغم مقاومته لذلك",
            es: "Mientras tanto, Darcy admiraba más a Elizabeth con cada conversación, a pesar de su propia resistencia",
            tr: "Bu arada Darcy, kendi direncine rağmen her konuşmada Elizabeth'e daha çok hayran kalıyordu",
          },
          {
            ar: "كان يراقبها عبر الغرف المزدحمة رغم أنه نادرًا ما سمح لنفسه بالاقتراب منها",
            es: "La observaba a través de las salas abarrotadas, aunque rara vez se permitía acercarse a ella",
            tr: "Kalabalık salonların içinden onu izliyordu, ama kendine ona yaklaşma izni nadiren veriyordu",
          },
          {
            ar: "حاول إقناع نفسه بأن علاقات عائلتها المتدنية تجعل أي ارتباط مستحيلًا",
            es: "Intentó convencerse de que sus escasas conexiones familiares hacían imposible una unión",
            tr: "Kendini, onun düşük statüdeki bağlantılarının bir birlikteliği imkansız kıldığına ikna etmeye çalıştı",
          },
        ],
      },
      {
        title: { ar: "الخطبة الأولى", es: "La primera propuesta", tr: "İlk Evlilik Teklifi" },
        sentences: [
          {
            ar: "أثناء زيارتها لشارلوت، فوجئت إليزابيث عندما تقدم لها دارسي فجأة للزواج",
            es: "Mientras visitaba a Charlotte, Elizabeth se sobresaltó cuando Darcy le propuso matrimonio de repente",
            tr: "Charlotte'u ziyaret ederken Darcy'nin aniden kendisine evlenme teklif etmesiyle Elizabeth şaşırdı",
          },
          {
            ar: "راح يتمشى في الصالة الصغيرة بتوتر قبل أن يبوح أخيرًا بمشاعره بصوت مسموع",
            es: "Caminaba nervioso por el pequeño salón antes de finalmente expresar sus sentimientos en voz alta",
            tr: "Duygularını sonunda yüksek sesle dile getirmeden önce küçük salonda gergin bir şekilde volta attı",
          },
          {
            ar: "كانت خطبته مفعمة بالكبرياء إذ ذكر عائلتها الأدنى منزلة كعقبة تغلب عليها",
            es: "Su propuesta estaba llena de orgullo, pues mencionó a su familia inferior como un obstáculo que había superado",
            tr: "Teklifi gururla doluydu; onun aşağı statüdeki ailesini üstesinden geldiği bir engel olarak andı",
          },
          {
            ar: "رفضته إليزابيث بغضب متهمة إياه بتدمير سعادة جين وإساءة معاملة ويكهام",
            es: "Elizabeth lo rechazó con enojo, acusándolo de arruinar la felicidad de Jane y de maltratar a Wickham",
            tr: "Elizabeth öfkeyle onu reddetti, Jane'in mutluluğunu mahvetmek ve Wickham'a kötü davranmakla suçladı",
          },
          {
            ar: "ارتجف صوتها من الغضب رغم أنها وقفت منتصبة تمامًا وبلا خوف",
            es: "Su voz temblaba de ira, aunque ella permanecía perfectamente erguida y sin miedo",
            tr: "Sesi öfkeyle titredi, ama dimdik ve korkusuzca ayakta duruyordu",
          },
          {
            ar: "غادر دارسي مهزوزًا من اتهامات لم يتوقع أبدًا أن يسمعها عن نفسه",
            es: "Darcy se marchó conmocionado por acusaciones que nunca esperó escuchar sobre sí mismo",
            tr: "Darcy, kendisi hakkında hiç duymayı beklemediği suçlamalarla sarsılmış bir halde ayrıldı",
          },
          {
            ar: "هطل المطر في الخارج بينما ابتعد ببطء نحو المساء المعتم",
            es: "Afuera llovía mientras él se alejaba lentamente hacia el anochecer",
            tr: "Dışarıda yağmur yağarken o, kararan akşama doğru yavaşça uzaklaştı",
          },
          {
            ar: "لم يخفت غضب إليزابيث حتى بعد أن ابتعد في صمت",
            es: "La ira de Elizabeth no se desvaneció incluso después de que él se marchara en silencio",
            tr: "O sessizce uzaklaştıktan sonra bile Elizabeth'in öfkesi dinmedi",
          },
        ],
      },
      {
        title: { ar: "الرسالة", es: "La carta", tr: "Mektup" },
        sentences: [
          {
            ar: "في صباح اليوم التالي سلّم دارسي رسالة طويلة يشرح فيها موقفه من كلا الاتهامين",
            es: "A la mañana siguiente, Darcy entregó una larga carta explicando su versión de ambas acusaciones",
            tr: "Ertesi sabah Darcy, her iki suçlamaya karşı kendi tarafını açıklayan uzun bir mektup teslim etti",
          },
          {
            ar: "ارتجفت يدا إليزابيث قليلًا وهي تكسر الختم وتبدأ بالقراءة",
            es: "Las manos de Elizabeth temblaron ligeramente al romper el sello y comenzar a leer",
            tr: "Elizabeth'in elleri mührü kırıp okumaya başlarken hafifçe titredi",
          },
          {
            ar: "لقد فرّق بين بنغلي وجين فقط لأنه شكّ في صدق مشاعرها",
            es: "Había separado a Bingley de Jane solo porque dudaba de que sus sentimientos fueran sinceros",
            tr: "Bingley'yi Jane'den yalnızca onun duygularının samimi olduğundan şüphe ettiği için ayırmıştı",
          },
          {
            ar: "أوضح أن ويكهام حاول في الحقيقة الهروب مع أخت دارسي الصغيرة",
            es: "Explicó que Wickham en realidad había intentado fugarse con la propia hermana menor de Darcy",
            tr: "Wickham'ın aslında Darcy'nin küçük kız kardeşiyle kaçmaya çalıştığını açıkladı",
          },
          {
            ar: "أعادت إليزابيث قراءة الرسالة مرات عديدة وأدركت تدريجيًا أن حكمها كان خاطئًا",
            es: "Elizabeth releyó la carta muchas veces y poco a poco se dio cuenta de que su juicio había sido erróneo",
            tr: "Elizabeth mektubu defalarca yeniden okudu ve yargısının yanlış olduğunu yavaş yavaş fark etti",
          },
          {
            ar: "جلست وحيدة على درب هادئ تستعيد كل حديث دار بينها وبينه",
            es: "Se sentó sola en un sendero tranquilo, reviviendo cada conversación que había tenido con él",
            tr: "Onunla yaptığı her konuşmayı yeniden gözden geçirerek sessiz bir patikada tek başına oturdu",
          },
          {
            ar: "شعرت بخجل عميق لثقتها بسحر ويكهام بدلًا من نزاهة دارسي",
            es: "Sintió una profunda vergüenza por haber confiado en el encanto de Wickham antes que en el carácter honesto de Darcy",
            tr: "Darcy'nin dürüst karakteri yerine Wickham'ın çekiciliğine güvendiği için derin bir utanç duydu",
          },
          {
            ar: "لأول مرة تساءلت عن مدى إضلال كبريائها لها",
            es: "Por primera vez se preguntó cuánto la había engañado su propio orgullo",
            tr: "İlk kez, kendi gururunun onu ne kadar yanılttığını merak etti",
          },
        ],
      },
      {
        title: { ar: "بيمبرلي", es: "Pemberley", tr: "Pemberley" },
        sentences: [
          {
            ar: "بعد أشهر، جالت إليزابيث في ديربيشير وزارت ضيعة دارسي الكبيرة المسماة بيمبرلي",
            es: "Meses después, Elizabeth recorrió Derbyshire y visitó la gran propiedad de Darcy llamada Pemberley",
            tr: "Aylar sonra Elizabeth, Derbyshire'ı gezdi ve Darcy'nin Pemberley adındaki büyük malikanesini ziyaret etti",
          },
          {
            ar: "كانت الحدائق جميلة بمروجها الواسعة وجدولها الصافي وأشجارها العريقة الرشيقة",
            es: "Los terrenos eran hermosos, con amplios prados, un arroyo cristalino y árboles antiguos y elegantes",
            tr: "Araziler geniş çimenleri, berrak bir deresi ve zarif yaşlı ağaçlarıyla güzeldi",
          },
          {
            ar: "أثنت مدبرة المنزل على دارسي بحرارة واصفة إياه بأنه أكرم وألطف سيد",
            es: "El ama de llaves elogió calurosamente a Darcy, describiéndolo como el amo más amable y generoso",
            tr: "Kahya kadın Darcy'yi sıcak bir dille övdü ve onu en nazik, en cömert efendi olarak tanımladı",
          },
          {
            ar: "استمعت إليزابيث بدهشة صامتة غير قادرة على مطابقة هذه الصورة مع رأيها القديم",
            es: "Elizabeth escuchaba con silenciosa sorpresa, incapaz de conciliar ese retrato con su antigua opinión",
            tr: "Elizabeth sessiz bir şaşkınlıkla dinledi, bu tabloyu eski görüşüyle bağdaştıramadı",
          },
          {
            ar: "وصل دارسي على غير توقع وعامل إليزابيث بلطف واحترام جديدين",
            es: "Darcy llegó inesperadamente y trató a Elizabeth con una nueva delicadeza y respeto",
            tr: "Darcy beklenmedik bir şekilde geldi ve Elizabeth'e yeni bir nezaket ve saygıyla davrandı",
          },
          {
            ar: "قدّمها بحرارة لأخته الصغيرة الخجولة جورجيانا دون أي أثر لكبريائه القديم",
            es: "La presentó calurosamente a su tímida hermana menor Georgiana, sin rastro de su antiguo orgullo",
            tr: "Onu, eski gururundan hiçbir iz taşımadan çekingen küçük kız kardeşi Georgiana ile sıcak bir şekilde tanıştırdı",
          },
          {
            ar: "بدأت إليزابيث ترى نسخة من دارسي مختلفة تمامًا عن انطباعها الأول",
            es: "Elizabeth comenzó a ver una versión de Darcy completamente diferente de su primera impresión",
            tr: "Elizabeth, Darcy'nin ilk izleniminden tamamen farklı bir yönünü görmeye başladı",
          },
          {
            ar: "بدأت تتساءل عما إذا كان حكمها المبكر عليه خاطئًا تمامًا",
            es: "Comenzó a preguntarse si su juicio inicial sobre él había estado terriblemente equivocado",
            tr: "Onun hakkındaki erken yargısının büyük ölçüde yanlış olup olmadığını merak etmeye başladı",
          },
        ],
      },
      {
        title: { ar: "فضيحة ليديا", es: "El escándalo de Lydia", tr: "Lydia'nın Skandalı" },
        sentences: [
          {
            ar: "وصل خبر أن ليديا، الأخت الصغرى لإليزابيث، هربت مع ويكهام دون زواج",
            es: "Llegó la noticia de que Lydia, la hermana menor de Elizabeth, se había fugado con Wickham sin casarse",
            tr: "Elizabeth'in en küçük kız kardeşi Lydia'nın evlenmeden Wickham ile kaçtığı haberi geldi",
          },
          {
            ar: "قرأت العائلة الرسالة في صمت مذهول لم يكسره سوى صراخ السيدة بينيت",
            es: "La familia leyó la carta en un silencio atónito, roto solo por los gritos de la señora Bennet",
            tr: "Aile, mektubu yalnızca Bayan Bennet'ın çığlıklarıyla bozulan şaşkın bir sessizlik içinde okudu",
          },
          {
            ar: "هددت الفضيحة بتدمير سمعة عائلة بينيت بأكملها",
            es: "El escándalo amenazaba con arruinar la reputación de toda la familia Bennet",
            tr: "Skandal, tüm Bennet ailesinin itibarını mahvetmekle tehdit ediyordu",
          },
          {
            ar: "خشيت إليزابيث أن دارسي لن يرغب بعد الآن بأي علاقة مع عائلتها",
            es: "Elizabeth temía que Darcy ya no quisiera tener nada que ver con su familia",
            tr: "Elizabeth, Darcy'nin artık ailesiyle hiçbir ilişkisi olmasını istemeyeceğinden korkuyordu",
          },
          {
            ar: "تعقب دارسي الثنائي سرًا ودفع لويكهام ليتزوج ليديا أخيرًا",
            es: "Darcy localizó en secreto a la pareja y pagó a Wickham para que finalmente se casara con Lydia",
            tr: "Darcy, çifti gizlice buldu ve Wickham'a Lydia ile sonunda evlenmesi için para ödedi",
          },
          {
            ar: "سدد ديون ويكهام بهدوء ورتب الزفاف دون السعي لأي ثناء",
            es: "Saldó en silencio las deudas de Wickham y organizó la boda sin buscar ningún elogio",
            tr: "Wickham'ın borçlarını sessizce ödedi ve hiçbir övgü beklemeden düğünü ayarladı",
          },
          {
            ar: "طلب من كل المعنيين إبقاء تدخله الكريم سرًا تامًا",
            es: "Pidió a todos los involucrados que mantuvieran su generosa intervención en absoluto secreto",
            tr: "İlgili herkesten cömert katkısını tamamen sır olarak saklamalarını istedi",
          },
          {
            ar: "علمت إليزابيث الحقيقة أخيرًا وتأثرت بعمق بلطفه الهادئ",
            es: "Elizabeth finalmente descubrió la verdad y quedó profundamente conmovida por su discreta bondad",
            tr: "Elizabeth sonunda gerçeği öğrendi ve onun sessiz nezaketinden derinden etkilendi",
          },
        ],
      },
      {
        title: { ar: "خطبة ثانية", es: "Una segunda propuesta", tr: "İkinci Evlilik Teklifi" },
        sentences: [
          {
            ar: "عاد بنغلي إلى الحي وسرعان ما تقدم بسعادة لجين المبتهجة",
            es: "Bingley regresó al vecindario y pronto le propuso matrimonio feliz a una alegre Jane",
            tr: "Bingley mahalleye geri döndü ve kısa süre sonra mutlu bir şekilde neşeli Jane'e evlenme teklif etti",
          },
          {
            ar: "امتلأ المنزل بأكمله بالضحك والارتياح لهذا الخبر الذي طال انتظاره",
            es: "Toda la casa se llenó de risas y alivio ante la esperada noticia",
            tr: "Uzun zamandır beklenen haberle tüm ev kahkaha ve rahatlamayla doldu",
          },
          {
            ar: "زار دارسي مرة أخرى ووجدت إليزابيث أن مشاعرها تجاهه تغيرت تمامًا",
            es: "Darcy la visitó de nuevo y Elizabeth descubrió que sus sentimientos hacia él habían cambiado por completo",
            tr: "Darcy tekrar ziyarete geldi ve Elizabeth ona karşı duygularının tamamen değiştiğini fark etti",
          },
          {
            ar: "مشيا معًا على طريق هادئ، وكلاهما شديد التوتر ليتكلم في البداية",
            es: "Caminaron juntos por un sendero tranquilo, ambos demasiado nerviosos para hablar al principio",
            tr: "Sessiz bir yolda birlikte yürüdüler, ikisi de başta konuşamayacak kadar gergindi",
          },
          {
            ar: "سألها مرة أخرى عما إذا كانت مشاعرها تجاهه قد تغيرت على الإطلاق",
            es: "Le preguntó una vez más si sus sentimientos hacia él habían cambiado en algo",
            tr: "Ona karşı duygularının hiç değişip değişmediğini bir kez daha sordu",
          },
          {
            ar: "اعترفت إليزابيث بأن رأيها فيه انقلب تمامًا منذ رسالته",
            es: "Elizabeth confesó que su opinión sobre él se había invertido por completo desde su carta",
            tr: "Elizabeth, mektubundan bu yana ona dair görüşünün tamamen tersine döndüğünü itiraf etti",
          },
          {
            ar: "اعترف كلاهما بأن الكبرياء والحكم المتسرع كادا يكلفانهما سعادتهما",
            es: "Ambos admitieron que el orgullo y el juicio precipitado casi les cuestan su felicidad",
            tr: "İkisi de gurur ve aceleci yargının mutluluklarına neredeyse mal olduğunu kabul etti",
          },
          {
            ar: "تنتهي رواية كبرياء وهوى بزواج كل من إليزابيث وجين من الرجلين اللذين تحبانهما حقًا",
            es: "Orgullo y prejuicio termina con Elizabeth y Jane casándose con los hombres que realmente aman",
            tr: "Gurur ve Önyargı, hem Elizabeth hem de Jane'in gerçekten sevdikleri erkeklerle evlenmesiyle sona erer",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-great-gatsby",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة ف. سكوت فيتزجيرالد عن حفلات جاي غاتسبي الباذخة وحبه المتيّم بديزي بيوكانن — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de F. Scott Fitzgerald sobre las deslumbrantes fiestas de Jay Gatsby y su amor obsesivo por Daisy Buchanan — un relato personal, no el texto original.",
      tr: "F. Scott Fitzgerald'ın Jay Gatsby'nin gösterişli partileri ve Daisy Buchanan'a duyduğu saplantılı aşk hakkındaki hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: { ar: "الوصول إلى وست إيغ", es: "Llegando a West Egg", tr: "West Egg'e Varış" },
        sentences: [
          {
            ar: "انتقل نيك كارواي إلى منزل صغير في لونغ آيلاند مجاورًا مباشرة لقصر فخم",
            es: "Nick Carraway se mudó a una pequeña casa en Long Island, justo al lado de una mansión",
            tr: "Nick Carraway, Long Island'da bir malikanenin hemen yanındaki küçük bir eve taşındı",
          },
          {
            ar: "تلألأ الخليج تحت صفوف من المنازل الفخمة التي بُنيت لأصحاب الثروات الحديثة الهائلة",
            es: "La bahía brillaba bajo hileras de grandes casas construidas para los nuevos y enormemente ricos",
            tr: "Körfez, yeni ve muazzam zenginler için inşa edilmiş büyük evlerin sıraları altında parıldıyordu",
          },
          {
            ar: "كان جاره الغامض رجلاً ثريًا يُدعى جاي غاتسبي لا يعرفه أحد حق المعرفة",
            es: "Su misterioso vecino era un hombre rico llamado Jay Gatsby a quien nadie conocía realmente",
            tr: "Gizemli komşusu, kimsenin gerçekten tanımadığı Jay Gatsby adında zengin bir adamdı",
          },
          {
            ar: "نشأ نيك في وسط متواضع ووجد نفسه محاطًا بثروة هائلة غير مبالية",
            es: "Nick había crecido con modestia y se encontró rodeado de una riqueza enorme y despreocupada",
            tr: "Nick mütevazı bir ortamda büyümüştü ve kendini umursamaz, muazzam bir zenginlikle çevrili buldu",
          },
          {
            ar: "كانت الأضواء الساطعة والموسيقى الخافتة تنبعث كل ليلة من قصر غاتسبي عبر المرج",
            es: "Luces brillantes y música tenue llegaban cada noche desde la mansión de Gatsby a través del jardín",
            tr: "Her gece Gatsby'nin malikanesinden parlak ışıklar ve hafif müzik çimenliğin öte yanından geliyordu",
          },
          {
            ar: "عبر الخليج كانت تعيش ابنة عمه ديزي وزوجها المتغطرس توم بيوكانن",
            es: "Al otro lado de la bahía vivía su prima Daisy y su arrogante esposo Tom Buchanan",
            tr: "Körfezin karşı tarafında kuzeni Daisy ve kibirli kocası Tom Buchanan yaşıyordu",
          },
          {
            ar: "كان قصرهما الأبيض يطل على الماء بأناقة واثقة",
            es: "Su mansión blanca daba al agua con una elegancia serena y segura",
            tr: "Beyaz malikaneleri suya rahat bir zarafetle bakıyordu",
          },
          {
            ar: "سرعان ما أدرك نيك أن هذا العالم المتلألئ يخفي حزنًا أكبر بكثير مما بدا في البداية",
            es: "Nick pronto comprendió que ese mundo deslumbrante ocultaba mucha más tristeza de la que aparentaba",
            tr: "Nick kısa sürede bu parıltılı dünyanın ilk göründüğünden çok daha fazla hüzün sakladığını fark etti",
          },
        ],
      },
      {
        title: { ar: "الجار الغامض", es: "El vecino misterioso", tr: "Gizemli Komşu" },
        sentences: [
          {
            ar: "استضاف غاتسبي حفلات ضخمة كل نهاية أسبوع مليئة بغرباء لم يدعُ أحدًا منهم شخصيًا",
            es: "Gatsby organizaba enormes fiestas cada fin de semana llenas de desconocidos a los que nunca había invitado personalmente",
            tr: "Gatsby, hiçbirini kişisel olarak davet etmediği yabancılarla dolu, her hafta sonu muazzam partiler veriyordu",
          },
          {
            ar: "اصطفت السيارات على طول الممر الطويل وأضاءت الأنوار كل نافذة حتى الفجر",
            es: "Los coches se alineaban en el largo camino de entrada y las luces brillaban en cada ventana hasta el amanecer",
            tr: "Arabalar uzun araba yolunda sıralanıyor, ışıklar şafağa kadar her pencerede parlıyordu",
          },
          {
            ar: "تبادل الضيوف إشاعات جامحة تزعم أنه جاسوس أو قاتل أو أمير سري",
            es: "Los invitados intercambiaban rumores salvajes que afirmaban que era un espía, un asesino o un príncipe secreto",
            tr: "Konuklar onun bir casus, bir katil ya da gizli bir prens olduğuna dair çılgın söylentiler paylaşıyordu",
          },
          {
            ar: "تدفق الشمبانيا طوال الليل بينما عزفت الأوركسترا حتى ساعات الصباح الباكر جدًا",
            es: "El champán corría toda la noche mientras una orquesta tocaba hasta las primeras horas de la madrugada",
            tr: "Şampanya tüm gece akarken bir orkestra sabahın erken saatlerine kadar çalıyordu",
          },
          {
            ar: "انسكبت الضحكات والموسيقى فوق المرج ونزولًا نحو الماء الداكن",
            es: "Las risas y la música se derramaban sobre el jardín y bajaban hacia el agua oscura",
            tr: "Kahkaha ve müzik çimenliğin üzerinden taşıp karanlık suya doğru yayılıyordu",
          },
          {
            ar: "ورغم امتلاكه القصر، نادرًا ما بدا غاتسبي مستمتعًا بحفلاته الشهيرة",
            es: "A pesar de ser dueño de la mansión, Gatsby rara vez parecía disfrutar de sus famosas fiestas",
            tr: "Malikaneye sahip olmasına rağmen Gatsby ünlü partilerinden nadiren keyif alıyor gibiydi",
          },
          {
            ar: "غالبًا ما كان يقف بمعزل يراقب بهدوء بدلًا من الانضمام إلى الحشد الصاخب",
            es: "A menudo se quedaba aparte, observando en silencio en lugar de unirse a la ruidosa multitud",
            tr: "Genellikle kalabalığa katılmak yerine bir kenarda durup sessizce izliyordu",
          },
          {
            ar: "بدت عيناه ثابتتين على شيء بعيد عبر الخليج لا يراه سواه",
            es: "Sus ojos parecían fijos en algo lejano al otro lado de la bahía que solo él podía ver",
            tr: "Gözleri, yalnızca kendisinin görebildiği körfezin karşısındaki uzak bir şeye takılı kalmış gibiydi",
          },
        ],
      },
      {
        title: { ar: "ديزي وتوم", es: "Daisy y Tom", tr: "Daisy ve Tom" },
        sentences: [
          {
            ar: "زار نيك ابنة عمه ديزي التي كانت تعيش في منزل جميل مع زوجها توم",
            es: "Nick visitó a su prima Daisy, quien vivía en una hermosa casa con su esposo Tom",
            tr: "Nick, kocası Tom ile güzel bir evde yaşayan kuzeni Daisy'yi ziyaret etti",
          },
          {
            ar: "كان صوت ديزي ناعمًا وموسيقيًا لكنه يحمل حزنًا قلقًا غريبًا",
            es: "La voz de Daisy era suave y musical, pero llevaba una extraña tristeza inquieta",
            tr: "Daisy'nin sesi yumuşak ve müzikaldi ama tuhaf, huzursuz bir hüzün taşıyordu",
          },
          {
            ar: "كان توم قويًا جسديًا ومتعجرفًا وخائنًا علنًا لزوجته التعيسة",
            es: "Tom era físicamente poderoso, arrogante y abiertamente infiel a su infeliz esposa",
            tr: "Tom fiziksel olarak güçlü, kibirli ve mutsuz karısına açıkça sadakatsizdi",
          },
          {
            ar: "كان يتحدث بصوت عالٍ عن آرائه ونادرًا ما يترك أحدًا يكمل جملته",
            es: "Hablaba en voz alta sobre sus propias opiniones y rara vez dejaba que alguien terminara una frase",
            tr: "Kendi görüşleri hakkında yüksek sesle konuşuyor, nadiren birinin cümlesini bitirmesine izin veriyordu",
          },
          {
            ar: "قاطعت مكالمة هاتفية العشاء وعرف الجميع بوضوح أنها من عشيقة توم",
            es: "Una llamada telefónica interrumpió la cena y todos supieron claramente que era la amante de Tom",
            tr: "Bir telefon çağrısı akşam yemeğini böldü ve herkes bunun Tom'un metresi olduğunu açıkça anladı",
          },
          {
            ar: "ضحكت ديزي بخفة لإخفاء ارتباكها رغم أن يديها كانتا ترتجفان قليلًا",
            es: "Daisy rió con ligereza para disimular su incomodidad, aunque sus manos temblaban levemente",
            tr: "Daisy rahatsızlığını gizlemek için hafifçe güldü, ama elleri hafifçe titriyordu",
          },
          {
            ar: "بدت ديزي ضجرة وقلقة عالقة في زواج لم يمنحها الكثير من الفرح",
            es: "Daisy parecía aburrida e inquieta, atrapada en un matrimonio que le daba poca alegría",
            tr: "Daisy sıkılmış ve huzursuz görünüyordu, kendisine az mutluluk veren bir evliliğe hapsolmuştu",
          },
          {
            ar: "غادر نيك الزيارة قلقًا وقد استشعر تعاسة عميقة مختبئة خلف نمط حياتهما اللامع",
            es: "Nick se marchó de la visita inquieto, sintiendo una profunda infelicidad oculta bajo su estilo de vida pulido",
            tr: "Nick ziyaretten huzursuz ayrıldı, parlak yaşam tarzlarının ardında saklı derin bir mutsuzluk hissetti",
          },
        ],
      },
      {
        title: { ar: "دعوة", es: "Una invitación", tr: "Bir Davet" },
        sentences: [
          {
            ar: "تلقى نيك دعوة شخصية نادرة لإحدى حفلات غاتسبي الشهيرة الباذخة",
            es: "Nick recibió una rara invitación personal a una de las famosas y extravagantes fiestas de Gatsby",
            tr: "Nick, Gatsby'nin ünlü ve gösterişli partilerinden birine nadir kişisel bir davet aldı",
          },
          {
            ar: "تجول في غرف مزدحمة مليئة بغرباء بالكاد يعرفون مضيفهم",
            es: "Deambuló por salas abarrotadas llenas de desconocidos que apenas conocían a su anfitrión",
            tr: "Ev sahibini pek tanımayan yabancılarla dolu kalabalık odalarda dolaştı",
          },
          {
            ar: "التقى أخيرًا بجاره، رجلًا ساحرًا بابتسامة غريبة متقنة",
            es: "Finalmente conoció a su vecino, un hombre encantador con una extraña sonrisa ensayada",
            tr: "Sonunda komşusuyla tanıştı; tuhaf, alıştırılmış bir gülümsemesi olan çekici bir adamdı",
          },
          {
            ar: "دعا غاتسبي الجميع بلقب عزيزي وبدا متلهفًا لكن متوترًا بغرابة بجوار نيك",
            es: "Gatsby llamaba a todos old sport y parecía ansioso pero extrañamente nervioso junto a Nick",
            tr: "Gatsby herkese eski dostum diyordu ve Nick'in yanında hevesli ama tuhaf bir şekilde gergin görünüyordu",
          },
          {
            ar: "بدت ابتسامته وكأنها تعد بأنه يفهم تمامًا كيف تريد أن تُرى",
            es: "Su sonrisa parecía prometer que entendía exactamente cómo deseabas que te vieran",
            tr: "Gülümsemesi, görünmek istediğin şekli tam olarak anladığına dair bir söz veriyor gibiydi",
          },
          {
            ar: "استمرت الإشاعات حول ماضي غاتسبي حتى وهو يتعرف عليه أكثر",
            es: "Los rumores sobre el pasado de Gatsby continuaron incluso mientras Nick lo iba conociendo",
            tr: "Nick onu daha yakından tanırken bile Gatsby'nin geçmişi hakkındaki söylentiler devam etti",
          },
          {
            ar: "زعم بعض الضيوف أنه قتل رجلًا وقال آخرون إنه أمير سري",
            es: "Algunos invitados afirmaban que había matado a un hombre, otros decían que era un príncipe secreto",
            tr: "Bazı konuklar bir adam öldürdüğünü iddia ederken, diğerleri gizli bir prens olduğunu söyledi",
          },
          {
            ar: "بدأ نيك يشك في أن الحفلات وجدت لغرض واحد محدد جدًا خفي",
            es: "Nick empezó a sospechar que las fiestas existían con un propósito muy específico y oculto",
            tr: "Nick, partilerin çok özel, gizli bir amaç için var olduğundan şüphelenmeye başladı",
          },
        ],
      },
      {
        title: { ar: "طلب غاتسبي", es: "La petición de Gatsby", tr: "Gatsby'nin İsteği" },
        sentences: [
          {
            ar: "اعترف غاتسبي أخيرًا بأنه أحب ديزي يومًا ما قبل سنوات من زواجها من توم",
            es: "Gatsby finalmente admitió que una vez había amado a Daisy, años antes de que se casara con Tom",
            tr: "Gatsby sonunda, Daisy Tom ile evlenmeden yıllar önce onu bir zamanlar sevdiğini itiraf etti",
          },
          {
            ar: "وصف رومانسيتهما القصيرة بحنين لم يخبُ يومًا",
            es: "Describió su breve romance con un anhelo que nunca se había desvanecido",
            tr: "Kısa aşklarını hiç sönmeyen bir özlemle anlattı",
          },
          {
            ar: "بنى ثروته وقصره كله على أمل استعادتها في النهاية",
            es: "Había construido toda su fortuna y su mansión esperando recuperarla algún día",
            tr: "Tüm servetini ve malikanesini onu bir gün geri kazanma umuduyla inşa etmişti",
          },
          {
            ar: "طلب غاتسبي من نيك أن يرتب لقاءً هادئًا بينه وبين ديزي",
            es: "Gatsby le pidió a Nick que organizara un encuentro tranquilo entre él y Daisy",
            tr: "Gatsby, Nick'ten kendisiyle Daisy arasında sessiz bir buluşma ayarlamasını istedi",
          },
          {
            ar: "انكشفت ثقته المعتادة للحظة كاشفة مدى توتره الحقيقي",
            es: "Su usual confianza se resquebrajó brevemente, revelando lo nervioso que realmente estaba",
            tr: "Her zamanki özgüveni kısa bir süre için çatlayarak aslında ne kadar gergin olduğunu ortaya çıkardı",
          },
          {
            ar: "وافق نيك شاعرًا بأنه انجرف إلى حلم رومانسي بدا سخيفًا ومؤثرًا في آنٍ واحد",
            es: "Nick aceptó, sintiéndose arrastrado a un sueño romántico que parecía a la vez tonto y conmovedor",
            tr: "Nick kabul etti, kendini hem saçma hem de dokunaklı görünen romantik bir hayale kapılmış hissetti",
          },
          {
            ar: "استعد غاتسبي بعصبية مرتبًا الزهور والملابس للقاء المهم",
            es: "Gatsby se preparó nerviosamente, arreglando flores y ropa para el importante encuentro",
            tr: "Gatsby gergin bir şekilde çiçekleri ve kıyafetleri önemli buluşma için düzenledi",
          },
          {
            ar: "راح يتمشى في منزله الضخم عاجزًا عن الجلوس مع اقتراب الموعد المحدد",
            es: "Caminaba de un lado a otro por su enorme casa, incapaz de sentarse mientras se acercaba la hora acordada",
            tr: "Belirlenen saat yaklaşırken oturamayan bir halde devasa evinde bir aşağı bir yukarı yürüdü",
          },
        ],
      },
      {
        title: { ar: "لقاء بعد فراق", es: "Reencuentro", tr: "Yeniden Kavuşma" },
        sentences: [
          {
            ar: "التقى ديزي وغاتسبي مجددًا للمرة الأولى منذ خمس سنوات طويلة بالضبط",
            es: "Daisy y Gatsby se reencontraron por primera vez en exactamente cinco largos años",
            tr: "Daisy ve Gatsby, tam beş uzun yıl sonra ilk kez yeniden bir araya geldi",
          },
          {
            ar: "كان اللقاء محرجًا في البداية لكنه سرعان ما تحول إلى عاطفة حقيقية",
            es: "El reencuentro fue incómodo al principio, pero pronto se calentó hasta convertirse en emoción genuina",
            tr: "Kavuşma başta garipti ama kısa sürede gerçek bir duyguya dönüştü",
          },
          {
            ar: "طرق المطر بهدوء على النوافذ بينما عادت المشاعر القديمة ببطء",
            es: "La lluvia golpeaba suavemente las ventanas mientras los viejos sentimientos regresaban lentamente",
            tr: "Eski duygular yavaşça geri dönerken yağmur pencerelere hafifçe vuruyordu",
          },
          {
            ar: "أرى غاتسبي ديزي بفخر قصره الضخم وخزائنه المليئة بالقمصان",
            es: "Gatsby le mostró a Daisy con orgullo su enorme mansión y sus armarios llenos de camisas",
            tr: "Gatsby, Daisy'ye devasa malikanesini ve gömleklerle dolu dolaplarını gururla gösterdi",
          },
          {
            ar: "رمى القمصان الملونة عبر السرير فقط ليرى رد فعلها",
            es: "Arrojó las camisas de colores sobre la cama solo para ver su reacción",
            tr: "Sadece tepkisini görmek için renkli gömlekleri yatağın üzerine fırlattı",
          },
          {
            ar: "بدأت ديزي بالبكاء فجأة وقد غمرها جمال كل هذا الجهد",
            es: "Daisy de repente rompió a llorar, abrumada por la belleza y el esfuerzo detrás de todo aquello",
            tr: "Daisy aniden ağlamaya başladı, tüm bunların ardındaki güzellik ve çabadan etkilenmişti",
          },
          {
            ar: "همست وسط دموعها إنها لم ترَ أشياء بهذا الجمال من قبل",
            es: "Susurró entre lágrimas que nunca había visto cosas tan hermosas",
            tr: "Gözyaşları arasında daha önce böyle güzel şeyler görmediğini fısıldadı",
          },
          {
            ar: "للحظة قصيرة بدا حلم غاتسبي المستحيل الطويل في متناول يده أخيرًا",
            es: "Por un breve instante, el largo e imposible sueño de Gatsby finalmente pareció estar a su alcance",
            tr: "Kısa bir an için Gatsby'nin uzun süredir imkansız görünen hayali sonunda ulaşılabilir gibi görünüyordu",
          },
        ],
      },
      {
        title: { ar: "حقيقة غاتسبي", es: "La verdad sobre Gatsby", tr: "Gatsby Hakkındaki Gerçek" },
        sentences: [
          {
            ar: "علم نيك في النهاية أن اسم غاتسبي الحقيقي كان جيمس غاتز وُلد لعائلة فقيرة",
            es: "Nick descubrió finalmente que el verdadero nombre de Gatsby era James Gatz, nacido en una familia pobre",
            tr: "Nick sonunda Gatsby'nin gerçek adının James Gatz olduğunu ve yoksul bir aileden geldiğini öğrendi",
          },
          {
            ar: "في مراهقته أعاد تشكيل نفسه بهدوء متخيلًا مستقبلًا أعظم لذاته",
            es: "De adolescente se había reinventado en silencio, imaginando un futuro más grandioso para sí mismo",
            tr: "Genç yaşında sessizce kendini yeniden yaratmış, kendisi için daha görkemli bir gelecek hayal etmişti",
          },
          {
            ar: "أعاد تشكيل نفسه كليًا وهو شاب سعيًا وراء الثروة والمكانة",
            es: "De joven se había reinventado por completo para perseguir la riqueza y el estatus",
            tr: "Genç bir adam olarak servet ve statü peşinde kendini tamamen yeniden yaratmıştı",
          },
          {
            ar: "كسب ثروته عبر صفقات تجارية مشبوهة وغير قانونية بقيت مخفية بعناية",
            es: "Ganó su fortuna a través de turbios negocios ilegales que se mantuvieron cuidadosamente ocultos",
            tr: "Servetini, dikkatle gizli tutulan şaibeli, yasa dışı iş anlaşmalarıyla kazandı",
          },
          {
            ar: "لم يتحدث علنًا عن هذه الصفقات أبدًا حتى مع من وثق بهم",
            es: "Nunca habló abiertamente de esos negocios, ni siquiera con la gente en quien confiaba",
            tr: "Bu anlaşmalar hakkında güvendiği insanlarla bile asla açıkça konuşmadı",
          },
          {
            ar: "كل ما بناه غاتسبي وُجد لغرض واحد وحيد وهو الفوز بحب ديزي مجددًا",
            es: "Todo lo que Gatsby construyó existía para un único propósito: reconquistar el amor de Daisy",
            tr: "Gatsby'nin inşa ettiği her şey tek bir amaç için vardı: Daisy'nin aşkını yeniden kazanmak",
          },
          {
            ar: "كان قصره وحفلاته وثروته جميعها جزءًا من أداء طويل واحد",
            es: "Su mansión, sus fiestas y su fortuna eran todos parte de una única y larga actuación",
            tr: "Malikanesi, partileri ve serveti hepsi uzun, tek bir performansın parçasıydı",
          },
          {
            ar: "كانت هويته البراقة بأكملها في الحقيقة مجرد أداء مخلص وهش للغاية",
            es: "Toda su brillante identidad era en realidad solo una actuación devota y muy frágil",
            tr: "Tüm o parlak kimliği aslında yalnızca kendini adamış, çok kırılgan bir performanstı",
          },
        ],
      },
      {
        title: {
          ar: "مواجهة في نيويورك",
          es: "Confrontación en Nueva York",
          tr: "New York'ta Yüzleşme",
        },
        sentences: [
          {
            ar: "بدأ توم يشك وواجه غاتسبي مباشرة بشأن مشاعره تجاه ديزي",
            es: "Tom empezó a sospechar y confrontó a Gatsby directamente sobre sus sentimientos hacia Daisy",
            tr: "Tom şüphelenmeye başladı ve Daisy'ye karşı hisleri konusunda Gatsby ile doğrudan yüzleşti",
          },
          {
            ar: "احتدم جدالهما داخل غرفة فندق خانقة في عصر يوم شديد الحر",
            es: "Su discusión se intensificó dentro de una sofocante habitación de hotel en una tarde abrasadora",
            tr: "Tartışmaları, kavurucu bir öğleden sonra boğucu bir otel odasında kızıştı",
          },
          {
            ar: "كشف عن صفقات غاتسبي التجارية الإجرامية أمام الجميع في الفندق",
            es: "Expuso los negocios criminales de Gatsby delante de todos en el hotel",
            tr: "Gatsby'nin suç işleriyle ilgili anlaşmalarını otelde herkesin önünde ifşa etti",
          },
          {
            ar: "أصر غاتسبي بيأس على أن ديزي لم تحب زوجها حقًا قط",
            es: "Gatsby insistió desesperadamente en que Daisy nunca había amado realmente a su propio esposo",
            tr: "Gatsby, Daisy'nin kendi kocasını gerçekten hiç sevmediğinde umutsuzca ısrar etti",
          },
          {
            ar: "ارتبكت ديزي ولم تستطع الالتزام تمامًا بترك توم من أجل غاتسبي",
            es: "Daisy se sintió confundida y no pudo comprometerse del todo a dejar a Tom por Gatsby",
            tr: "Daisy şaşkına döndü ve Tom'u Gatsby için terk etmeye tam olarak karar veremedi",
          },
          {
            ar: "نظرت بعجز بين الرجلين عاجزة عن اختيار أحدهما تمامًا",
            es: "Miraba impotente entre los dos hombres, incapaz de elegir a ninguno por completo",
            tr: "İki adam arasında çaresizce bakındı, ikisinden birini tam olarak seçemedi",
          },
          {
            ar: "تصدعت صورة غاتسبي الواثقة بينما ترددت ديزي بين الرجلين المتنافسين",
            es: "La confiada imagen de Gatsby se resquebrajó mientras Daisy dudaba entre los dos rivales",
            tr: "Daisy iki rakip arasında tereddüt ederken Gatsby'nin özgüvenli imajı çatladı",
          },
          {
            ar: "انتهى بعد الظهيرة المتوتر دون فائز واضح ومرارة متصاعدة في طريق العودة",
            es: "La tensa tarde terminó sin un ganador claro y con una amargura creciente en el camino de regreso",
            tr: "Gergin öğleden sonra net bir kazanan olmadan ve eve dönüş yolunda artan bir acılıkla sona erdi",
          },
        ],
      },
      {
        title: { ar: "مأساة على الطريق", es: "Tragedia en el camino", tr: "Yolda Trajedi" },
        sentences: [
          {
            ar: "أثناء القيادة إلى المنزل صدمت ديزي عن طريق الخطأ عشيقة توم ميرتل وقتلتها على الطريق",
            es: "Conduciendo a casa, Daisy atropelló accidentalmente y mató a Myrtle, la amante de Tom, en la carretera",
            tr: "Eve dönerken Daisy kazara Tom'un metresi Myrtle'a çarparak yolda onu öldürdü",
          },
          {
            ar: "لم تبطئ السيارة حتى بينما اختفت في الظلام المتجمع",
            es: "El coche ni siquiera redujo la velocidad mientras desaparecía en la oscuridad creciente",
            tr: "Araba, toplanan karanlıkta kaybolurken yavaşlamadı bile",
          },
          {
            ar: "قرر غاتسبي بإخلاص تحمل اللوم لحماية ديزي من أي عواقب",
            es: "Gatsby decidió lealmente cargar con la culpa para proteger a Daisy de cualquier consecuencia",
            tr: "Gatsby, Daisy'yi herhangi bir sonuçtan korumak için sadakatle suçu üstlenmeye karar verdi",
          },
          {
            ar: "انتظر خارج منزلها طوال الليل فقط ليتأكد من أنها بأمان",
            es: "Esperó fuera de su casa toda la noche solo para asegurarse de que estuviera a salvo",
            tr: "Sadece güvende olduğundan emin olmak için tüm gece evinin dışında bekledi",
          },
          {
            ar: "اعتقد زوج ميرتل المفجوع أن سيارة غاتسبي قتلت زوجته عمدًا",
            es: "El marido desconsolado de Myrtle creyó que el coche de Gatsby había matado a su esposa deliberadamente",
            tr: "Myrtle'ın yıkılmış kocası, Gatsby'nin arabasının karısını kasten öldürdüğüne inandı",
          },
          {
            ar: "استحوذ عليه الحزن والغضب حتى بالكاد استطاع التفكير في أي شيء آخر",
            es: "El dolor y la rabia lo consumieron hasta que apenas podía pensar en otra cosa",
            tr: "Keder ve öfke onu öyle sardı ki başka bir şey düşünemez oldu",
          },
          {
            ar: "أخبر توم الزوج بهدوء بالضبط أين يجد منزل غاتسبي في تلك الليلة",
            es: "Tom le dijo tranquilamente al marido exactamente dónde encontrar la casa de Gatsby esa noche",
            tr: "Tom, kocaya o gece Gatsby'nin evini tam olarak nerede bulacağını sakince söyledi",
          },
          {
            ar: "استشعر نيك أن المأساة بأكملها على وشك أن تنتهي بشيء أسوأ بكثير",
            es: "Nick presintió que toda la tragedia estaba a punto de terminar en algo mucho peor",
            tr: "Nick, tüm bu trajedinin çok daha kötü bir şeyle son bulmak üzere olduğunu hissetti",
          },
        ],
      },
      {
        title: { ar: "نهاية غاتسبي", es: "El final de Gatsby", tr: "Gatsby'nin Sonu" },
        sentences: [
          {
            ar: "وصل زوج ميرتل إلى قصر غاتسبي وأطلق عليه النار بجانب مسبحه الخاص",
            es: "El marido de Myrtle llegó a la mansión de Gatsby y le disparó junto a su propia piscina",
            tr: "Myrtle'ın kocası Gatsby'nin malikanesine geldi ve onu kendi havuzunun yanında vurdu",
          },
          {
            ar: "تحول الماء تدريجيًا إلى اللون الأحمر بينما وقف القصر الضخم صامتًا خلفه",
            es: "El agua se fue tiñendo de rojo mientras la enorme casa permanecía en silencio detrás de él",
            tr: "Su yavaş yavaş kızıla dönerken arkasındaki devasa ev sessizce duruyordu",
          },
          {
            ar: "مات غاتسبي وهو ما زال ينتظر بأمل مكالمة هاتفية من ديزي لم تأتِ أبدًا",
            es: "Gatsby murió aún esperando esperanzado una llamada telefónica de Daisy que nunca llegó",
            tr: "Gatsby, hiç gelmeyen Daisy'den bir telefon bekleyerek umutla can verdi",
          },
          {
            ar: "لم يكلف معظم ضيوف حفلاته العديدة أنفسهم عناء حضور جنازته الصغيرة الهادئة",
            es: "Casi ninguno de sus muchos invitados a las fiestas se molestó en asistir a su pequeño y silencioso funeral",
            tr: "Birçok parti misafirinden neredeyse hiçbiri onun küçük, sessiz cenazesine katılma zahmetine girmedi",
          },
          {
            ar: "لم يقف بجانب قبره سوى نيك ووالد غاتسبي وحفنة من الخدم",
            es: "Solo Nick, el padre de Gatsby y un puñado de sirvientes permanecieron junto a la tumba",
            tr: "Mezarın başında yalnızca Nick, Gatsby'nin babası ve birkaç hizmetçi durdu",
          },
          {
            ar: "غادرت ديزي وتوم المدينة بهدوء معًا دون ترك أي عنوان أو تفسير",
            es: "Daisy y Tom abandonaron la ciudad juntos en silencio, sin dejar dirección ni explicación",
            tr: "Daisy ve Tom sessizce birlikte şehri terk ettiler, geride adres veya açıklama bırakmadan",
          },
          {
            ar: "لم تصل أي زهور ولا رسائل ولا كلمة واحدة من المرأة التي أحبها طويلًا",
            es: "No llegaron flores, ni cartas, ni una sola palabra de la mujer que había amado durante tanto tiempo",
            tr: "Uzun zamandır sevdiği kadından ne çiçek, ne mektup ne de tek bir kelime geldi",
          },
          {
            ar: "غادر نيك نيويورك محبطًا من الفراغ المختبئ خلف كل هذه الثروة اللامعة",
            es: "Nick dejó Nueva York desilusionado por el vacío escondido detrás de tanta riqueza deslumbrante",
            tr: "Nick, bu kadar göz kamaştırıcı zenginliğin ardında saklı boşluktan hayal kırıklığına uğrayarak New York'tan ayrıldı",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-little-prince",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة أنطوان دو سانت إكزوبيري عن طيار عالق وأمير صغير يعلّمه ما يهم حقًا — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Antoine de Saint-Exupéry sobre un piloto varado y un pequeño príncipe que le enseña lo que realmente importa — un relato personal, no el texto original.",
      tr: "Antoine de Saint-Exupéry'nin çölde mahsur kalan bir pilot ve ona gerçekten önemli olanı öğreten küçük bir prens hakkındaki hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: { ar: "الطيار في الصحراء", es: "El piloto en el desierto", tr: "Çöldeki Pilot" },
        sentences: [
          {
            ar: "تحطمت طائرة طيار صغيرة واضطرته للهبوط في عمق صحراء الصحراء الكبرى الخالية",
            es: "Un piloto estrelló su pequeño avión y tuvo que aterrizar en lo profundo del vacío desierto del Sahara",
            tr: "Bir pilot küçük uçağını kazaya uğrattı ve bomboş Sahra Çölü'nün ortasına inmek zorunda kaldı",
          },
          {
            ar: "امتدت الكثبان بلا نهاية في كل اتجاه تحت سماء شاسعة محترقة صامتة",
            es: "Las dunas se extendían sin fin en todas direcciones bajo un cielo vasto, ardiente y silencioso",
            tr: "Kum tepeleri, geniş, yakıcı ve sessiz bir gökyüzü altında her yöne sonsuzca uzanıyordu",
          },
          {
            ar: "كان وحيدًا ولديه بالكاد ما يكفي من الماء ولا وسيلة لطلب المساعدة",
            es: "Estaba solo, con apenas suficiente agua y sin forma de pedir ayuda",
            tr: "Yalnızdı, yetecek kadar suyu zar zor vardı ve yardım isteyecek bir yolu yoktu",
          },
          {
            ar: "عند شروق الشمس سأله صوت صغير غريب بأدب أن يرسم له خروفًا",
            es: "Al amanecer, una extraña vocecita le pidió cortésmente que le dibujara una oveja",
            tr: "Şafak vakti, garip küçük bir ses ondan kibarca bir koyun çizmesini istedi",
          },
          {
            ar: "ذُهل الطيار ورفع نظره ليرى صبيًا جادًا صغيرًا يقف أمامه",
            es: "Sobresaltado, el piloto levantó la vista y vio a un niño serio de pie ante él",
            tr: "Şaşıran pilot başını kaldırdığında karşısında duran ciddi görünüşlü küçük bir çocuk gördü",
          },
          {
            ar: "التقط شعره الذهبي ضوء الصباح الباكر بينما كان ينتظر بصبر إجابة",
            es: "Su cabello dorado captaba la luz de la mañana mientras esperaba pacientemente una respuesta",
            tr: "Altın rengi saçları erken sabah ışığını yakalarken sabırla bir cevap bekliyordu",
          },
          {
            ar: "لم يبدُ الصبي ضائعًا على الإطلاق رغم الرمال الخالية الممتدة من حولهما",
            es: "El niño no parecía en absoluto perdido, pese a la extensión vacía de arena que los rodeaba",
            tr: "Etraflarındaki uçsuz bucaksız boş kumlara rağmen çocuk hiç kaybolmuş görünmüyordu",
          },
          {
            ar: "بفضول جانب الطيار محركه المعطل ومد يده نحو قلم رصاص",
            es: "Con curiosidad, el piloto dejó a un lado su motor averiado y tomó un lápiz",
            tr: "Meraklanan pilot bozuk motorunu bir kenara bırakıp bir kalem uzattı",
          },
        ],
      },
      {
        title: { ar: "رسمة خروف", es: "Un dibujo de una oveja", tr: "Bir Koyun Çizimi" },
        sentences: [
          {
            ar: "حاول الطيار عدة رسومات لخروف لكن الصبي رفضها جميعًا واحدة تلو الأخرى",
            es: "El piloto intentó varios dibujos de ovejas, pero el niño los rechazó todos, uno tras otro",
            tr: "Pilot birkaç koyun çizimi denedi ama çocuk hepsini birer birer reddetti",
          },
          {
            ar: "بدا أحدها مريضًا للغاية وآخر عجوزًا جدًا وواحد له قرون ككبش",
            es: "Uno parecía demasiado enfermo, otro demasiado viejo, y uno tenía cuernos como un carnero",
            tr: "Biri çok hasta görünüyordu, diğeri çok yaşlıydı, bir tanesinin de koç gibi boynuzları vardı",
          },
          {
            ar: "بإحباط رسم الطيار صندوقًا بسيطًا وقال إن الخروف مختبئ بداخله",
            es: "Frustrado, el piloto dibujó una simple caja y dijo que la oveja estaba escondida dentro",
            tr: "Sinirlenen pilot basit bir kutu çizdi ve koyunun içinde saklı olduğunu söyledi",
          },
          {
            ar: "ابتسم الصبي بإشراق وأعلن أن هذه الرسمة كانت بالضبط ما أراده",
            es: "El niño sonrió radiante y declaró que ese dibujo era exactamente lo que había querido",
            tr: "Çocuk parlak bir gülümsemeyle bunun tam olarak istediği çizim olduğunu ilan etti",
          },
          {
            ar: "حدّق عبر النوافذ الصغيرة المرسومة وكأنه يتفقد خروفه حقًا",
            es: "Se asomó por las pequeñas ventanas dibujadas como si realmente estuviera revisando a su oveja",
            tr: "Küçük çizilmiş pencerelerden içeri baktı, sanki gerçekten koyununu kontrol ediyormuş gibi",
          },
          {
            ar: "تذكّر الطيار وهو طفل رسمه لثعبان ابتلع فيلًا",
            es: "El piloto recordó cuando de niño había dibujado una serpiente que se había tragado un elefante",
            tr: "Pilot çocukken bir fili yutan bir yılan çizdiğini hatırladı",
          },
          {
            ar: "كل بالغ عرضه عليه الرسمة رأى فيها قبعة عادية فقط",
            es: "Cada adulto al que se lo mostró solo veía en él un sombrero corriente",
            tr: "Çizimi gösterdiği her yetişkin onda sadece sıradan bir şapka görmüştü",
          },
          {
            ar: "كان قد تخلى عن الرسم تمامًا معتقدًا أن البالغين لا يفهمون شيئًا حقًا أبدًا",
            es: "Había abandonado el dibujo por completo, convencido de que los adultos nunca entendían nada de verdad",
            tr: "Yetişkinlerin hiçbir şeyi gerçekten anlamadığına inanarak çizim yapmayı tamamen bırakmıştı",
          },
        ],
      },
      {
        title: {
          ar: "كوكب الأمير الصغير",
          es: "El pequeño planeta del príncipe",
          tr: "Prensin Küçücük Gezegeni",
        },
        sentences: [
          {
            ar: "أوضح الصبي أنه جاء من كوكب صغير جدًا لدرجة أنه بالكاد أكبر من منزل",
            es: "El niño explicó que venía de un planeta tan pequeño que apenas era más grande que una casa",
            tr: "Çocuk, bir evden çok daha büyük olmayan minicik bir gezegenden geldiğini açıkladı",
          },
          {
            ar: "كان اسمه الكويكب بي 612 رغم أن قلة من الناس أخذوه على محمل الجد",
            es: "Se llamaba Asteroide B 612, aunque pocas personas lo habían tomado alguna vez en serio",
            tr: "Adı Asteroit B 612'ydi, ama pek az kişi onu ciddiye almıştı",
          },
          {
            ar: "كان يقتلع براعم شجر الباوباب بعناية كل يوم قبل أن تشق جذورها كوكبه الصغير",
            es: "Arrancaba con cuidado los brotes de baobab cada día antes de que sus raíces pudieran partir su pequeño planeta",
            tr: "Kökleri küçük gezegenini bölmeden önce her gün baobap filizlerini dikkatle söküyordu",
          },
          {
            ar: "إن تُركت الجذور المتنامية دون رقابة يمكنها أن تصدع عالمه الصغير تمامًا",
            es: "Si se dejaban crecer sin control, las raíces podían partir por completo su pequeño mundo",
            tr: "Kontrolsüz bırakılırsa büyüyen kökler küçük dünyasını tamamen parçalayabilirdi",
          },
          {
            ar: "كان لعالمه الصغير بركانان صغيران يستخدمهما بلطف للطهي كل صباح",
            es: "Su pequeño mundo tenía dos pequeños volcanes que usaba suavemente para cocinar cada mañana",
            tr: "Küçük dünyasında her sabah yemek pişirmek için nazikçe kullandığı iki küçük yanardağ vardı",
          },
          {
            ar: "كان ينظفهما بعناية كل أسبوع تمامًا كما ينظف المرء مدخنة",
            es: "Los limpiaba con cuidado cada semana, tal como uno limpia una chimenea",
            tr: "Tıpkı bir bacayı temizler gibi onları her hafta dikkatle temizliyordu",
          },
          {
            ar: "أحب مشاهدة الغروب ورآه مرة أربعًا وأربعين مرة في يوم واحد",
            es: "Le encantaba mirar el atardecer, y una vez lo vio cuarenta y cuatro veces en un solo día",
            tr: "Gün batımını izlemeyi çok severdi ve bir keresinde tek bir günde kırk dört kez izlemişti",
          },
          {
            ar: "أدرك الطيار تدريجيًا أن هذا الزائر الغريب كان بالفعل أميرًا من عالم آخر",
            es: "El piloto se dio cuenta poco a poco de que aquel extraño visitante era realmente un príncipe de otro mundo",
            tr: "Pilot yavaş yavaş bu garip ziyaretçinin gerçekten başka bir dünyadan gelen bir prens olduğunu fark etti",
          },
        ],
      },
      {
        title: { ar: "الوردة", es: "La rosa", tr: "Gül" },
        sentences: [
          {
            ar: "نبتت على كوكبه وردة واحدة فخورة ومتطلبة أحبها بعمق",
            es: "En su planeta crecía una única rosa orgullosa y bastante exigente a la que amaba profundamente",
            tr: "Gezegeninde derinden sevdiği, gururlu ve oldukça talepkar tek bir gül yetişiyordu",
          },
          {
            ar: "ظهرت فجأة من بذرة وتفتحت بجمال مذهل ودقيق",
            es: "Había aparecido de repente de una semilla y florecido con una belleza asombrosa y delicada",
            tr: "Bir tohumdan aniden çıkmış ve şaşırtıcı, narin bir güzellikle açmıştı",
          },
          {
            ar: "تباهت الوردة بجمالها وبالغت غالبًا في شكاوى خيالية صغيرة",
            es: "La rosa presumía de su belleza y a menudo exageraba pequeñas quejas imaginarias",
            tr: "Gül güzelliğiyle övünüyor ve sık sık küçük, hayali şikayetleri abartıyordu",
          },
          {
            ar: "سعلت بشكل مسرحي وادّعت أن التيارات الهوائية والنمور خطر دائم عليها",
            es: "Tosía dramáticamente y afirmaba que las corrientes de aire y los tigres eran un peligro constante para ella",
            tr: "Dramatik bir şekilde öksürüyor ve rüzgar akımlarıyla kaplanların kendisi için sürekli bir tehlike olduğunu iddia ediyordu",
          },
          {
            ar: "اعتنى بها الأمير بصبر حتى عندما كان كبرياؤها يثير استياءه باستمرار",
            es: "El príncipe la cuidaba con paciencia, incluso cuando su orgullo lo frustraba constantemente",
            tr: "Prens, gururu onu sürekli sinirlendirse bile onunla sabırla ilgileniyordu",
          },
          {
            ar: "سقاها وحماها من الريح وأعجب بها أكثر مما قاله بصوت مسموع",
            es: "La regaba, la protegía del viento y la admiraba más de lo que jamás dijo en voz alta",
            tr: "Onu suluyor, rüzgardan koruyor ve yüksek sesle söylediğinden çok daha fazla hayranlık duyuyordu",
          },
          {
            ar: "جريحًا من تعليق قاسٍ بشكل خاص قرر في النهاية مغادرة كوكبه",
            es: "Herido por un comentario especialmente cruel, finalmente decidió abandonar su planeta",
            tr: "Özellikle acımasız bir söz onu incittiğinde sonunda gezegenini terk etmeye karar verdi",
          },
          {
            ar: "أدرك لاحقًا أنه ما زال يحبها بعمق رغم طبيعتها الفخورة الصعبة",
            es: "Más tarde comprendió que seguía amándola profundamente, a pesar de su difícil naturaleza orgullosa",
            tr: "Daha sonra, zor ve gururlu doğasına rağmen onu hâlâ derinden sevdiğini anladı",
          },
        ],
      },
      {
        title: { ar: "الملك", es: "El rey", tr: "Kral" },
        sentences: [
          {
            ar: "متنقلًا بين الكواكب زار الأمير ملكًا لا يحكم أحدًا على الإطلاق",
            es: "Viajando entre planetas, el príncipe visitó a un rey que no gobernaba absolutamente a nadie",
            tr: "Gezegenler arasında yolculuk eden prens, hiç kimseye hükmetmeyen bir kralı ziyaret etti",
          },
          {
            ar: "كانت مملكته بأكملها كوكبًا صغيرًا واحدًا بالكاد يتسع لعرشه",
            es: "Todo su reino era un único planeta diminuto que apenas tenía espacio para su trono",
            tr: "Tüm krallığı, tahtına zar zor yer bulunan tek bir minik gezegendi",
          },
          {
            ar: "أصرّ الملك على أن كل شيء في الكون يطيع أوامره الملكية",
            es: "El rey insistía en que todo en el universo obedecía sus órdenes reales",
            tr: "Kral, evrendeki her şeyin kraliyet emirlerine itaat ettiğinde ısrar ediyordu",
          },
          {
            ar: "ادّعى بفخر السلطة حتى على النجوم والشمس والسماء اللامتناهية",
            es: "Reclamaba con orgullo autoridad incluso sobre las estrellas, el sol y el cielo infinito",
            tr: "Yıldızlar, güneş ve sonsuz gökyüzü üzerinde bile gururla otorite iddia ediyordu",
          },
          {
            ar: "كان بذكاء لا يأمر إلا بما هو مؤكد الحدوث أصلًا",
            es: "Con astucia, solo ordenaba cosas que ya estaban destinadas a suceder de todos modos",
            tr: "Kurnazca, yalnızca zaten olması kesin olan şeyleri emrediyordu",
          },
          {
            ar: "وبهذه الطريقة لم يضطر أبدًا للاعتراف بأن أوامره الملكية قد تفشل",
            es: "De este modo, nunca tuvo que admitir que sus órdenes reales pudieran fallar",
            tr: "Bu şekilde kraliyet emirlerinin başarısız olabileceğini asla kabul etmek zorunda kalmadı",
          },
          {
            ar: "وجد الأمير سلطة الملك الفارغة الوحيدة غريبة ومحزنة إلى حد ما",
            es: "El príncipe encontró la vacía y solitaria autoridad del rey extraña y bastante triste",
            tr: "Prens, kralın boş ve yalnız otoritesini tuhaf ve oldukça üzücü buldu",
          },
          {
            ar: "غادر بسرعة مستنتجًا أن البالغين غريبو الأطوار حقًا",
            es: "Se marchó rápidamente, concluyendo que los adultos eran realmente muy peculiares",
            tr: "Yetişkinlerin gerçekten çok tuhaf olduğu sonucuna vararak hızla ayrıldı",
          },
        ],
      },
      {
        title: {
          ar: "الرجل المتباهي والسكير",
          es: "El hombre vanidoso y el borracho",
          tr: "Kibirli Adam ve Sarhoş",
        },
        sentences: [
          {
            ar: "ضم الكوكب التالي رجلًا متباهيًا لا يريد سوى الإعجاب والثناء المستمر",
            es: "El siguiente planeta albergaba a un hombre vanidoso que solo quería elogios y admiración constantes",
            tr: "Sonraki gezegende sadece sürekli övgü ve hayranlık isteyen kibirli bir adam vardı",
          },
          {
            ar: "كان يرتدي قبعة أنيقة فقط ليرفعها كلما صفّق له أحد",
            es: "Llevaba un sombrero elegante solo para poder quitárselo cada vez que alguien lo aplaudía",
            tr: "Sadece biri onu alkışladığında şapkasını çıkarabilmek için şık bir şapka takıyordu",
          },
          {
            ar: "طلب من الأمير أن يصفق فقط ليتمكن من رفع قبعته بفخر",
            es: "Le pidió al príncipe que aplaudiera solo para poder quitarse el sombrero con orgullo",
            tr: "Gururla şapkasını çıkarabilmek için prensten sadece alkışlamasını istedi",
          },
          {
            ar: "صفّق الأمير بأدب رغم أنه لم يفهم ما يريده الرجل حقًا",
            es: "El príncipe aplaudió cortésmente, aunque no entendía qué quería realmente aquel hombre",
            tr: "Prens, adamın gerçekte ne istediğini anlamasa da kibarca alkışladı",
          },
          {
            ar: "ضم كوكب آخر سكيرًا يشرب فقط لينسى عار الشرب",
            es: "Otro planeta albergaba a un borracho que bebía solo para olvidar la vergüenza de beber",
            tr: "Başka bir gezegende içmenin utancını unutmak için içen bir sarhoş vardı",
          },
          {
            ar: "استمر منطقه الحزين يدور ويدور دون أي مخرج على الإطلاق",
            es: "Su triste razonamiento giraba en círculos sin ninguna salida en absoluto",
            tr: "Onun hüzünlü mantığı hiçbir çıkışı olmadan durmadan dönüp duruyordu",
          },
          {
            ar: "وجد الأمير كلا البالغين حزينين ومربكين للغاية في عاداتهما الصغيرة",
            es: "El príncipe encontró a ambos adultos tristes y bastante confusos en sus pequeños hábitos",
            tr: "Prens her iki yetişkini de üzücü ve küçük alışkanlıklarıyla oldukça kafa karıştırıcı buldu",
          },
          {
            ar: "واصل رحلته أكثر حيرة من أي وقت مضى من عالم البالغين الغريب",
            es: "Continuó su viaje más desconcertado que nunca por el extraño mundo de los adultos",
            tr: "Yolculuğuna, yetişkinlerin garip dünyasına her zamankinden daha şaşkın bir şekilde devam etti",
          },
        ],
      },
      {
        title: {
          ar: "رجل الأعمال ومضيء الفوانيس",
          es: "El hombre de negocios y el farolero",
          tr: "İş Adamı ve Fener Yakıcı",
        },
        sentences: [
          {
            ar: "قضى رجل أعمال كل لحظة يقظته في عد نجوم زعم أنه يملكها شخصيًا",
            es: "Un hombre de negocios pasaba cada momento despierto contando estrellas que afirmaba poseer personalmente",
            tr: "Bir iş adamı, kişisel olarak sahip olduğunu iddia ettiği yıldızları sayarak her uyanık anını geçiriyordu",
          },
          {
            ar: "كان يكتب كل رقم بعناية على ورقة ويقفل الورقة داخل درج",
            es: "Anotaba cada número con cuidado en un papel y guardaba el papel bajo llave en un cajón",
            tr: "Her sayıyı dikkatle bir kağıda yazıyor ve kağıdı bir çekmecede kilit altında tutuyordu",
          },
          {
            ar: "تساءل الأمير عن الفائدة العملية من امتلاك نجوم بعيدة",
            es: "El príncipe se preguntó qué utilidad práctica podía tener poseer estrellas lejanas",
            tr: "Prens, uzak yıldızlara sahip olmanın ne gibi pratik bir faydası olabileceğini merak etti",
          },
          {
            ar: "أجاب رجل الأعمال فقط أن امتلاكها يجعله مهمًا وثريًا جدًا",
            es: "El hombre de negocios solo respondió que poseerlas lo hacía importante y muy rico",
            tr: "İş adamı sadece bunlara sahip olmanın kendisini önemli ve çok zengin kıldığını söyledi",
          },
          {
            ar: "في كوكب صغير كان مضيء الفوانيس يضيء ويطفئ فانوسه كل دقيقة",
            es: "En un pequeño planeta, un farolero encendía y apagaba su farol cada minuto",
            tr: "Küçük bir gezegende bir fener yakıcı her dakika fenerini yakıp söndürüyordu",
          },
          {
            ar: "كان كوكبه يدور بسرعة كبيرة لدرجة أن الليل والنهار يتعاقبان خلال لحظات",
            es: "Su planeta giraba tan rápido que el día y la noche llegaban en cuestión de instantes",
            tr: "Gezegeni o kadar hızlı dönüyordu ki gündüz ve gece saniyeler içinde birbirini takip ediyordu",
          },
          {
            ar: "من بين كل البالغين الذين قابلهم احترم الأمير إخلاص مضيء الفوانيس أكثر من غيره",
            es: "De todos los adultos que había conocido, el príncipe respetaba más la lealtad del farolero",
            tr: "Tanıdığı tüm yetişkinler arasında prens en çok fener yakıcının sadakatine saygı duydu",
          },
          {
            ar: "كان مضيء الفوانيس على الأقل يعمل بإخلاص من أجل شيء يتجاوز ذاته",
            es: "El farolero al menos trabajaba fielmente por algo más allá de sí mismo",
            tr: "Fener yakıcı en azından kendisinin ötesinde bir şey için sadakatle çalışıyordu",
          },
        ],
      },
      {
        title: { ar: "الوصول إلى الأرض", es: "Llegada a la Tierra", tr: "Dünya'ya Varış" },
        sentences: [
          {
            ar: "هبط الأمير أخيرًا وحيدًا في صحراء كوكب الأرض الشاسعة غير المألوفة",
            es: "El príncipe finalmente aterrizó solo en el vasto y desconocido desierto del planeta Tierra",
            tr: "Prens sonunda Dünya gezegeninin uçsuz bucaksız, tanıdık olmayan çölüne tek başına indi",
          },
          {
            ar: "توقع أن يلتقي بأشخاص فورًا لكنه لم يجد سوى رمال صامتة خالية",
            es: "Esperaba encontrarse con gente de inmediato, pero solo halló arena vacía y silenciosa",
            tr: "Hemen insanlarla karşılaşmayı bekliyordu ama sadece sessiz, boş kumlar buldu",
          },
          {
            ar: "تحدث إليه ثعبان أصفر ملمّحًا بهدوء أنه يستطيع إعادته إلى دياره",
            es: "Una serpiente amarilla le habló, insinuando con calma que podía enviarlo de regreso a casa",
            tr: "Sarı bir yılan onunla konuştu ve onu evine gönderebileceğini sakince ima etti",
          },
          {
            ar: "كان صوته هادئًا وغامضًا كأنه أقدم من الصحراء نفسها",
            es: "Su voz era tranquila y enigmática, como si fuera más antigua que el propio desierto",
            tr: "Sesi sakin ve bilmece gibiydi, sanki çölün kendisinden bile daha eskiydi",
          },
          {
            ar: "أثناء تجواله اكتشف حديقة كاملة مليئة بورود تشبه ورده تمامًا",
            es: "Mientras vagaba, descubrió un jardín entero lleno de rosas idénticas a la suya",
            tr: "Dolaşırken tamamen kendi gülüne benzeyen güllerle dolu koca bir bahçe keşfetti",
          },
          {
            ar: "تفتحت هناك خمسة آلاف زهرة متطابقة دون أن تكون أي منها فريدة حقًا",
            es: "Allí florecían cinco mil flores idénticas, sin que ninguna fuera realmente única",
            tr: "Orada, hiçbiri gerçekten benzersiz olmayan beş bin özdeş çiçek açmıştı",
          },
          {
            ar: "شعر فجأة بانكسار قلبه معتقدًا أن ورده الحبيبة لم تكن فريدة حقًا أبدًا",
            es: "De pronto se sintió desconsolado, creyendo que su amada rosa nunca había sido realmente única",
            tr: "Sevgili gülünün aslında hiç benzersiz olmadığına inanarak aniden kalbi kırıldı",
          },
          {
            ar: "عندئذ ظهر ثعلب هادئ وذكي وعرض عليه حكمة غير متوقعة",
            es: "Justo entonces apareció un zorro tranquilo y astuto que le ofreció una sabiduría inesperada",
            tr: "Tam o sırada sakin, zeki bir tilki belirdi ve ona beklenmedik bir bilgelik sundu",
          },
        ],
      },
      {
        title: { ar: "سر الثعلب", es: "El secreto del zorro", tr: "Tilkinin Sırrı" },
        sentences: [
          {
            ar: "طلب الثعلب من الأمير أن يروّضه بلطف بزيارته في الساعة نفسها كل يوم",
            es: "El zorro le pidió al príncipe que lo domesticara con suavidad visitándolo a la misma hora cada día",
            tr: "Tilki, prensten kendisini her gün aynı saatte ziyaret ederek nazikçe evcilleştirmesini istedi",
          },
          {
            ar: "أوضح أن الترويض يعني خلق روابط خفية حقيقية بين قلبين ببطء",
            es: "Explicó que domesticar significaba crear lentamente lazos invisibles y reales entre dos corazones",
            tr: "Evcilleştirmenin, iki kalp arasında yavaşça gerçek, görünmez bağlar oluşturmak anlamına geldiğini açıkladı",
          },
          {
            ar: "من خلال الصبر والروتين أوضح الثعلب أن رابطًا خفيًا حقيقيًا يتشكل ببطء",
            es: "A través de la paciencia y la rutina, el zorro explicó que un vínculo invisible y real se forma lentamente",
            tr: "Sabır ve düzen sayesinde tilki, gerçek, görünmez bir bağın yavaşça oluştuğunu açıkladı",
          },
          {
            ar: "كان الثعلب يزداد حماسًا قليلًا كل يوم كلما اقتربت الساعة المعتادة",
            es: "El zorro se emocionaba un poco más cada día a medida que se acercaba la hora habitual",
            tr: "Alışılmış saat yaklaştıkça tilki her gün biraz daha heyecanlanıyordu",
          },
          {
            ar: "بعد الترويض أوضح الثعلب أن لون حقول القمح سيذكّره دائمًا بالأمير",
            es: "Una vez domesticado, el zorro explicó que el color de los campos de trigo siempre le recordaría al príncipe",
            tr: "Evcilleştikten sonra tilki, buğday tarlalarının renginin kendisine her zaman prensi hatırlatacağını açıkladı",
          },
          {
            ar: "قال إن الريح في القمح الذهبي ستبدو للأبد وكأنها ضحكة الأمير نفسه",
            es: "Dijo que el viento en el trigo dorado sonaría para siempre como la risa del propio príncipe",
            tr: "Altın rengi buğdaydaki rüzgarın sonsuza dek prensin kendi kahkahası gibi duyulacağını söyledi",
          },
          {
            ar: "شارك الثعلب سره وهو أن ما هو أساسي حقًا غير مرئي للعين",
            es: "El zorro compartió su secreto: lo verdaderamente esencial es invisible a los ojos",
            tr: "Tilki sırrını paylaştı: gerçekten önemli olan şey gözle görülemez",
          },
          {
            ar: "أدرك الأمير أخيرًا أن ورده كانت فريدة لأنه أحبها ببساطة",
            es: "El príncipe finalmente comprendió que su rosa era única simplemente porque él la había amado",
            tr: "Prens sonunda gülünün, onu sevdiği için benzersiz olduğunu anladı",
          },
        ],
      },
      {
        title: { ar: "العودة إلى الديار", es: "El regreso a casa", tr: "Eve Dönüş" },
        sentences: [
          {
            ar: "أصلح الطيار طائرته أخيرًا بعد أيام عديدة عالقًا معًا في الصحراء",
            es: "El piloto finalmente reparó su avión tras varios días varados juntos en el desierto",
            tr: "Pilot, çölde birlikte mahsur kaldıkları birçok günün ardından sonunda uçağını tamir etti",
          },
          {
            ar: "أصبح الماء شحيحًا بشكل خطير بينما اقتربت مغامرتهما الصغيرة المشتركة من نهايتها",
            es: "El agua escaseaba peligrosamente mientras su pequeña aventura compartida llegaba a su fin",
            tr: "Paylaştıkları küçük macera sona ererken su tehlikeli bir şekilde azalıyordu",
          },
          {
            ar: "أوضح الأمير بحزن أن جسده ثقيل جدًا ليُحمل عائدًا إلى نجمه",
            es: "El príncipe explicó con tristeza que su cuerpo era demasiado pesado para llevarlo de vuelta a su estrella",
            tr: "Prens üzülerek vücudunun yıldızına geri taşınamayacak kadar ağır olduğunu açıkladı",
          },
          {
            ar: "وعد بلطف أنه سيبدو وكأنه يضحك بين النجوم كل ليلة",
            es: "Prometió con dulzura que parecería reír entre las estrellas cada noche",
            tr: "Her gece yıldızların arasında gülüyormuş gibi görüneceğine nazikçe söz verdi",
          },
          {
            ar: "ترك الثعبان الأصفر يعضه برفق حتى تستطيع روحه وحدها العودة إلى الديار",
            es: "Dejó que la serpiente amarilla lo mordiera suavemente para que su espíritu solo pudiera regresar a casa",
            tr: "Ruhunun tek başına evine dönebilmesi için sarı yılanın kendisini nazikçe ısırmasına izin verdi",
          },
          {
            ar: "سقط دون صوت بلطف كما تسقط شجرة ببطء في الرمال",
            es: "Cayó sin un solo sonido, con suavidad, como cae lentamente un árbol en la arena",
            tr: "Kumda yavaşça düşen bir ağaç gibi sessizce, yumuşak bir şekilde yere yığıldı",
          },
          {
            ar: "حزن الطيار بعمق لكنه أدرك أن هذا الوداع الأخير الهادئ كان لا بد أن يحدث",
            es: "El piloto se entristeció profundamente, pero comprendió que aquella despedida silenciosa tenía que suceder",
            tr: "Pilot derinden üzüldü ama bu son sessiz vedanın gerçekleşmesi gerektiğini anladı",
          },
          {
            ar: "بعد سنوات لا يزال يراقب النجوم بحنان متذكرًا صديقه الصغير الرائع",
            es: "Años después, todavía mira las estrellas con cariño, recordando a su pequeño y extraordinario amigo",
            tr: "Yıllar sonra hâlâ küçük, olağanüstü arkadaşını hatırlayarak yıldızları sevgiyle izliyor",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-1984",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة جورج أورويل عن تمرد وينستون سميث الهادئ ضد حزب يسيطر على الحقيقة ذاتها — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de George Orwell sobre la silenciosa rebelión de Winston Smith contra un Partido que controla la verdad misma — un relato personal, no el texto original.",
      tr: "George Orwell'ın, gerçeğin kendisini kontrol eden bir Parti'ye karşı Winston Smith'in sessiz isyanı hakkındaki hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: { ar: "الحياة في أوقيانوسيا", es: "La vida en Oceanía", tr: "Okyanusya'da Hayat" },
        sentences: [
          {
            ar: "عاش وينستون سميث في مدينة رمادية تراقبها باستمرار ملصقات الأخ الكبير",
            es: "Winston Smith vivía en una ciudad gris vigilada constantemente por carteles del Gran Hermano",
            tr: "Winston Smith, Büyük Birader'in posterleri tarafından sürekli izlenen gri bir şehirde yaşıyordu",
          },
          {
            ar: "بدا أن كل جدار يحمل العينين الضخمتين نفسيهما والشعارات القاتمة الثلاثة نفسها",
            es: "Cada pared parecía llevar los mismos ojos enormes y los mismos tres lemas sombríos",
            tr: "Her duvar aynı devasa gözleri ve aynı üç kasvetli sloganı taşıyor gibiydi",
          },
          {
            ar: "راقبت شاشات التلفزة في كل غرفة المواطنين ليل نهار دون أي خصوصية حقيقية",
            es: "Telepantallas en cada habitación vigilaban a los ciudadanos día y noche sin verdadera privacidad",
            tr: "Her odadaki tele-ekranlar, gerçek bir mahremiyet olmadan gece gündüz vatandaşları izliyordu",
          },
          {
            ar: "حتى في شقته الخاصة لم يستطع وينستون أن يتأكد تمامًا من أنه وحده",
            es: "Incluso en su propio apartamento, Winston nunca podía estar del todo seguro de estar solo",
            tr: "Kendi dairesinde bile Winston yalnız olduğundan asla tam olarak emin olamıyordu",
          },
          {
            ar: "سيطر الحزب الحاكم على كل جزء تقريبًا من الحياة اليومية والكلام بل والفكر ذاته",
            es: "El Partido gobernante controlaba casi todos los aspectos de la vida diaria, el habla e incluso el pensamiento mismo",
            tr: "İktidardaki Parti, günlük yaşamın, konuşmanın ve hatta düşüncenin kendisinin neredeyse her yönünü kontrol ediyordu",
          },
          {
            ar: "حتى تعبير وجه مريب وحده يمكن أن يُبلّغ عنه كجريمة فكر خطيرة",
            es: "Incluso una sola expresión facial sospechosa podía denunciarse como un grave crimental",
            tr: "Şüpheli tek bir yüz ifadesi bile ciddi bir düşünce suçu olarak ihbar edilebilirdi",
          },
          {
            ar: "راقب الجيران جيرانهم وتعلم الأطفال أن يبلّغوا عن آبائهم أنفسهم",
            es: "Los vecinos vigilaban a los vecinos y a los niños se les enseñaba a delatar a sus propios padres",
            tr: "Komşular komşuları izliyor, çocuklara kendi ebeveynlerini ihbar etmeleri öğretiliyordu",
          },
          {
            ar: "كره وينستون الحزب بهدوء رغم أنه تعلم ألا يُظهر ذلك أبدًا",
            es: "Winston odiaba en silencio al Partido, aunque había aprendido a no demostrarlo nunca",
            tr: "Winston Parti'den sessizce nefret ediyordu, ama bunu asla göstermemeyi öğrenmişti",
          },
        ],
      },
      {
        title: { ar: "وزارة الحقيقة", es: "El Ministerio de la Verdad", tr: "Hakikat Bakanlığı" },
        sentences: [
          {
            ar: "عمل وينستون في وزارة الحقيقة يعيد كتابة الصحف القديمة لتوافق الأكاذيب الجديدة",
            es: "Winston trabajaba en el Ministerio de la Verdad reescribiendo viejos periódicos para ajustarlos a las nuevas mentiras",
            tr: "Winston, Hakikat Bakanlığı'nda eski gazeteleri yeni yalanlara uyacak şekilde yeniden yazarak çalışıyordu",
          },
          {
            ar: "كل يوم كان يجلب كومة جديدة من الوثائق تحتاج إلى تصحيح هادئ وحذر",
            es: "Cada día traía una nueva pila de documentos que necesitaban una corrección silenciosa y cuidadosa",
            tr: "Her gün sessiz ve dikkatli bir düzeltme gerektiren yeni bir belge yığını geliyordu",
          },
          {
            ar: "كلما غيّر الحزب روايته أُعيدت كتابة الماضي بهدوء ليتوافق معها",
            es: "Cada vez que el Partido cambiaba su versión de los hechos, el pasado se reescribía silenciosamente para coincidir",
            tr: "Parti hikayesini her değiştirdiğinde, geçmiş sessizce ona uyacak şekilde yeniden yazılıyordu",
          },
          {
            ar: "يمكن لعدو الأمس أن يصبح بطل اليوم بجملة واحدة مُعدَّلة",
            es: "Un enemigo de ayer podía convertirse en un héroe de hoy con una sola frase editada",
            tr: "Dünün düşmanı, düzenlenmiş tek bir cümleyle bugünün kahramanına dönüşebiliyordu",
          },
          {
            ar: "اختفت الحقائق التاريخية والأرقام والأسماء الشهيرة لحظة أن أصبحت غير مريحة",
            es: "Hechos históricos, cifras y nombres famosos desaparecían en cuanto resultaban inconvenientes",
            tr: "Tarihsel gerçekler, rakamlar ve ünlü isimler rahatsız edici hale geldikleri anda kayboluyordu",
          },
          {
            ar: "بدا أن أشخاصًا بأكملهم يختفون من التاريخ وكأنهم لم يوجدوا قط",
            es: "Personas enteras parecían desaparecer de la historia como si nunca hubieran existido",
            tr: "Bütün insanlar sanki hiç var olmamış gibi tarihten silinip gidiyordu",
          },
          {
            ar: "فهم وينستون الشعار المزعج للحزب بأن من يتحكم بالماضي يتحكم بالمستقبل",
            es: "Winston entendía el inquietante lema del Partido: quien controla el pasado controla el futuro",
            tr: "Winston, Parti'nin rahatsız edici sloganını anlıyordu: geçmişi kontrol eden geleceği kontrol eder",
          },
          {
            ar: "سرًا ملأته إعادة الكتابة المستمرة هذه للحقيقة بغضب هادئ متزايد",
            es: "En secreto, esta constante reescritura de la verdad lo llenaba de una ira silenciosa y creciente",
            tr: "Gizlice, gerçeğin bu sürekli yeniden yazımı içinde sessiz, büyüyen bir öfke oluşturuyordu",
          },
        ],
      },
      {
        title: { ar: "مذكرات محظورة", es: "Un diario prohibido", tr: "Yasak Bir Günlük" },
        sentences: [
          {
            ar: "اشترى وينستون دفتر ملاحظات محظورًا صغيرًا ليسجل سرًا أفكاره الحقيقية الخاصة",
            es: "Winston compró un pequeño cuaderno prohibido para registrar en secreto sus verdaderos pensamientos privados",
            tr: "Winston, gerçek özel düşüncelerini gizlice kaydetmek için küçük yasak bir defter satın aldı",
          },
          {
            ar: "أخفاه بعناية في زاوية صغيرة بعيدًا عن مدى شاشة التلفزة الرقيب",
            es: "Lo escondió cuidadosamente en un pequeño hueco, fuera del alcance vigilante de una telepantalla",
            tr: "Onu bir tele-ekranın gözetleyici menzilinin dışındaki küçük bir girintiye dikkatle sakladı",
          },
          {
            ar: "اعتُبرت كتابة أي شيء شخصي على الإطلاق جريمة خطيرة وخطرة للغاية",
            es: "Escribir algo personal se consideraba un delito grave y extremadamente peligroso",
            tr: "Herhangi bir kişisel şey yazmak, ciddi ve son derece tehlikeli bir suç sayılıyordu",
          },
          {
            ar: "ارتجفت يده أول مرة لامس فيها القلم الصفحة الفارغة المنتظرة",
            es: "Su mano tembló la primera vez que apoyó la pluma sobre la página en blanco que lo esperaba",
            tr: "Kalemi bekleyen boş sayfaya ilk değdirdiğinde eli titredi",
          },
          {
            ar: "كتب الكلمات مع الأخ الكبير وهو يرتجف من الخوف وهو يفعل ذلك",
            es: "Escribió las palabras abajo el Gran Hermano temblando de miedo mientras lo hacía",
            tr: "Kâhrolsun Büyük Birader kelimelerini bunu yaparken korkudan titreyerek yazdı",
          },
          {
            ar: "بمجرد كتابتها بدت الكلمات مستحيلة الاسترجاع أو المحو تمامًا أبدًا",
            es: "Una vez escritas, las palabras parecían imposibles de retirar o borrar por completo",
            tr: "Bir kez yazıldığında kelimeler geri alınması veya tamamen silinmesi imkansız gibi görünüyordu",
          },
          {
            ar: "مجرد امتلاك المذكرات وحده كان قد يؤدي في النهاية إلى اعتقاله أو أسوأ",
            es: "El solo hecho de poseer el diario podía llevarlo eventualmente a su arresto o algo peor",
            tr: "Sadece günlüğe sahip olmak bile onu sonunda tutuklanmaya ya da daha kötüsüne götürebilirdi",
          },
          {
            ar: "ومع ذلك شعر بإحساس هش وضئيل بالحرية أخيرًا في كونه صادقًا",
            es: "Aun así, sintió una frágil y pequeña sensación de libertad al finalmente ser honesto",
            tr: "Yine de sonunda dürüst olmakta kırılgan, küçük bir özgürlük hissi buldu",
          },
        ],
      },
      {
        title: { ar: "جوليا", es: "Julia", tr: "Julia" },
        sentences: [
          {
            ar: "دسّت شابة تُدعى جوليا سرًا لوينستون رسالة تقول أحبك",
            es: "Una joven llamada Julia le deslizó en secreto a Winston una nota que decía te quiero",
            tr: "Julia adında genç bir kadın gizlice Winston'a seni seviyorum yazan bir not tutuşturdu",
          },
          {
            ar: "خفق قلبه بقوة وهو يقرأ الرسالة المخبأة داخل قبضته المغلقة",
            es: "Su corazón latió con fuerza mientras leía el mensaje escondido dentro de su puño cerrado",
            tr: "Kapalı yumruğunun içinde saklı mesajı okurken kalbi güçlü atıyordu",
          },
          {
            ar: "بدآ يلتقيان في زوايا خفية هادئة بعيدًا عن عين أي شاشة تلفزة مراقبة",
            es: "Comenzaron a encontrarse en rincones ocultos y silenciosos, lejos de la mirada vigilante de cualquier telepantalla",
            tr: "Herhangi bir tele-ekranın gözetleyici bakışından uzak, gizli ve sessiz köşelerde buluşmaya başladılar",
          },
          {
            ar: "أصبحت سوق مزدحمة وأطلال كنيسة هادئة وغرفة مستأجرة كلها مخابئ حذرة",
            es: "Un mercado abarrotado, las ruinas silenciosas de una iglesia y una habitación alquilada se convirtieron todos en cuidadosos escondites",
            tr: "Kalabalık bir pazar, sessiz bir kilise harabesi ve kiralık bir oda hepsi dikkatli saklanma yerleri oldu",
          },
          {
            ar: "تمردت جوليا على الحزب بطريقتها الجسدية الهادئة والمتحدية الخاصة",
            es: "Julia se rebelaba contra el Partido a su propia manera, silenciosa, física y desafiante",
            tr: "Julia, Parti'ye kendi sessiz, bedensel ve meydan okuyan tarzıyla karşı geliyordu",
          },
          {
            ar: "بدت بلا خوف بطريقة كاد وينستون ينسى أنها ممكنة على الإطلاق",
            es: "Parecía intrépida de una manera que Winston casi había olvidado que fuera posible",
            tr: "Winston'ın neredeyse mümkün olduğunu unuttuğu bir şekilde korkusuz görünüyordu",
          },
          {
            ar: "بدت رومانسيتهما المحظورة وكأنها فعل صغير وخطير من الحرية الإنسانية الحقيقية",
            es: "Su romance prohibido se sentía como un pequeño y peligroso acto de auténtica libertad humana",
            tr: "Yasak aşkları, gerçek insan özgürlüğüne dair küçük ve tehlikeli bir eylem gibi hissettiriyordu",
          },
          {
            ar: "شعر وينستون بحيوية أكبر مع جوليا مما شعر به في سنوات رمادية طويلة عديدة",
            es: "Winston se sentía más vivo con Julia de lo que se había sentido en muchos largos años grises",
            tr: "Winston, Julia ile birlikteyken uzun gri yıllardır hissetmediği kadar canlı hissediyordu",
          },
        ],
      },
      {
        title: { ar: "غرفة سرية", es: "Una habitación secreta", tr: "Gizli Bir Oda" },
        sentences: [
          {
            ar: "استأجر وينستون غرفة صغيرة فوق متجر قديم بدا خاليًا من أي شاشة تلفزة",
            es: "Winston alquiló una pequeña habitación sobre una vieja tienda que parecía no tener telepantalla",
            tr: "Winston, tele-ekranı olmayan gibi görünen eski bir dükkânın üzerinde küçük bir oda kiraladı",
          },
          {
            ar: "منحه الأثاث الباهت والساعة التي تدق شعورًا غريبًا باللطف والطراز القديم",
            es: "Los muebles desgastados y un reloj que hacía tictac le daban a la habitación una extraña sensación de dulzura anticuada",
            tr: "Solmuş mobilyalar ve tik tak sesi çıkaran bir saat odaya garip bir şekilde nazik, eski moda bir his veriyordu",
          },
          {
            ar: "التقيا هناك سرًا معتقدَين أنهما وجدا أخيرًا خصوصية حقيقية",
            es: "Se encontraban allí en secreto, creyendo que finalmente habían hallado verdadera privacidad",
            tr: "Sonunda gerçek bir mahremiyet bulduklarına inanarak orada gizlice buluşuyorlardı",
          },
          {
            ar: "لفترة عاشا بشكل شبه طبيعي يتشاركان الطعام والحديث والمودة الحقيقية",
            es: "Por un tiempo vivieron casi con normalidad, compartiendo comida, conversación y afecto genuino",
            tr: "Bir süre neredeyse normal bir şekilde yaşadılar, yemek, sohbet ve gerçek sevgiyi paylaştılar",
          },
          {
            ar: "تحدثا بصراحة عن أشياء صغيرة عادية لم يستطيعا ذكرها أبدًا في أي مكان آخر",
            es: "Hablaban abiertamente de pequeñas cosas ordinarias que nunca podrían mencionar en ningún otro lugar",
            tr: "Başka hiçbir yerde asla bahsedemeyecekleri küçük, sıradan şeylerden açıkça konuştular",
          },
          {
            ar: "بدأ وينستون يأمل بهدوء أن مقاومة الحزب ممكنة حقًا",
            es: "Winston comenzó a esperar en silencio que la resistencia contra el Partido fuera realmente posible",
            tr: "Winston, Parti'ye direnişin gerçekten mümkün olduğunu sessizce ummaya başladı",
          },
          {
            ar: "تخيل مستقبلًا بعيدًا لم يعد فيه هذا الخوف يحكم كل فكرة على الإطلاق",
            es: "Imaginó un futuro lejano donde ese miedo ya no gobernara cada pensamiento",
            tr: "O korkunun artık her düşünceye hükmetmediği uzak bir gelecek hayal etti",
          },
          {
            ar: "لم يدرك أي منهما بعد أن مخبأهما السري لم يكن آمنًا كما بدا",
            es: "Ninguno de los dos se dio cuenta aún de que su escondite secreto no era tan seguro como parecía",
            tr: "İkisi de gizli sığınaklarının göründüğü kadar güvenli olmadığını henüz fark etmemişti",
          },
        ],
      },
      {
        title: { ar: "فخ أوبراين", es: "La trampa de O'Brien", tr: "O'Brien'in Tuzağı" },
        sentences: [
          {
            ar: "لمّح مسؤول حزبي يُدعى أوبراين بأنه ينتمي سرًا إلى مجموعة مقاومة",
            es: "Un funcionario del Partido llamado O'Brien insinuó que pertenecía en secreto a un grupo de resistencia",
            tr: "O'Brien adında bir Parti yetkilisi gizlice bir direniş grubuna ait olduğunu ima etti",
          },
          {
            ar: "جعلت طريقته الهادئة الواثقة وينستون يثق به تقريبًا فورًا وتمامًا",
            es: "Su manera tranquila y segura hizo que Winston confiara en él casi de inmediato y por completo",
            tr: "Sakin, kendinden emin tavırları Winston'ın ona neredeyse anında ve tamamen güvenmesini sağladı",
          },
          {
            ar: "زاره وينستون وجوليا أملًا في الانضمام إلى المجموعة الغامضة المسماة الأخوية",
            es: "Winston y Julia lo visitaron esperando unirse al misterioso grupo llamado la Hermandad",
            tr: "Winston ve Julia, Kardeşlik adlı gizemli gruba katılmayı umarak onu ziyaret ettiler",
          },
          {
            ar: "سألهما أوبراين إن كانا مستعدين لارتكاب أي فعل على الإطلاق ضد الحزب",
            es: "O'Brien les preguntó si estaban dispuestos a cometer cualquier acto contra el Partido",
            tr: "O'Brien onlara Parti'ye karşı herhangi bir eylemi yapmaya istekli olup olmadıklarını sordu",
          },
          {
            ar: "أجابا بنعم على كل سؤال رهيب دون أي تردد على الإطلاق",
            es: "Respondieron que sí a cada terrible pregunta sin un solo momento de duda",
            tr: "Her korkunç soruya bir an bile tereddüt etmeden evet dediler",
          },
          {
            ar: "أعطى وينستون كتابًا محظورًا يشرح أساليب الحزب وأهدافه الحقيقية الخفية",
            es: "Le entregó a Winston un libro prohibido que explicaba los verdaderos métodos y objetivos ocultos del Partido",
            tr: "Winston'a Parti'nin gerçek, gizli yöntemlerini ve amaçlarını açıklayan yasak bir kitap verdi",
          },
          {
            ar: "أخفى وينستون الكتاب الثقيل الخطير بعناية تحت معطفه أثناء مغادرته",
            es: "Winston escondió cuidadosamente el pesado y peligroso libro bajo su abrigo al salir",
            tr: "Winston ayrılırken ağır, tehlikeli kitabı dikkatle paltosunun altına sakladı",
          },
          {
            ar: "وثق وينستون بأوبراين تمامًا دون أن يشك أبدًا أن هذه الثقة كانت في الحقيقة فخًا محكمًا",
            es: "Winston confió por completo en O'Brien, sin sospechar jamás que esa confianza era en realidad una trampa cuidadosa",
            tr: "Winston, O'Brien'a tamamen güvendi ve bu güvenin aslında dikkatle kurulmuş bir tuzak olduğundan asla şüphelenmedi",
          },
        ],
      },
      {
        title: { ar: "الكتاب", es: "El libro", tr: "Kitap" },
        sentences: [
          {
            ar: "أوضح الكتاب المحظور أن الحزب يسعى للسلطة من أجل ذاتها فقط بلا نهاية",
            es: "El libro prohibido explicaba que el Partido buscaba el poder solo por sí mismo, sin fin",
            tr: "Yasak kitap, Parti'nin gücü yalnızca kendisi için, sonsuz bir şekilde aradığını açıklıyordu",
          },
          {
            ar: "على عكس الاستبداد السابق لم يرغب بأي راحة أو تقدم بل بالسيطرة الكاملة الدائمة فقط",
            es: "A diferencia de las tiranías del pasado, no quería comodidad ni progreso, solo un control total y duradero",
            tr: "Geçmişteki tiranlıkların aksine, ne konfor ne de ilerleme istiyordu, sadece tam ve kalıcı bir kontrol",
          },
          {
            ar: "أوضح كيف أن الحرب المستمرة تسيطر على السكان المنهكين وتلهيهم",
            es: "Explicaba cómo una guerra constante controlaba y distraía a una población exhausta y agotada",
            tr: "Sürekli savaşın, yorgun ve tükenmiş bir nüfusu nasıl kontrol edip oyaladığını açıklıyordu",
          },
          {
            ar: "تغير الأعداء بين ليلة وضحاها ورغم ذلك استمرت الحرب نفسها بهدوء دائمًا",
            es: "Los enemigos cambiaban de la noche a la mañana, y sin embargo la guerra misma siempre continuaba en silencio",
            tr: "Düşmanlar bir gecede değişiyordu ama savaşın kendisi her zaman sessizce devam ediyordu",
          },
          {
            ar: "قرأ وينستون حتى ساعة متأخرة من الليل مدركًا أخيرًا كامل آلية اضطهاده",
            es: "Winston leyó hasta muy entrada la noche, comprendiendo por fin toda la maquinaria de su opresión",
            tr: "Winston gece geç saatlere kadar okudu ve sonunda kendi baskısının tüm mekanizmasını anladı",
          },
          {
            ar: "بدت كل صفحة جديدة تشرح خوفًا حمله دون أن يسمّيه أبدًا",
            es: "Cada nueva página parecía explicar algún miedo que había cargado sin nombrarlo jamás",
            tr: "Her yeni sayfa, hiç adlandırmadan taşıdığı bir korkuyu açıklıyor gibiydi",
          },
          {
            ar: "غفت جوليا بينما واصل هو القراءة متعطشًا للحقيقة التي طالما استشعرها",
            es: "Julia se quedó dormida mientras él seguía leyendo, hambriento de la verdad que siempre había presentido",
            tr: "O okumaya devam ederken Julia uykuya daldı, her zaman sezdiği gerçeğe susamıştı",
          },
          {
            ar: "للحظة قصيرة شعر فهم هذا النظام وكأنه شكل هادئ من أشكال القوة ذاتها",
            es: "Por un breve instante, comprender el sistema se sintió como su propia y silenciosa forma de poder",
            tr: "Kısa bir an için sistemi anlamak, kendi sessiz güç biçimi gibi hissettirdi",
          },
        ],
      },
      {
        title: { ar: "الخيانة", es: "Traición", tr: "İhanet" },
        sentences: [
          {
            ar: "اقتحمت شرطة الفكر المسلحة فجأة غرفتهما السرية الخفية دون أي إنذار",
            es: "La Policía del Pensamiento armada irrumpió de repente en su habitación secreta sin previo aviso",
            tr: "Silahlı Düşünce Polisi, hiçbir uyarı yapmadan aniden gizli odalarına daldı",
          },
          {
            ar: "أعلن صوت من خلف لوحة قديمة بهدوء أنهما أصبحا الآن من الأموات",
            es: "Una voz detrás de un viejo cuadro anunció con calma que ahora eran los muertos",
            tr: "Eski bir tablonun arkasından gelen bir ses, artık ölüler olduklarını sakince duyurdu",
          },
          {
            ar: "كشف السيد تشارينغتون صاحب المتجر عن نفسه بوصفه عميلًا لشرطة الفكر منذ البداية",
            es: "El señor Charrington, el tendero, se reveló como un agente de la Policía del Pensamiento desde el principio",
            tr: "Dükkân sahibi Bay Charrington, başından beri bir Düşünce Polisi ajanı olduğunu açığa çıkardı",
          },
          {
            ar: "تصلّب وجه مالكه اللطيف على الفور ليصبح باردًا ورسميًا تمامًا",
            es: "El rostro amable de su casero se endureció al instante hasta volverse frío y completamente oficial",
            tr: "Nazik ev sahibinin yüzü anında sertleşerek soğuk ve tamamen resmi bir hal aldı",
          },
          {
            ar: "أدرك وينستون بفزع أن أوبراين أيضًا لم يكن يومًا في صفهما حقًا",
            es: "Winston comprendió con horror que O'Brien tampoco había estado jamás realmente de su lado",
            tr: "Winston, O'Brien'ın da gerçekten hiç onların tarafında olmadığını dehşetle fark etti",
          },
          {
            ar: "كانت كل كلمة أمل نطق بها أوبراين مجرد جزء من الفخ ببساطة",
            es: "Cada palabra esperanzadora que O'Brien había pronunciado había sido simplemente parte de la trampa",
            tr: "O'Brien'ın söylediği her umutlu kelime basitçe tuzağın bir parçasıydı",
          },
          {
            ar: "سُحب وينستون وجوليا بعنف كل على حدة نحو وزارة الحب المرعبة",
            es: "Winston y Julia fueron arrastrados violentamente por separado hacia el aterrador Ministerio del Amor",
            tr: "Winston ve Julia, korkunç Sevgi Bakanlığı'na doğru ayrı ayrı ve şiddetle sürüklendiler",
          },
          {
            ar: "انهار كل ما بنياه سويًا سرًا في غضون دقائق قليلة مرعبة فقط",
            es: "Todo lo que habían construido juntos en secreto se derrumbó en solo unos pocos minutos aterradores",
            tr: "Birlikte gizlice inşa ettikleri her şey, sadece birkaç korkunç dakika içinde çöktü",
          },
        ],
      },
      {
        title: { ar: "الغرفة 101", es: "La habitación 101", tr: "101 Numaralı Oda" },
        sentences: [
          {
            ar: "في وزارة الحب أشرف أوبراين شخصيًا على استجواب وينستون الطويل والوحشي",
            es: "En el Ministerio del Amor, O'Brien supervisó personalmente el largo y brutal interrogatorio de Winston",
            tr: "Sevgi Bakanlığı'nda O'Brien, Winston'ın uzun ve acımasız sorgusunu bizzat yönetti",
          },
          {
            ar: "أنهك الألم والإرهاق والاستجواب اللانهائي ببطء آخر مقاومة لدى وينستون",
            es: "El dolor, el agotamiento y el interrogatorio interminable desgastaron lentamente la última resistencia de Winston",
            tr: "Acı, tükenmişlik ve bitmeyen sorgu, Winston'ın son direncini yavaşça aşındırdı",
          },
          {
            ar: "أوضح أن الحزب يريد إيمانًا كاملًا وليس مجرد طاعة صامتة مفروضة",
            es: "Explicó que el Partido quería creencia total, no simplemente obediencia silenciosa y forzada",
            tr: "Parti'nin sadece zorla dayatılan sessiz bir itaat değil, tam bir inanç istediğini açıkladı",
          },
          {
            ar: "قال إن اثنين زائد اثنين يجب أن يبدو حقًا خمسة لا أن يُردَّد فقط بصوت مسموع",
            es: "Dijo que dos más dos debía sentirse verdaderamente como cinco, no simplemente repetirse en voz alta",
            tr: "İki artı ikinin sadece yüksek sesle tekrarlanması değil, gerçekten beş gibi hissettirmesi gerektiğini söyledi",
          },
          {
            ar: "هُدد وينستون أخيرًا بالغرفة 101 التي تحوي مخاوفه الشخصية العميقة",
            es: "Finalmente amenazaron a Winston con la habitación 101, que contenía su peor miedo personal",
            tr: "Sonunda Winston, kendi en büyük kişisel korkusunu barındıran 101 numaralı oda ile tehdit edildi",
          },
          {
            ar: "اقترب قفص من الفئران ببطء بينما انهارت شجاعة وينستون تمامًا",
            es: "Una jaula de ratas se acercó lentamente mientras el coraje de Winston se derrumbaba por completo",
            tr: "Winston'ın cesareti tamamen çökerken bir fare kafesi yavaşça yaklaştı",
          },
          {
            ar: "في مواجهة ذلك الخوف الذي لا يُحتمل مباشرة انهار وينستون أخيرًا وخان جوليا تمامًا",
            es: "Al enfrentarse directamente a ese miedo insoportable, Winston finalmente se quebró y traicionó por completo a Julia",
            tr: "O dayanılmaz korkuyla doğrudan yüzleşince Winston sonunda çöktü ve Julia'ya tamamen ihanet etti",
          },
          {
            ar: "توسل بيأس أن يقع العقاب عليها بدلًا منه هو",
            es: "Suplicó desesperadamente que el castigo cayera sobre ella en lugar de sobre él mismo",
            tr: "Cezanın kendisi yerine ona uygulanması için çaresizce yalvardı",
          },
        ],
      },
      {
        title: {
          ar: "الانتصار على الذات",
          es: "Victoria sobre sí mismo",
          tr: "Kendine Karşı Zafer",
        },
        sentences: [
          {
            ar: "بعد إطلاق سراحه عاد وينستون إلى المجتمع شاعرًا بالفراغ ومتغيرًا عاطفيًا تمامًا",
            es: "Al ser liberado, Winston regresó a la sociedad sintiéndose vacío y completamente cambiado emocionalmente",
            tr: "Serbest bırakıldıktan sonra Winston, boşluk hissederek ve duygusal olarak tamamen değişmiş bir halde topluma döndü",
          },
          {
            ar: "مضى في أيامه دون أي شعور حقيقي متبقٍّ تجاه أي شيء على الإطلاق",
            es: "Se dejaba llevar por sus días sin sentimiento real que le quedara por nada en absoluto",
            tr: "Hiçbir şeye karşı gerçek bir duygusu kalmadan günlerini sürükleniyordu",
          },
          {
            ar: "التقى جوليا لفترة وجيزة مرة أخرى واعترفا ببرود بأن كلًا منهما خان الآخر",
            es: "Se encontró brevemente con Julia otra vez y ambos admitieron fríamente que se habían traicionado mutuamente",
            tr: "Julia ile kısaca tekrar karşılaştı ve ikisi de birbirlerine ihanet ettiklerini soğukça kabul etti",
          },
          {
            ar: "لم يستطع أي منهما أن يتذكر تمامًا لماذا اهتما ذات يوم بهذا العمق",
            es: "Ninguno de los dos podía recordar del todo por qué alguna vez se habían importado tan profundamente",
            tr: "İkisi de bir zamanlar neden bu kadar derinden önemsediklerini tam olarak hatırlayamadı",
          },
          {
            ar: "أمضى وينستون أيامه الفارغة الآن يشرب بهدوء في مقهى شبه مهجور",
            es: "Winston pasaba ahora sus días vacíos bebiendo tranquilamente en un café casi desierto",
            tr: "Winston artık boş günlerini neredeyse ıssız bir kafede sessizce içki içerek geçiriyordu",
          },
          {
            ar: "خدّر الجن القديم آخر بقايا الشعور التي كانت متبقية لديه",
            es: "La vieja ginebra adormecía los últimos rastros de sentimiento que aún le quedaban",
            tr: "Eski cin, kendisinde kalan son duygu izlerini uyuşturuyordu",
          },
          {
            ar: "وهو يراقب ملصقًا ضخمًا للأخ الكبير شعر أخيرًا بحب خالص تجاه الحزب فقط",
            es: "Mirando un enorme cartel del Gran Hermano, finalmente sintió solo amor por el Partido",
            tr: "Büyük Birader'in devasa bir posterini izlerken sonunda yalnızca Parti'ye karşı bir sevgi hissetti",
          },
          {
            ar: "تنتهي رواية 1984 بعقل وينستون وروحه المتبقية مهزومين تمامًا وبهدوء",
            es: "1984 termina con la mente y el espíritu restante de Winston completa y silenciosamente derrotados",
            tr: "1984, Winston'ın zihninin ve geriye kalan ruhunun tamamen ve sessizce yenilmesiyle sona erer",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-mockingbird",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة هاربر لي عن سكاوت فينش، ووالدها أتيكوس، ومحاكمة تكشف أعمق تحيز في بلدتها — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Harper Lee sobre Scout Finch, su padre Atticus, y un juicio que revela el prejuicio más profundo de su pueblo — un relato personal, no el texto original.",
      tr: "Harper Lee'nin, Scout Finch, babası Atticus ve kasabasının en derin önyargısını ortaya çıkaran bir duruşma hakkındaki hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: { ar: "سكاوت وجيم", es: "Scout y Jem", tr: "Scout ve Jem" },
        sentences: [
          {
            ar: "عاشت سكاوت فينش في بلدة مايكومب الصغيرة الهادئة بولاية ألاباما مع أخيها الأكبر جيم",
            es: "Scout Finch vivía en el somnoliento pueblo de Maycomb, Alabama, con su hermano mayor Jem",
            tr: "Scout Finch, Alabama'daki uykulu küçük Maycomb kasabasında ağabeyi Jem ile birlikte yaşıyordu",
          },
          {
            ar: "منحت الشوارع الغبارية الطويلة والشرفات القديمة البلدة بأكملها إيقاعًا بطيئًا هادئًا",
            es: "Las largas calles polvorientas y los viejos porches daban a todo el pueblo un ritmo lento y sosegado",
            tr: "Uzun tozlu sokaklar ve eski verandalar tüm kasabaya yavaş, sakin bir ritim veriyordu",
          },
          {
            ar: "كان والدهما أتيكوس محاميًا متأملًا ومحترمًا ربّاهما بمفرده في الغالب",
            es: "Su padre Atticus era un abogado reflexivo y respetado que los crió casi solo",
            tr: "Babaları Atticus, onları çoğunlukla tek başına büyüten, düşünceli ve saygın bir avukattı",
          },
          {
            ar: "كان يجيب حتى عن أغرب أسئلتهما بهدوء وبصدق تام دائمًا",
            es: "Respondía incluso a sus preguntas más extrañas con calma y siempre con total sinceridad",
            tr: "En garip sorularını bile sakin bir şekilde ve her zaman tamamen dürüstçe yanıtlıyordu",
          },
          {
            ar: "امتلأت فصول الصيف الحارة الطويلة بألعاب خيالية وفضول طفولي بلا نهاية",
            es: "Los largos y calurosos veranos estaban llenos de juegos imaginativos y una curiosidad infantil sin fin",
            tr: "Uzun sıcak yazlar hayal gücü dolu oyunlar ve bitmeyen çocuksu merakla doluydu",
          },
          {
            ar: "زارهما صديقهما ديل كل صيف حاملًا قصصًا جامحة وأفكارًا أكثر جموحًا",
            es: "Su amigo Dill los visitaba cada verano trayendo historias salvajes e ideas aún más salvajes",
            tr: "Arkadaşları Dill her yaz onları ziyaret eder, çılgın hikayeler ve daha da çılgın fikirler getirirdi",
          },
          {
            ar: "علّم أتيكوس أبناءه معاملة كل شخص بصبر وإنصاف دون استثناء",
            es: "Atticus enseñó a sus hijos a tratar a cada persona con paciencia y equidad, sin excepción",
            tr: "Atticus, çocuklarına her insana sabır ve adaletle davranmayı, istisnasız öğretti",
          },
          {
            ar: "غالبًا ما وقعت سكاوت في المتاعب بسبب عنادها وقوة إرادتها وصراحتها",
            es: "Scout a menudo se metía en problemas por su carácter terco, obstinado y honesto",
            tr: "Scout, inatçı, azimli ve dürüst kişiliği yüzünden sık sık başını derde sokardı",
          },
        ],
      },
      {
        title: { ar: "بو رادلي", es: "Boo Radley", tr: "Boo Radley" },
        sentences: [
          {
            ar: "عاش قريبًا جار غامض يُدعى بو رادلي لم يغادر منزله أبدًا",
            es: "Cerca vivía un misterioso vecino llamado Boo Radley que nunca salía de su casa",
            tr: "Yakınlarda evinden hiç çıkmayan Boo Radley adında gizemli bir komşu yaşıyordu",
          },
          {
            ar: "أسرت نوافذه المغلقة وباحته الصامتة أطفال الحي وأخافتهم في آن معًا",
            es: "Sus ventanas cerradas y su patio silencioso fascinaban y aterraban a los niños del vecindario",
            tr: "Kapalı pencereleri ve sessiz avlusu, mahalledeki çocukları hem büyülüyor hem korkutuyordu",
          },
          {
            ar: "زعمت إشاعات جامحة أن بو خطير وعنيف وربما ليس إنسانًا بالكامل",
            es: "Rumores salvajes afirmaban que Boo era peligroso, violento y quizá no del todo humano",
            tr: "Çılgın söylentiler Boo'nun tehlikeli, şiddetli ve belki de tam olarak insan olmadığını iddia ediyordu",
          },
          {
            ar: "أقسم بعض الأطفال أنه يأكل السناجب النيئة ويتسلل في الباحة وحده ليلًا",
            es: "Algunos niños juraban que comía ardillas crudas y merodeaba solo por el patio de noche",
            tr: "Bazı çocuklar çiğ sincap yediğine ve geceleri avluda tek başına dolaştığına yemin ediyordu",
          },
          {
            ar: "تحدّت سكاوت وجيم وصديقهما ديل بعضهم بعضًا للاقتراب من منزله المخيف",
            es: "Scout, Jem y su amigo Dill se retaban unos a otros a acercarse a su tenebrosa casa",
            tr: "Scout, Jem ve arkadaşları Dill, birbirlerini onun ürkütücü evine yaklaşmaya meydan okuyordu",
          },
          {
            ar: "اقتربوا خلسة في الليل وقلوبهم تخفق عند كل صرير من السياج القديم",
            es: "Se acercaban sigilosamente de noche, con el corazón latiendo con cada crujido de la vieja cerca",
            tr: "Geceleyin sinsice yaklaştılar, eski çitin her gıcırtısında kalpleri hızla çarpıyordu",
          },
          {
            ar: "بدأت هدايا غريبة صغيرة تظهر بشكل غامض داخل شجرة مجوفة قرب باحته",
            es: "Extraños pequeños regalos comenzaron a aparecer misteriosamente dentro de un árbol hueco cerca de su patio",
            tr: "Avlusunun yakınındaki oyuk bir ağacın içinde tuhaf küçük hediyeler gizemli bir şekilde belirmeye başladı",
          },
          {
            ar: "بدأ الأطفال يشعرون تدريجيًا بالفضول تجاه الرجل الهادئ المختبئ خلف الإشاعات",
            es: "Los niños se fueron sintiendo poco a poco curiosos por el hombre tranquilo escondido detrás de los rumores",
            tr: "Çocuklar, söylentilerin ardında saklı sessiz adama karşı yavaş yavaş merak duymaya başladı",
          },
        ],
      },
      {
        title: {
          ar: "أتيكوس يتولى القضية",
          es: "Atticus toma el caso",
          tr: "Atticus Davayı Üstleniyor",
        },
        sentences: [
          {
            ar: "وافق أتيكوس على الدفاع عن توم روبنسون رجل أسود اتُّهم زورًا بجريمة خطيرة",
            es: "Atticus aceptó defender a Tom Robinson, un hombre negro falsamente acusado de un grave delito",
            tr: "Atticus, ciddi bir suçla haksız yere itham edilen siyahi bir adam olan Tom Robinson'ı savunmayı kabul etti",
          },
          {
            ar: "قلة من محامي البلدة كانوا ليتولوا قضية كهذه بهذا الانفتاح أو هذه الجدية",
            es: "Pocos abogados del pueblo habrían aceptado un caso así tan abiertamente ni tan en serio",
            tr: "Kasabada çok az avukat böyle bir davayı bu kadar açık veya ciddiye alarak üstlenirdi",
          },
          {
            ar: "اتُّهم توم بالاعتداء على امرأة بيضاء شابة تُدعى مايلا إيويل",
            es: "Tom fue acusado de agredir a una joven mujer blanca llamada Mayella Ewell",
            tr: "Tom, Mayella Ewell adında genç bir beyaz kadına saldırmakla suçlandı",
          },
          {
            ar: "كان الاتهام وحده كافيًا لإقناع معظم أهل مايكومب قبل بدء أي محاكمة",
            es: "La sola acusación bastaba para convencer a la mayoría de Maycomb antes de que comenzara ningún juicio",
            tr: "Yalnızca suçlama, herhangi bir dava başlamadan önce Maycomb halkının çoğunu ikna etmeye yetiyordu",
          },
          {
            ar: "آمن أتيكوس بعمق أن كل شخص يستحق دفاعًا عادلًا وصادقًا",
            es: "Atticus creía profundamente que toda persona merecía una defensa justa y honesta",
            tr: "Atticus, her insanın adil ve dürüst bir savunmayı hak ettiğine derinden inanıyordu",
          },
          {
            ar: "أوضح لسكاوت بصبر أن الشجاعة الحقيقية تعني فعل الصواب رغم الثمن",
            es: "Le explicó pacientemente a Scout que el verdadero coraje significaba hacer lo correcto a pesar del costo",
            tr: "Scout'a sabırla, gerçek cesaretin bedeline rağmen doğru olanı yapmak olduğunu açıkladı",
          },
          {
            ar: "علم جيدًا أن الدفاع عن توم سيجلب غضبًا حقيقيًا من بلدتهما",
            es: "Sabía bien que defender a Tom traería una ira real de parte de su pueblo",
            tr: "Tom'u savunmanın kasabalarından gerçek bir öfke getireceğini iyi biliyordu",
          },
          {
            ar: "سرعان ما شعر سكاوت وجيم بذلك الغضب نفسه موجهًا بألم نحو عائلتهما",
            es: "Scout y Jem pronto sintieron esa misma ira dirigida dolorosamente hacia su propia familia",
            tr: "Scout ve Jem kısa sürede aynı öfkenin acı bir şekilde kendi ailelerine yöneldiğini hissetti",
          },
        ],
      },
      {
        title: { ar: "رد فعل البلدة", es: "La reacción del pueblo", tr: "Kasabanın Tepkisi" },
        sentences: [
          {
            ar: "سخر زملاء سكاوت في المدرسة منها لأن والدها يدافع عن رجل أسود",
            es: "Los compañeros de Scout la burlaban en la escuela por tener un padre que defendía a un hombre negro",
            tr: "Sınıf arkadaşları, siyahi bir adamı savunan bir babası olduğu için Scout'a okulda alay ettiler",
          },
          {
            ar: "شدّت قبضتيها أكثر من مرة لكنها تذكرت نصيحة والدها الهادئة",
            es: "Apretó los puños más de una vez, pero recordó el consejo tranquilo de su padre",
            tr: "Birden fazla kez yumruklarını sıktı ama babasının sakin tavsiyesini hatırladı",
          },
          {
            ar: "تجمّع حشد عدائي مرة أمام السجن مهددًا بإيذاء توم روبنسون",
            es: "Una vez, una multitud hostil se reunió frente a la cárcel amenazando con herir a Tom Robinson",
            tr: "Bir keresinde düşmanca bir kalabalık hapishanenin önünde toplanarak Tom Robinson'a zarar vermekle tehdit etti",
          },
          {
            ar: "جلس أتيكوس وحده يقرأ بهدوء على درجات السجن منتظرًا مهما يحدث",
            es: "Atticus se sentó solo, leyendo con calma en los escalones de la cárcel, esperando lo que pudiera venir",
            tr: "Atticus, ne olursa olsun beklerken hapishane merdivenlerinde tek başına sakince oturup kitap okudu",
          },
          {
            ar: "بدّدت سكاوت الحشد المتوتر دون أن تدري بحديثها البريء مع جار مألوف",
            es: "Scout, sin saberlo, calmó a la tensa multitud simplemente hablando con inocencia a un vecino conocido",
            tr: "Scout, tanıdık bir komşuyla masumca konuşarak gergin kalabalığı farkında olmadan yatıştırdı",
          },
          {
            ar: "ذكّرت أسئلتها الصغيرة العادية الرجال الغاضبين بلطفهم الهادئ الخاص",
            es: "Sus preguntas pequeñas y ordinarias recordaron a los hombres enfadados su propia decencia tranquila",
            tr: "Küçük, sıradan soruları öfkeli adamlara kendi sessiz iyiliklerini hatırlattı",
          },
          {
            ar: "بقي أتيكوس هادئًا ووقورًا رغم الضغط المتصاعد من جيرانه الغاضبين",
            es: "Atticus permaneció tranquilo y digno a pesar de la creciente presión de sus vecinos enfadados",
            tr: "Atticus, öfkeli komşularından gelen artan baskıya rağmen sakin ve onurlu kaldı",
          },
          {
            ar: "بدأ الأطفال تدريجيًا يفهمون الشجاعة الحقيقية وراء اختيار والدهما الهادئ",
            es: "Los niños empezaron poco a poco a comprender el verdadero coraje detrás de la tranquila decisión de su padre",
            tr: "Çocuklar, babalarının sessiz kararının ardındaki gerçek cesareti yavaş yavaş anlamaya başladı",
          },
        ],
      },
      {
        title: { ar: "المحاكمة تبدأ", es: "Comienza el juicio", tr: "Duruşma Başlıyor" },
        sentences: [
          {
            ar: "ازدحمت البلدة بأكملها داخل المحكمة متلهفة لمشاهدة المحاكمة المثيرة",
            es: "Todo el pueblo se apiñó en el tribunal, ansioso por presenciar el dramático juicio",
            tr: "Tüm kasaba, dramatik duruşmayı izlemek için sabırsızlıkla mahkeme salonuna doluştu",
          },
          {
            ar: "أحضرت العائلات نزهات وانتظرت في الخارج وكأنه معرض لا محاكمة",
            es: "Las familias trajeron pícnics y esperaron afuera como si fuera una feria en lugar de un juicio",
            tr: "Aileler piknik sepetleri getirip dışarıda sanki bir dava değil de bir panayırmış gibi beklediler",
          },
          {
            ar: "أدلت مايلا إيويل بشهادتها بتوتر مقدمة قصة لم تكن متماسكة تمامًا",
            es: "Mayella Ewell testificó con nerviosismo, ofreciendo una historia que no terminaba de cuadrar",
            tr: "Mayella Ewell gergin bir şekilde ifade verdi ve tam olarak tutarlı olmayan bir hikaye anlattı",
          },
          {
            ar: "تنقلت عيناها بقلق نحو والدها الجالس متيقظًا في القاعة المزدحمة",
            es: "Sus ojos se movían ansiosamente hacia su padre, sentado y vigilante en la sala abarrotada",
            tr: "Gözleri kalabalık salonda oturmuş, tetikte bekleyen babasına endişeyle gidip geliyordu",
          },
          {
            ar: "أدلى والدها بوب إيويل بشهادته بغضب واضح وعداء صريح",
            es: "Su padre, Bob Ewell, testificó con evidente ira y clara hostilidad",
            tr: "Babası Bob Ewell, belirgin bir öfke ve açık bir düşmanlıkla ifade verdi",
          },
          {
            ar: "أزعجت لغته الفظة وابتسامته الساخرة حتى بعض جيرانه الحاضرين",
            es: "Su lenguaje grosero y su actitud burlona incomodaron incluso a algunos de sus propios vecinos",
            tr: "Kaba dili ve alaycı tavırları kendi komşularından bazılarını bile rahatsız etti",
          },
          {
            ar: "راقب سكاوت وجيم سرًا من الشرفة المخصصة لسكان البلدة السود",
            es: "Scout y Jem observaban en secreto desde el balcón reservado para los habitantes negros del pueblo",
            tr: "Scout ve Jem, kasabanın siyahi sakinlerine ayrılmış balkondan gizlice izliyordu",
          },
          {
            ar: "هدأت قاعة المحكمة المتوترة عندما نهض أتيكوس بهدوء ليبدأ دفاعه",
            es: "La tensa sala del tribunal se quedó en silencio cuando Atticus se levantó tranquilamente para comenzar su defensa",
            tr: "Atticus sakince ayağa kalkıp savunmasına başlarken gergin mahkeme salonu sessizleşti",
          },
        ],
      },
      {
        title: { ar: "دفاع أتيكوس", es: "La defensa de Atticus", tr: "Atticus'un Savunması" },
        sentences: [
          {
            ar: "أثبت أتيكوس بوضوح أن ذراع توم المصابة كانت معطلة تمامًا وبشكل دائم",
            es: "Atticus demostró claramente que el brazo supuestamente herido de Tom estaba permanente y completamente incapacitado",
            tr: "Atticus, Tom'un sözde yaralı kolunun kalıcı ve tamamen kullanılamaz olduğunu açıkça kanıtladı",
          },
          {
            ar: "طلب من توم ببساطة أن يرفع ذراعيه ليرى الجميع في القاعة بوضوح",
            es: "Le pidió a Tom simplemente que levantara ambos brazos para que toda la sala pudiera verlo claramente",
            tr: "Tom'dan sadece salondaki herkesin açıkça görebilmesi için iki kolunu kaldırmasını istedi",
          },
          {
            ar: "أظهر أن إصابات مايلا تتطابق مع شخص يستخدم يده اليسرى القوية بشكل أساسي",
            es: "Demostró que las heridas de Mayella coincidían con alguien que golpeaba principalmente con la mano izquierda",
            tr: "Mayella'nın yaralarının, ağırlıklı olarak güçlü sol elini kullanan biriyle örtüştüğünü gösterdi",
          },
          {
            ar: "أُشير بلطف لكن بحزم إلى أن بوب إيويل نفسه كان أعسر",
            es: "Se sugirió con delicadeza pero con firmeza que el propio Bob Ewell era zurdo",
            tr: "Bob Ewell'in kendisinin solak olduğu nazikçe ama kesin bir şekilde ima edildi",
          },
          {
            ar: "شهد توم بصدق موضحًا أنه حاول فقط مساعدة مايلا بلطف",
            es: "Tom testificó con honestidad, explicando que solo había intentado ayudar amablemente a Mayella",
            tr: "Tom dürüstçe ifade verdi ve sadece Mayella'ya nazikçe yardım etmeye çalıştığını açıkladı",
          },
          {
            ar: "تناقضت إجاباته الهادئة المحترمة بشدة مع الاتهامات القبيحة الموجهة ضده",
            es: "Sus respuestas tranquilas y respetuosas contrastaban fuertemente con las feas acusaciones en su contra",
            tr: "Sakin, saygılı yanıtları, kendisine yöneltilen çirkin suçlamalarla keskin bir tezat oluşturuyordu",
          },
          {
            ar: "جادل أتيكوس بشغف أن التحيز وحده هو ما يقود هذا الاتهام الظالم بوضوح",
            es: "Atticus argumentó con pasión que solo el prejuicio impulsaba claramente esta acusación injusta",
            tr: "Atticus, bu haksız suçlamayı açıkça yalnızca önyargının yönlendirdiğini tutkuyla savundu",
          },
          {
            ar: "ذكّر هيئة المحلفين بلطف أن كل إنسان متساوٍ حقًا داخل قاعة المحكمة",
            es: "Recordó suavemente al jurado que dentro de un tribunal, todo hombre es verdaderamente igual",
            tr: "Jüriye, mahkeme salonunda her insanın gerçekten eşit olduğunu nazikçe hatırlattı",
          },
        ],
      },
      {
        title: { ar: "حكم ظالم", es: "Un veredicto injusto", tr: "Haksız Bir Karar" },
        sentences: [
          {
            ar: "رغم الأدلة الواضحة والمقنعة أدانت هيئة المحلفين البيضاء بالكامل توم مع ذلك",
            es: "A pesar de la evidencia clara y convincente, el jurado, formado enteramente por blancos, declaró culpable a Tom de todos modos",
            tr: "Açık ve ikna edici kanıtlara rağmen tamamen beyazlardan oluşan jüri yine de Tom'u suçlu buldu",
          },
          {
            ar: "سقطت كلمة مذنب على قاعة المحكمة الصامتة وكأنها ضربة جسدية",
            es: "La palabra culpable cayó sobre la silenciosa sala del tribunal como un golpe físico",
            tr: "Suçlu kelimesi sessiz mahkeme salonuna fiziksel bir darbe gibi düştü",
          },
          {
            ar: "تحطم سكاوت وجيم وهما يشهدان هذا الظلم الواضح يحدث أمامهما مباشرة",
            es: "Scout y Jem quedaron destrozados al presenciar tan evidente injusticia ocurriendo justo delante de ellos",
            tr: "Scout ve Jem, bu apaçık adaletsizliğin tam önlerinde gerçekleştiğine tanık olurken yıkıldılar",
          },
          {
            ar: "لم يستطع جيم أن يفهم كيف لم يغيّر دليل بهذا الوضوح شيئًا على الإطلاق",
            es: "Jem no podía entender cómo una prueba tan clara no había cambiado absolutamente nada",
            tr: "Jem, bu kadar net bir kanıtın hiçbir şeyi nasıl değiştirmediğini anlayamadı",
          },
          {
            ar: "نهض مجتمع السود الحاضر في الشرفة بصمت واحترام وهو يغادر أتيكوس",
            es: "La comunidad negra presente en el balcón se puso de pie en silencio y con respeto mientras Atticus se marchaba",
            tr: "Balkondaki siyahi topluluk, Atticus ayrılırken sessizce ve saygıyla ayağa kalktı",
          },
          {
            ar: "عنى هذا التكريم الصامت والواقف لسكاوت أكثر من أي كلمات ممكنة",
            es: "Ese silencioso y respetuoso tributo de pie significó para Scout más de lo que cualquier palabra podría",
            tr: "Bu sessiz, ayakta duran saygı gösterisi Scout için herhangi bir kelimeden daha fazlasını ifade etti",
          },
          {
            ar: "بقي أتيكوس متفائلًا بشأن متابعة استئناف قانوني رسمي لقضية توم",
            es: "Atticus se mantuvo esperanzado en presentar una apelación legal formal para el caso de Tom",
            tr: "Atticus, Tom'un davası için resmi bir yasal itiraz sürecini sürdürme konusunda umutlu kaldı",
          },
          {
            ar: "غيّر هذا الحكم الظالم بشكل دائم نظرة سكاوت إلى الإنصاف داخل بلدتها",
            es: "El veredicto injusto cambió permanentemente la forma en que Scout veía la justicia dentro de su propio pueblo",
            tr: "Haksız karar, Scout'un kendi kasabasındaki adalet anlayışını kalıcı olarak değiştirdi",
          },
        ],
      },
      {
        title: { ar: "مأساة توم", es: "Tragedia para Tom", tr: "Tom İçin Trajedi" },
        sentences: [
          {
            ar: "أثناء انتظاره للاستئناف حاول توم هروبًا يائسًا من فناء السجن",
            es: "Mientras esperaba la apelación, Tom intentó una desesperada fuga del patio de la prisión",
            tr: "İtirazı beklerken Tom, hapishane avlusundan umutsuz bir kaçış girişiminde bulundu",
          },
          {
            ar: "كان قد فقد الأمل في أن تعامله أي محكمة يومًا بإنصاف حقيقي",
            es: "Había perdido la esperanza de que algún tribunal lo tratara alguna vez con verdadera justicia",
            tr: "Herhangi bir mahkemenin kendisine gerçekten adil davranacağına dair umudunu kaybetmişti",
          },
          {
            ar: "أطلق الحراس النار عليه وقتلوه أثناء محاولة الهروب قبل أن يحدث أي استئناف",
            es: "Los guardias le dispararon y lo mataron durante el intento de fuga antes de que pudiera ocurrir apelación alguna",
            tr: "Muhafızlar herhangi bir itiraz gerçekleşmeden önce kaçış girişimi sırasında onu vurup öldürdü",
          },
          {
            ar: "وصل الخبر إلى مايكومب بهدوء وانتشر من شرفة إلى أخرى كقشعريرة بطيئة",
            es: "La noticia llegó a Maycomb en silencio y se extendió de porche en porche como un lento escalofrío",
            tr: "Haber sessizce Maycomb'a ulaştı ve yavaş bir ürperti gibi verandadan verandaya yayıldı",
          },
          {
            ar: "نقل أتيكوس الخبر المأساوي بلطف إلى عائلة توم المفجوعة والحزينة",
            es: "Atticus transmitió con delicadeza la trágica noticia a la afligida y devastada familia de Tom",
            tr: "Atticus, trajik haberi Tom'un yıkılmış ve kederli ailesine nazikçe iletti",
          },
          {
            ar: "جلس معهم بهدوء يقدم ما تستطيع الكلمات وحدها منحه من عزاء ضئيل",
            es: "Se sentó tranquilamente con ellos, ofreciendo el pequeño consuelo que las palabras solas podían dar",
            tr: "Onlarla sessizce oturdu ve sadece kelimelerin verebileceği küçük tesellinin ne olduğunu sundu",
          },
          {
            ar: "هزّ الموت العبثي البلدة بأكملها وطفلي أتيكوس نفسيهما بعمق",
            es: "La muerte sin sentido conmocionó profundamente tanto al pueblo entero como a los propios hijos de Atticus",
            tr: "Anlamsız ölüm hem tüm kasabayı hem de Atticus'un kendi çocuklarını derinden sarstı",
          },
          {
            ar: "بدأت سكاوت تفهم تمامًا الثمن الحقيقي والفظيع للتحيز من حولها",
            es: "Scout comenzó a comprender por completo el terrible costo real del prejuicio a su alrededor",
            tr: "Scout, çevresindeki önyargının gerçek ve korkunç bedelini tamamen anlamaya başladı",
          },
        ],
      },
      {
        title: {
          ar: "انتقام بوب إيويل",
          es: "La venganza de Bob Ewell",
          tr: "Bob Ewell'in İntikamı",
        },
        sentences: [
          {
            ar: "أذلته المحاكمة فأصبح بوب إيويل مريرًا وخطّط بهدوء لانتقامه",
            es: "Humillado por el juicio, Bob Ewell se volvió amargado y planeó en secreto su venganza",
            tr: "Duruşmada küçük düşen Bob Ewell acılaştı ve sessizce intikamını planladı",
          },
          {
            ar: "تمتم بتهديدات حول البلدة اختار معظم الجيران ببساطة تجاهلها",
            es: "Murmuraba amenazas por el pueblo que la mayoría de los vecinos simplemente elegían ignorar",
            tr: "Kasabada tehditler mırıldandı; çoğu komşu bunları görmezden gelmeyi tercih etti",
          },
          {
            ar: "في ليلة مظلمة هاجم سكاوت وجيم وهما يسيران عائدين إلى المنزل وحدهما",
            es: "Una noche oscura atacó a Scout y Jem mientras caminaban solos de regreso a casa",
            tr: "Karanlık bir gecede Scout ve Jem eve tek başlarına yürürken onlara saldırdı",
          },
          {
            ar: "امتلأ الطريق المظلم فجأة بخطوات ثقيلة وبقلب سكاوت الخائف الخافق",
            es: "El oscuro sendero se llenó de repente de pisadas pesadas y del propio corazón asustado de Scout latiendo con fuerza",
            tr: "Karanlık patika aniden ağır ayak sesleri ve Scout'un kendi korkmuş, çarpan kalbiyle doldu",
          },
          {
            ar: "كُسرت ذراع جيم بشدة أثناء الصراع المرعب المفاجئ في الظلام",
            es: "El brazo de Jem se rompió gravemente durante la súbita y aterradora lucha en la oscuridad",
            tr: "Jem'in kolu, karanlıktaki ani ve korkunç mücadele sırasında ciddi şekilde kırıldı",
          },
          {
            ar: "بالكاد استطاعت سكاوت الحبيسة داخل زي الجمبون الصلب أن ترى أو تتحرك",
            es: "Scout, atrapada dentro de su rígido disfraz de jamón, apenas podía ver o moverse",
            tr: "Sert jambon kostümünün içine sıkışan Scout neredeyse hiç göremiyor ya da hareket edemiyordu",
          },
          {
            ar: "ظهر غريب غامض فجأة وقاتل إيويل بشراسة لإبعاده في الظلام",
            es: "Un extraño misterioso apareció de repente y luchó ferozmente contra Ewell para alejarlo en la oscuridad",
            tr: "Gizemli bir yabancı aniden ortaya çıktı ve Ewell'i karanlıkta şiddetle uzaklaştırdı",
          },
          {
            ar: "أدركت سكاوت بصدمة أن منقذهما كان جارهما الانعزالي بو رادلي",
            es: "Scout se dio cuenta con conmoción de que su rescatador era el retraído vecino Boo Radley",
            tr: "Scout, kurtarıcılarının içine kapanık komşuları Boo Radley olduğunu şokla fark etti",
          },
        ],
      },
      {
        title: {
          ar: "إنقاذ بو رادلي",
          es: "El rescate de Boo Radley",
          tr: "Boo Radley'in Kurtarışı",
        },
        sentences: [
          {
            ar: "حمل بو رادلي بهدوء جيم المصاب إلى المنزل بأمان بنفسه تلك الليلة بالذات",
            es: "Boo Radley había llevado tranquilamente al herido Jem de vuelta a casa a salvo esa misma noche",
            tr: "Boo Radley, o gece yaralı Jem'i sessizce kendi eviyle güvenle geri taşımıştı",
          },
          {
            ar: "وقف شاحبًا وصامتًا في زاوية غرفة جيم غير معتاد بوضوح على الصحبة",
            es: "Se quedó pálido y silencioso en un rincón de la habitación de Jem, claramente poco acostumbrado a la compañía",
            tr: "Jem'in odasının bir köşesinde solgun ve sessiz durdu, arkadaşlığa açıkça alışkın değildi",
          },
          {
            ar: "التقت سكاوت أخيرًا بجارها الغامض موجهة إياه بلطف وخجل نحو شرفته",
            es: "Scout finalmente conoció a su misterioso vecino, guiándolo con suavidad y timidez de vuelta a su propio porche",
            tr: "Scout sonunda gizemli komşusuyla tanıştı ve onu utangaç bir nezaketle kendi verandasına götürdü",
          },
          {
            ar: "شعرت يده نحيلة ولطيفة وهي ترافقه بحذر إلى منزله في الظلام",
            es: "Su mano se sintió delgada y suave mientras ella lo acompañaba con cuidado a casa en la oscuridad",
            tr: "Onu karanlıkta dikkatlice eve götürürken eli ince ve nazik hissettirdi",
          },
          {
            ar: "وهي واقفة على شرفته رأت الحي بأكمله تمامًا كما كان بو يراه دائمًا",
            es: "De pie en su porche, ella vio todo el vecindario exactamente como Boo siempre lo había visto",
            tr: "Onun verandasında dururken, tüm mahalleyi Boo'nun her zaman gördüğü gibi gördü",
          },
          {
            ar: "بدا الشارع بأكمله من هناك أصغر وأكثر هدوءًا ومليئًا بالذكريات بشكل غريب",
            es: "Desde allí, toda la calle parecía más pequeña, más tranquila y extrañamente llena de recuerdos",
            tr: "Oradan bakınca tüm sokak daha küçük, daha sakin ve tuhaf bir şekilde anılarla dolu görünüyordu",
          },
          {
            ar: "قرر شريف البلدة بهدوء الإبلاغ عن موت إيويل باعتباره سقوطًا عرضيًا مؤسفًا",
            es: "El sheriff del pueblo decidió tranquilamente reportar la muerte de Ewell como una desafortunada caída accidental",
            tr: "Kasaba şerifi, Ewell'in ölümünü talihsiz, kazara bir düşüş olarak bildirmeye sessizce karar verdi",
          },
          {
            ar: "تنتهي رواية قتل الطائر المحاكي باكتساب سكاوت دروسًا عميقة لا تُنسى في التعاطف",
            es: "Matar a un ruiseñor termina con Scout adquiriendo lecciones profundas e inolvidables sobre la compasión",
            tr: "Bülbülü Öldürmek, Scout'un şefkat üzerine derin, unutulmaz dersler edinmesiyle sona erer",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-alchemist",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة باولو كويلو عن سانتياغو، الراعي الذي يعبر الصحراء بحثًا عن كنز — وعن نفسه — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Paulo Coelho sobre Santiago, un pastor que cruza el desierto en busca de un tesoro — y de sí mismo — un relato personal, no el texto original.",
      tr: "Paulo Coelho'nun, bir hazineyi — ve kendini — aramak için çölü aşan bir çoban olan Santiago hakkındaki hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: { ar: "سانتياغو الراعي", es: "Santiago el pastor", tr: "Çoban Santiago" },
        sentences: [
          {
            ar: "كان سانتياغو راعيًا شابًا يتجول في تلال إسبانيا برفقة أغنامه",
            es: "Santiago era un joven pastor que recorría las colinas de España con sus ovejas",
            tr: "Santiago, koyunlarıyla İspanya'nın tepelerinde dolaşan genç bir çobandı",
          },
          {
            ar: "كان ينام تحت الأشجار القديمة ويستيقظ كل صباح على السماء المفتوحة الواسعة ذاتها",
            es: "Dormía bajo árboles antiguos y se despertaba cada mañana bajo el mismo amplio cielo abierto",
            tr: "Yaşlı ağaçların altında uyur, her sabah aynı geniş açık gökyüzü altında uyanırdı",
          },
          {
            ar: "استمر يحلم بالحلم نفسه المتكرر عن كنز مخبأ قرب الأهرامات المصرية",
            es: "Seguía teniendo el mismo sueño recurrente sobre un tesoro escondido cerca de las pirámides egipcias",
            tr: "Mısır piramitlerinin yakınında saklı bir hazine hakkında aynı yinelenen rüyayı görmeye devam etti",
          },
          {
            ar: "عاد الحلم مرارًا وتكرارًا وبدا في كل مرة أكثر وضوحًا من السابق",
            es: "El sueño regresaba una y otra vez, sintiéndose cada vez más vívido que antes",
            tr: "Rüya tekrar tekrar geri dönüyor, her seferinde öncekinden daha canlı hissettiriyordu",
          },
          {
            ar: "أخبرته امرأة غجرية عجوز أن الحلم علامة يجب أن يتبعها",
            es: "Una anciana gitana le dijo que el sueño era una señal que debía seguir",
            tr: "Yaşlı bir çingene kadın, rüyanın izlemesi gereken bir işaret olduğunu söyledi",
          },
          {
            ar: "طلبت مقابل نصيحتها عملة واحدة صغيرة بدت مع ذلك أثمن بكثير",
            es: "Pidió solo una pequeña moneda por su consejo, que sin embargo pareció valer mucho más",
            tr: "Tavsiyesi için sadece küçük bir para istedi, ama bu tavsiye çok daha değerli görünüyordu",
          },
          {
            ar: "تردد سانتياغو في البداية غير متأكد من الثقة بحلم على حساب حياته البسيطة المريحة",
            es: "Santiago dudó al principio, sin saber si confiar en un sueño por encima de su vida simple y cómoda",
            tr: "Santiago önce tereddüt etti, basit ve rahat hayatı yerine bir rüyaya güvenip güvenmemek konusunda emin değildi",
          },
          {
            ar: "ومع ذلك دفعه شيء ما في أعماقه بهدوء نحو هذه الرحلة الجديدة غير المتوقعة",
            es: "Aun así, algo en su interior lo empujaba en silencio hacia este inesperado nuevo viaje",
            tr: "Yine de içindeki bir şey onu sessizce bu beklenmedik yeni yolculuğa itiyordu",
          },
        ],
      },
      {
        title: { ar: "الملك العجوز", es: "El viejo rey", tr: "Yaşlı Kral" },
        sentences: [
          {
            ar: "سرعان ما ظهر رجل غامض عجوز يُدعى ملكيصادق وسمى نفسه ملكًا",
            es: "Pronto apareció un misterioso anciano llamado Melquisedec que se hacía llamar rey",
            tr: "Kısa süre sonra kendisine kral diyen Melkizedek adında gizemli yaşlı bir adam ortaya çıktı",
          },
          {
            ar: "بدت عيناه تعرف أشياء عن سانتياغو لم يبُح بها هو نفسه قط",
            es: "Sus ojos parecían saber cosas sobre Santiago que él mismo nunca había dicho en voz alta",
            tr: "Gözleri, Santiago'nun kendisinin bile hiç dile getirmediği şeyleri biliyor gibiydi",
          },
          {
            ar: "تحدث عن شيء أسماه الأسطورة الشخصية الفريدة لكل إنسان",
            es: "Habló de algo que llamó la Leyenda Personal única de cada persona",
            tr: "Her insanın kendine özgü Kişisel Efsanesi olarak adlandırdığı bir şeyden bahsetti",
          },
          {
            ar: "قال إن كل شخص يعرف سرًا حلمه الخاص لكن قلة فقط تجرؤ على متابعته",
            es: "Dijo que todo el mundo conoce en secreto su propio sueño, pero pocos se atreven a seguirlo",
            tr: "Herkesin gizlice kendi hayalini bildiğini ama çok azının onu takip etmeye cesaret ettiğini söyledi",
          },
          {
            ar: "أوضح أن السعي وراء حلم حقيقي هو الغاية الحقيقية العميقة لكل إنسان",
            es: "Explicó que perseguir un sueño verdadero era el propósito real y más profundo de toda persona",
            tr: "Gerçek bir hayalin peşinden gitmenin her insanın en derin gerçek amacı olduğunu açıkladı",
          },
          {
            ar: "أعطى سانتياغو حجرين صغيرين يُدعيان أوريم وتُميم ليرشداه في القرارات الصعبة",
            es: "Le dio a Santiago dos pequeñas piedras llamadas Urim y Tumim para guiarlo en las decisiones difíciles",
            tr: "Santiago'ya zor kararlarda yol göstermesi için Urim ve Tummim adında iki küçük taş verdi",
          },
          {
            ar: "حذّره من ألا يستخدمهما إلا حين يبدو الطريق أمامه غامضًا حقًا",
            es: "Le advirtió que debía usarlas solo cuando el camino por delante pareciera verdaderamente confuso",
            tr: "Onları yalnızca ilerideki yol gerçekten belirsiz göründüğünde kullanması konusunda uyardı",
          },
          {
            ar: "مستلهمًا باع سانتياغو أغنامه وانطلق نحو أفريقيا في اليوم التالي مباشرة",
            es: "Inspirado, Santiago vendió sus ovejas y partió hacia África al día siguiente mismo",
            tr: "İlham alan Santiago koyunlarını sattı ve tam ertesi gün Afrika'ya doğru yola çıktı",
          },
        ],
      },
      {
        title: { ar: "سرقة في طنجة", es: "Robado en Tánger", tr: "Tanca'da Soyulma" },
        sentences: [
          {
            ar: "في مدينة طنجة الغريبة سرق غريب بسرعة كل عملة يملكها سانتياغو",
            es: "En la desconocida ciudad de Tánger, un desconocido le robó rápidamente todas las monedas a Santiago",
            tr: "Yabancı Tanca şehrinde bir yabancı, Santiago'nun sahip olduğu her parayı hızla çaldı",
          },
          {
            ar: "ابتلع السوق المزدحم اللص قبل أن يفهم سانتياغو حتى ما حدث",
            es: "El abarrotado mercado se tragó al ladrón antes de que Santiago comprendiera siquiera lo ocurrido",
            tr: "Kalabalık pazar, Santiago olanları anlamadan hırsızı yutmuştu bile",
          },
          {
            ar: "وحيدًا وخائفًا ومفلسًا تساءل إن كانت الرحلة بأكملها قد كانت خطأً فادحًا",
            es: "Solo, asustado y sin dinero, se preguntó si todo el viaje había sido un terrible error",
            tr: "Yalnız, korkmuş ve parasız, tüm bu yolculuğun büyük bir hata olup olmadığını merak etti",
          },
          {
            ar: "للحظة فكّر في التخلي عن الرحلة والعودة ببساطة إلى دياره",
            es: "Por un momento consideró rendirse y simplemente encontrar el camino de vuelta a casa",
            tr: "Bir an için vazgeçmeyi ve basitçe evine dönmeyi düşündü",
          },
          {
            ar: "وجد عملًا بدلًا من ذلك في متجر صغير للبلور يعاني بالقرب من هناك",
            es: "En cambio, encontró trabajo en una pequeña y decadente tienda de cristal cercana",
            tr: "Bunun yerine yakınlardaki küçük, zorlanan bir kristal dükkânında iş buldu",
          },
          {
            ar: "روت الرفوف المغطاة بالغبار وتدفق العملاء البطيء قصتهما الهادئة الخاصة",
            es: "Los estantes cubiertos de polvo y el lento goteo de clientes contaban su propia historia silenciosa",
            tr: "Tozla kaplı raflar ve yavaş müşteri akışı kendi sessiz hikayelerini anlatıyordu",
          },
          {
            ar: "كان صاحب المتجر المرهق قد تخلى منذ زمن طويل عن أحلامه الشخصية الخاصة",
            es: "El cansado dueño de la tienda hacía mucho que había renunciado a sus propios sueños personales",
            tr: "Dükkânın yorgun sahibi çoktan kendi kişisel hayallerinden vazgeçmişti",
          },
          {
            ar: "كان يتحدث غالبًا عن مكة لكنه دائمًا يجد عذرًا لعدم الذهاب فعليًا أبدًا",
            es: "Hablaba a menudo de La Meca, pero siempre encontraba una excusa para nunca ir en realidad",
            tr: "Sık sık Mekke'den bahsederdi ama gerçekten gitmemek için hep bir bahane bulurdu",
          },
        ],
      },
      {
        title: { ar: "متجر البلور", es: "La tienda de cristal", tr: "Kristal Dükkânı" },
        sentences: [
          {
            ar: "على مدار عام كامل عمل سانتياغو بجد وادّخر أرباحه المتواضعة بعناية",
            es: "Durante un año entero, Santiago trabajó duro y ahorró cuidadosamente sus modestas ganancias",
            tr: "Bir yıl boyunca Santiago sıkı çalıştı ve mütevazı kazancını dikkatle biriktirdi",
          },
          {
            ar: "تعلّم الصبر والانضباط والقيمة الحقيقية الهادئة للجهد اليومي الصادق",
            es: "Aprendió paciencia, disciplina y el verdadero y silencioso valor del esfuerzo diario honesto",
            tr: "Sabrı, disiplini ve dürüst günlük çabanın gerçek, sessiz değerini öğrendi",
          },
          {
            ar: "اقترح سانتياغو تحسينات صغيرة وذكية جلبت تدريجيًا زبائن جدد للمتجر",
            es: "Santiago propuso pequeñas y astutas mejoras que poco a poco atrajeron nuevos clientes a la tienda",
            tr: "Santiago, dükkâna yavaş yavaş yeni müşteriler çeken küçük, akıllıca gelişmeler önerdi",
          },
          {
            ar: "ضاعفت واجهة عرض بسيطة قرب الطريق مبيعاتهم خلال أسابيع قليلة فقط",
            es: "Una simple vitrina cerca del camino duplicó sus ventas en solo unas pocas semanas",
            tr: "Yolun yakınındaki basit bir vitrin, satışlarını sadece birkaç hafta içinde ikiye katladı",
          },
          {
            ar: "في النهاية ادّخر ما يكفي من المال لشراء أغنام والعودة بأمان إلى دياره",
            es: "Con el tiempo, ahorró suficiente dinero para comprar ovejas y regresar a casa sano y salvo",
            tr: "Sonunda koyun satın alıp güvenle evine dönmeye yetecek kadar para biriktirdi",
          },
          {
            ar: "لأمسية واحدة صدّق حقًا أن مغامرته يمكن أن تنتهي هناك وتكون كافية",
            es: "Por una noche, creyó de verdad que su aventura podría terminar allí y ser suficiente",
            tr: "Bir akşam boyunca macerasının orada bitip yeterli olabileceğine gerçekten inandı",
          },
          {
            ar: "لكنه أدرك أن الأهرامات وكنزه لا يزالان يناديانه بهدوء نحو الأمام",
            es: "Sin embargo, comprendió que las pirámides y su tesoro seguían llamándolo silenciosamente a continuar",
            tr: "Yine de piramitlerin ve hazinesinin onu sessizce ileriye doğru çağırmaya devam ettiğini anladı",
          },
          {
            ar: "اختار الحلم غير المؤكد بدلًا من الخيار الآمن والمريح أمامه",
            es: "Eligió el sueño incierto en lugar de la opción segura y cómoda que tenía delante",
            tr: "Önündeki güvenli, rahat seçenek yerine belirsiz hayali seçti",
          },
        ],
      },
      {
        title: {
          ar: "الانضمام إلى القافلة",
          es: "Uniéndose a la caravana",
          tr: "Kervana Katılmak",
        },
        sentences: [
          {
            ar: "انضم سانتياغو إلى قافلة تجارية كبيرة تعبر صحراء الصحراء الكبرى الشاسعة الخطرة",
            es: "Santiago se unió a una gran caravana comercial que cruzaba el vasto y peligroso desierto del Sahara",
            tr: "Santiago, geniş ve tehlikeli Sahra Çölü'nü geçen büyük bir ticaret kervanına katıldı",
          },
          {
            ar: "تمايلت الجمال ببطء تحت سماء لانهائية من الحر الباهر والصمت",
            es: "Los camellos se balanceaban lentamente bajo un cielo interminable de calor cegador y silencio",
            tr: "Develer, göz kamaştırıcı sıcaklık ve sessizliğin sonsuz gökyüzü altında yavaşça sallanıyordu",
          },
          {
            ar: "التقى هناك بإنجليزي فضولي يسافر لدراسة أسرار الخيمياء الحقيقية",
            es: "Allí conoció a un curioso inglés que viajaba para estudiar los secretos de la verdadera alquimia",
            tr: "Orada, gerçek simyanın sırlarını incelemek için seyahat eden meraklı bir İngiliz ile tanıştı",
          },
          {
            ar: "كان يحمل كتبًا ثقيلة ويسأل سانتياغو أسئلة لا تنتهي عن علامات الصحراء",
            es: "Cargaba libros pesados y le hacía a Santiago preguntas interminables sobre las señales del desierto",
            tr: "Ağır kitaplar taşıyor ve Santiago'ya çölün işaretleri hakkında bitmeyen sorular soruyordu",
          },
          {
            ar: "حمل الإنجليزي كتبًا كثيرة لكنه امتلك خبرة عملية قليلة غريبة بالصحراء",
            es: "El inglés llevaba muchos libros, pero curiosamente tenía poca experiencia práctica en el desierto",
            tr: "İngiliz birçok kitap taşıyordu ama garip bir şekilde çölde çok az pratik deneyime sahipti",
          },
          {
            ar: "بدأ سانتياغو يلاحظ أن الصحراء نفسها تتحدث باستمرار عبر علامات هادئة صغيرة",
            es: "Santiago comenzó a notar que el desierto mismo hablaba constantemente a través de pequeñas señales silenciosas",
            tr: "Santiago, çölün kendisinin sürekli küçük, sessiz işaretlerle konuştuğunu fark etmeye başladı",
          },
          {
            ar: "بدت الريح والرمل وطيران الطيور جميعها تحمل رسالة خفية هادئة",
            es: "El viento, la arena y el vuelo de los pájaros parecían llevar todos un mensaje silencioso y oculto",
            tr: "Rüzgar, kum ve kuşların uçuşu hepsi sessiz, gizli bir mesaj taşıyor gibiydi",
          },
          {
            ar: "تعلّم تدريجيًا قراءة الريح والرمل والنجوم تمامًا كما يقرأ الإنجليزي كتبه",
            es: "Poco a poco aprendió a leer el viento, la arena y las estrellas tal como el inglés leía sus libros",
            tr: "İngiliz kitaplarını nasıl okuyorsa, o da rüzgarı, kumu ve yıldızları öyle okumayı yavaş yavaş öğrendi",
          },
        ],
      },
      {
        title: { ar: "الواحة وفاطمة", es: "El oasis y Fátima", tr: "Vaha ve Fatıma" },
        sentences: [
          {
            ar: "توقفت القافلة بأمان عند واحة هادئة بينما اشتعلت حروب قبلية قريبة",
            es: "La caravana se detuvo a salvo en un oasis tranquilo mientras cerca se libraban guerras tribales",
            tr: "Yakında kabile savaşları sürerken kervan sakin bir vahada güvenle durdu",
          },
          {
            ar: "بدت أشجار النخيل والماء البارد وكأنها معجزة صغيرة بعد أسابيع من الرمال اللانهائية",
            es: "Las palmeras y el agua fresca se sentían como un pequeño milagro tras semanas de arena interminable",
            tr: "Hurma ağaçları ve serin su, haftalarca süren sonsuz kumdan sonra küçük bir mucize gibi hissettirdi",
          },
          {
            ar: "هناك وقع سانتياغو في حب فتاة شابة تُدعى فاطمة على الفور",
            es: "Allí, Santiago se enamoró al instante de una joven llamada Fátima",
            tr: "Orada Santiago, Fatıma adında genç bir kadına anında aşık oldu",
          },
          {
            ar: "بدت عيناها الداكنتان تحمل اليقين الهادئ نفسه الذي تحمله الصحراء ذاتها",
            es: "Sus ojos oscuros parecían tener la misma calma y certeza que el propio desierto",
            tr: "Koyu renk gözleri, çölün kendisiyle aynı sakin kesinliği taşıyor gibiydi",
          },
          {
            ar: "شجّعته بلطف على مواصلة السعي وراء كنزه بدلًا من البقاء من أجلها فقط",
            es: "Ella lo animó con dulzura a seguir persiguiendo su tesoro en lugar de quedarse solo por ella",
            tr: "Onu, sadece kendisi için kalmak yerine hazinesinin peşinden gitmeye nazikçe teşvik etti",
          },
          {
            ar: "أخبرته أن الحب الحقيقي لن يطلب منه أبدًا التخلي عن طريقه الحقيقي",
            es: "Le dijo que el amor verdadero nunca le pediría abandonar su propio camino verdadero",
            tr: "Ona gerçek aşkın kendi gerçek yolundan vazgeçmesini asla istemeyeceğini söyledi",
          },
          {
            ar: "وهو يراقب صقرين يتقاتلان أحسّ سانتياغو فجأة بهجوم مفاجئ قادم",
            es: "Observando a dos halcones luchando, Santiago presintió de repente un ataque sorpresa que se avecinaba",
            tr: "İki şahinin kavga ettiğini izlerken Santiago aniden yaklaşan bir sürpriz saldırıyı sezdi",
          },
          {
            ar: "أنقذ تحذيره الواحة وكسب له احترام وثقة الشيوخ الكبيرين",
            es: "Su advertencia salvó al oasis y le ganó el gran respeto y la confianza de los ancianos",
            tr: "Uyarısı vahayı kurtardı ve ona büyüklerin büyük saygısını ve güvenini kazandırdı",
          },
        ],
      },
      {
        title: { ar: "الخيميائي", es: "El alquimista", tr: "Simyacı" },
        sentences: [
          {
            ar: "بفضل تحذيره التقى سانتياغو أخيرًا بخيميائي صحراوي غامض حقيقي",
            es: "Gracias a su advertencia, Santiago finalmente conoció a un verdadero y misterioso alquimista del desierto",
            tr: "Uyarısı sayesinde Santiago sonunda gerçek, gizemli bir çöl simyacısıyla tanıştı",
          },
          {
            ar: "كان يرتدي السواد ولا يحمل أي مؤن ظاهرة وبدا وكأنه لا يحتاج إلى شيء على الإطلاق",
            es: "Vestido de negro y sin provisiones visibles, parecía no necesitar nada en absoluto",
            tr: "Siyahlar giyinmiş, görünür hiçbir erzakı olmayan bu adam hiçbir şeye ihtiyacı yokmuş gibi görünüyordu",
          },
          {
            ar: "وافق الخيميائي على إرشاده شخصيًا بقية الطريق نحو الأهرامات",
            es: "El alquimista accedió a guiarlo personalmente el resto del camino hacia las pirámides",
            tr: "Simyacı, piramitlere giden yolun geri kalanında ona kişisel olarak rehberlik etmeyi kabul etti",
          },
          {
            ar: "اختبره باستمرار بألغاز وصمت ومطالب صغيرة غير متوقعة",
            es: "Lo puso a prueba constantemente con acertijos, silencios y pequeñas exigencias inesperadas",
            tr: "Onu sürekli bilmecelerle, sessizlikle ve küçük beklenmedik taleplerle sınadı",
          },
          {
            ar: "علّم سانتياغو أن كل الأشياء تتشارك روحًا واحدة متصلة تُدعى روح العالم",
            es: "Le enseñó a Santiago que todas las cosas comparten una única alma conectada llamada el Alma del Mundo",
            tr: "Santiago'ya tüm şeylerin Dünya'nın Ruhu adı verilen tek, bağlantılı bir ruhu paylaştığını öğretti",
          },
          {
            ar: "قال إن حبة رمل واحدة تحمل بداخلها ذكرى الخلق بأكمله",
            es: "Dijo que un solo grano de arena lleva dentro de sí el recuerdo de toda la creación",
            tr: "Tek bir kum tanesinin içinde tüm yaratılışın anısını taşıdığını söyledi",
          },
          {
            ar: "أوضح أن الإصغاء بعناية لقلبك هو أصدق أشكال الحكمة الحقيقية",
            es: "Explicó que escuchar atentamente al propio corazón era la forma más verdadera de sabiduría real",
            tr: "Kendi kalbini dikkatle dinlemenin gerçek bilgeliğin en doğru biçimi olduğunu açıkladı",
          },
          {
            ar: "تحت إرشاده الصبور نمت شجاعة سانتياغو وفهمه الهادئ يومًا بعد يوم",
            es: "Bajo su paciente guía, el coraje y la comprensión silenciosa de Santiago crecían día a día",
            tr: "Onun sabırlı rehberliği altında Santiago'nun cesareti ve sessiz anlayışı günden güne büyüdü",
          },
        ],
      },
      {
        title: {
          ar: "اختبار قبائل الصحراء",
          es: "Puesto a prueba por las tribus del desierto",
          tr: "Çöl Kabileleri Tarafından Sınanmak",
        },
        sentences: [
          {
            ar: "قبض رجال قبليون صحراويون مرتابون على سانتياغو والخيميائي أثناء سفرهما",
            es: "Unos recelosos hombres tribales del desierto capturaron a Santiago y al alquimista mientras viajaban",
            tr: "Şüpheci çöl kabilesi mensupları, yolculuk ederlerken Santiago ve simyacıyı ele geçirdi",
          },
          {
            ar: "أحاطت بهم البنادق والعيون الحادة المرتابة تحت سماء المساء المعتمة",
            es: "Rifles y ojos duros y recelosos los rodearon bajo el cielo oscurecido de la tarde",
            tr: "Kararan akşam gökyüzü altında tüfekler ve sert, şüpheci gözler onları çevreledi",
          },
          {
            ar: "لإثبات جدارته تحدّى سانتياغو ليحول نفسه إلى الريح",
            es: "Para probar su valor, Santiago fue desafiado a transformarse a sí mismo en el viento",
            tr: "Değerini kanıtlamak için Santiago'ya kendisini rüzgara dönüştürmesi meydan okundu",
          },
          {
            ar: "راقب زعيم القبيلة عن كثب وذراعاه متقاطعتان متوقعًا بوضوح فشله التام",
            es: "El jefe tribal observaba de cerca, con los brazos cruzados, esperando claramente que fracasara por completo",
            tr: "Kabile reisi kollarını kavuşturmuş, açıkça tamamen başarısız olmasını bekleyerek yakından izliyordu",
          },
          {
            ar: "مرعوبًا في البداية أغمض عينيه وتحدث بهدوء ومباشرة إلى الصحراء",
            es: "Aterrado al principio, cerró los ojos y habló tranquila y directamente al desierto",
            tr: "Başta dehşete kapılan Santiago gözlerini kapattı ve çöle sakin, doğrudan bir şekilde seslendi",
          },
          {
            ar: "طلب من الريح والشمس والسماء نفسها مساعدتها الصبورة",
            es: "Pidió al viento, al sol y al propio cielo su ayuda paciente",
            tr: "Rüzgardan, güneşten ve gökyüzünün kendisinden sabırlı yardımlarını istedi",
          },
          {
            ar: "بتركيز تام استحضر بنجاح عاصفة رملية قوية ومفاجئة حوله",
            es: "Con total concentración, logró invocar una poderosa y repentina tormenta de arena a su alrededor",
            tr: "Tam bir konsantrasyonla etrafında güçlü, ani bir kum fırtınası çağırmayı başardı",
          },
          {
            ar: "معجبين للغاية أطلق رجال القبائل سراح المسافرَين باحترام ليواصلا رحلتهما",
            es: "Profundamente impresionados, los tribales liberaron respetuosamente a ambos viajeros para que continuaran su viaje",
            tr: "Derinden etkilenen kabile mensupları, iki gezgini yolculuklarına devam etmeleri için saygıyla serbest bıraktı",
          },
        ],
      },
      {
        title: {
          ar: "الوصول إلى الأهرامات",
          es: "Llegando a las pirámides",
          tr: "Piramitlere Varış",
        },
        sentences: [
          {
            ar: "وصل سانتياغو أخيرًا إلى الأهرامات الشامخة القديمة التي حلم بها طويلًا",
            es: "Santiago finalmente llegó a las imponentes y antiguas pirámides con las que había soñado durante tanto tiempo",
            tr: "Santiago sonunda uzun zamandır hayalini kurduğu yüksek, kadim piramitlere ulaştı",
          },
          {
            ar: "انسكب ضوء القمر الفضي عبر الكثبان اللانهائية الممتدة أمامه",
            es: "La luz plateada de la luna se derramaba sobre las dunas interminables que se extendían ante él",
            tr: "Gümüşi ay ışığı, önünde uzanan sonsuz kum tepelerinin üzerine döküldü",
          },
          {
            ar: "بينما كان يحفر بأمل بحثًا عن الكنز هاجمه لصوص وضربوه بشدة فجأة",
            es: "Mientras excavaba esperanzado en busca del tesoro, unos ladrones lo atacaron de repente y lo golpearon brutalmente",
            tr: "Hazineyi umutla kazarken hırsızlar aniden ona saldırıp acımasızca dövdü",
          },
          {
            ar: "تركوه مصابًا بالكدمات ومنهك الأنفاس وخالي الوفاض بجانب حفرته غير المكتملة",
            es: "Lo dejaron magullado, sin aliento y con las manos vacías junto a su hoyo inacabado",
            tr: "Onu morarmış, nefes nefese ve elleri boş, bitmemiş çukurunun yanında bıraktılar",
          },
          {
            ar: "روى أحد اللصوص ساخرًا حلمه المتكرر الخاص عن كنز مدفون في مكان آخر تمامًا",
            es: "Uno de los ladrones, burlón, describió su propio sueño recurrente sobre un tesoro enterrado en otro lugar completamente distinto",
            tr: "Hırsızlardan biri alaycı bir şekilde, tamamen başka bir yerde gömülü bir hazine hakkındaki kendi yinelenen rüyasını anlattı",
          },
          {
            ar: "ضحك وهو يصف كنيسة قديمة مهدّمة وشجرة جميز بعيدة عبر البحر",
            es: "Se rió describiendo una vieja iglesia en ruinas y un sicomoro al otro lado del mar",
            tr: "Denizin ötesindeki eski, yıkık bir kilise ve bir çınar ağacını anlatırken güldü",
          },
          {
            ar: "أشار حلم اللص دون أن يدري إلى نقطة انطلاق سانتياغو الأصلية نفسها",
            es: "El sueño del ladrón apuntaba, sin saberlo, de vuelta al propio punto de partida original de Santiago",
            tr: "Hırsızın rüyası, farkında olmadan Santiago'nun kendi orijinal başlangıç noktasına işaret ediyordu",
          },
          {
            ar: "أدرك سانتياغو بدهشة هادئة أن كنزه كان قريبًا من داره طوال الوقت",
            es: "Santiago comprendió con tranquilo asombro que su tesoro había estado cerca de casa todo el tiempo",
            tr: "Santiago, hazinesinin tüm bu süre boyunca evinin yakınında olduğunu sessiz bir hayretle fark etti",
          },
        ],
      },
      {
        title: { ar: "العودة إلى الديار", es: "El regreso a casa", tr: "Eve Dönüş" },
        sentences: [
          {
            ar: "سافر سانتياغو طوال الطريق عائدًا إلى الحقل نفسه الذي نام فيه يومًا ما",
            es: "Santiago viajó todo el camino de vuelta al mismo campo donde una vez había dormido",
            tr: "Santiago, bir zamanlar uyuduğu aynı tarlaya kadar tüm yolu geri gitti",
          },
          {
            ar: "وقفت أطلال الكنيسة القديمة تمامًا كما تذكرها تحت السماء الواسعة نفسها",
            es: "Las ruinas de la vieja iglesia se alzaban exactamente como las recordaba, bajo el mismo amplio cielo",
            tr: "Eski kilisenin harabeleri, aynı geniş gökyüzü altında tam olarak hatırladığı gibi duruyordu",
          },
          {
            ar: "بالحفر أسفل شجرة جميز عتيقة اكتشف أخيرًا صندوق كنز حقيقي مخبأ",
            es: "Cavando bajo un antiguo sicomoro, finalmente descubrió un auténtico cofre de tesoro escondido",
            tr: "Eski bir çınar ağacının altını kazarken sonunda gerçek, saklı bir hazine sandığı buldu",
          },
          {
            ar: "التقطت العملات الذهبية والمجوهرات ضوء الصباح الباكر وهو يرفع الغطاء الثقيل",
            es: "Las monedas de oro y las joyas captaron la luz de la mañana mientras levantaba la pesada tapa",
            tr: "Ağır kapağı kaldırırken altın paralar ve mücevherler sabah ışığını yakaladı",
          },
          {
            ar: "أدرك أخيرًا أن الرحلة نفسها هي ما شكّله وغيّره حقًا تمامًا",
            es: "Finalmente comprendió que el viaje mismo era lo que verdaderamente lo había moldeado y transformado por completo",
            tr: "Sonunda, kendisini gerçekten şekillendirip tamamen değiştirenin yolculuğun kendisi olduğunu anladı",
          },
          {
            ar: "أدرك أن الكنز وحده ما كان ليعني الكثير أبدًا دون الطريق الطويل الذي سبقه",
            es: "Comprendió que el tesoro solo nunca podría haber significado tanto sin el largo camino que lo precedió",
            tr: "Hazinenin tek başına, ondan önceki uzun yol olmadan asla bu kadar anlam ifade edemeyeceğini fark etti",
          },
          {
            ar: "مثّل الكنز الثروة المادية الحقيقية والحكمة الأعمق التي اكتسبها سانتياغو معًا",
            es: "El tesoro representaba tanto la riqueza material real como la sabiduría más profunda que Santiago había adquirido",
            tr: "Hazine hem gerçek maddi zenginliği hem de Santiago'nun kazandığı daha derin bilgeliği temsil ediyordu",
          },
          {
            ar: "تنتهي رواية الخيميائي بسانتياغو وهو مستعد أخيرًا للعودة مرة أخرى للبحث عن فاطمة",
            es: "El Alquimista termina con Santiago finalmente listo para regresar una vez más en busca de Fátima",
            tr: "Simyacı, Santiago'nun sonunda Fatıma'yı bulmak için bir kez daha geri dönmeye hazır olmasıyla sona erer",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-frankenstein",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة ماري شيلي عن خلق فيكتور فرانكشتاين المحرَّم والمخلوق الوحيد الذي لم يستطع الهروب منه أبدًا — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Mary Shelley sobre la creación prohibida de Victor Frankenstein y la solitaria criatura de la que nunca pudo escapar realmente — un relato personal, no el texto original.",
      tr: "Mary Shelley'nin, Victor Frankenstein'ın yasak yaratımı ve asla gerçekten kaçamadığı yalnız yaratık hakkındaki hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: { ar: "هوس فيكتور", es: "La obsesión de Victor", tr: "Victor'un Saplantısı" },
        sentences: [
          {
            ar: "نشأ فيكتور فرانكشتاين في جنيف مسحورًا بالعلم وأسرار الحياة نفسها",
            es: "Victor Frankenstein creció en Ginebra fascinado por la ciencia y los misterios de la vida misma",
            tr: "Victor Frankenstein, Cenevre'de bilim ve hayatın kendi sırlarına hayran olarak büyüdü",
          },
          {
            ar: "ترك منزله إلى الجامعة وهو يحترق بطموح لاكتشاف أعمق أسرار الطبيعة الخفية",
            es: "Dejó su hogar para ir a la universidad, ardiendo de ambición por descubrir los secretos más profundos de la naturaleza",
            tr: "Doğanın en derin gizli sırlarını ortaya çıkarma tutkusuyla yanarak üniversiteye gitmek için evinden ayrıldı",
          },
          {
            ar: "وحيدًا في شقته الصغيرة درس التشريح والكيمياء والحدود الهشة بين الحياة والموت",
            es: "Solo en su pequeño apartamento estudiaba anatomía, química y la frágil frontera entre la vida y la muerte",
            tr: "Küçük dairesinde tek başına anatomi, kimya ve yaşamla ölüm arasındaki kırılgan sınırı inceledi",
          },
          {
            ar: "تداخلت الأيام والليالي بينما استهلكه هدفه الوحيد المهووس تمامًا",
            es: "Los días y las noches se confundían mientras su único objetivo obsesivo lo consumía por completo",
            tr: "Tek saplantılı hedefi onu tamamen tükettikçe gündüzler ve geceler birbirine karıştı",
          },
          {
            ar: "أصبح مقتنعًا بأنه يستطيع اكتشاف الشرارة السرية التي تمنح المادة الجامدة النَفَس",
            es: "Se convenció de que podía descubrir la chispa secreta que da aliento a la materia sin vida",
            tr: "Cansız maddeye nefes veren gizli kıvılcımı keşfedebileceğine ikna oldu",
          },
          {
            ar: "بدأ ببطء وسرية بجمع المواد لتجربة لن يجرؤ أحد آخر على القيام بها",
            es: "Lentamente y en secreto comenzó a reunir materiales para un experimento que nadie más se atrevería a intentar",
            tr: "Yavaşça ve gizlice, başka hiç kimsenin denemeye cesaret edemeyeceği bir deney için malzemeler toplamaya başladı",
          },
          {
            ar: "لاحظ أساتذته وأصدقاؤه إرهاقه المتزايد لكنه تجاهل كل تحذير لطيف",
            es: "Sus profesores y amigos notaron su creciente agotamiento, pero él ignoró cada advertencia amable",
            tr: "Profesörleri ve arkadaşları artan bitkinliğini fark etti ama o her nazik uyarıyı görmezden geldi",
          },
          {
            ar: "استمر فيكتور وحيدًا معتقدًا أنه يقف على حافة أعظم اكتشاف للإنسانية",
            es: "Victor siguió adelante solo, creyendo que estaba al borde del mayor descubrimiento de la humanidad",
            tr: "Victor, insanlığın en büyük keşfinin eşiğinde olduğuna inanarak tek başına ilerlemeye devam etti",
          },
        ],
      },
      {
        title: { ar: "الخَلق", es: "La creación", tr: "Yaratılış" },
        sentences: [
          {
            ar: "جمّع فيكتور شكلًا بشريًا كبيرًا قطعة بقطعة عاملًا خلال ليالٍ طويلة معزولة",
            es: "Victor ensambló una gran forma humana pieza por pieza, trabajando durante largas noches aisladas",
            tr: "Victor, uzun ve yalnız geceler boyunca çalışarak büyük bir insan formunu parça parça birleştirdi",
          },
          {
            ar: "اختار كل جزء بعناية على أمل أن يجعل حجمها وقوتها المجتمعة خلقه كاملًا بلا عيب",
            es: "Eligió cada parte con cuidado, esperando que su tamaño y fuerza combinados hicieran perfecta a su creación",
            tr: "Birleşik boyut ve gücün yaratımını kusursuz kılacağını umarak her parçayı dikkatle seçti",
          },
          {
            ar: "أومض البرق خارج نافذة مختبره في الليلة التي حاول فيها أخيرًا إشعال شرارة الحياة",
            es: "Un rayo destelló fuera de la ventana de su laboratorio la noche en que finalmente intentó la chispa de la vida",
            tr: "Hayatın kıvılcımını sonunda denediği gece laboratuvarının penceresinin dışında şimşek çaktı",
          },
          {
            ar: "أزّت أجهزته وطقطقت بينما اندفعت الكهرباء عبر الجسد الضخم الساكن",
            es: "Sus instrumentos zumbaban y crepitaban mientras la electricidad recorría el todavía enorme cuerpo",
            tr: "Elektrik, hâlâ hareketsiz duran devasa bedende dolaşırken aletleri vınlayıp çatırdadı",
          },
          {
            ar: "فجأة انفتحت عيناه الصفراوان وارتفع صدره بنَفَس طويل متقطع",
            es: "De repente, sus ojos amarillos se abrieron y su pecho se elevó con una larga y áspera bocanada de aire",
            tr: "Aniden sarı gözleri açıldı ve göğsü uzun, düzensiz bir nefesle kabardı",
          },
          {
            ar: "تحرك المخلوق بارتباك ممدًا يده المرتجفة البريئة نحو خالقه",
            es: "La criatura se movió torpemente, extendiendo una mano inocente y temblorosa hacia su creador",
            tr: "Yaratık sakarca kıpırdandı ve masum, titreyen bir elle yaratıcısına uzandı",
          },
          {
            ar: "بدلًا من الانتصار شعر فيكتور فقط برعب مفاجئ طاغٍ مما صنعه بالفعل",
            es: "En lugar de triunfo, Victor solo sintió un horror súbito y abrumador por lo que realmente había creado",
            tr: "Zafer yerine Victor, gerçekten yarattığı şeyden ani ve ezici bir dehşet duydu",
          },
          {
            ar: "حدّق في المخلوق المتشنج مدركًا أن الجمال تحول بطريقة ما إلى شيء وحشي",
            es: "Miró fijamente a la criatura que se sacudía, comprendiendo que la belleza se había convertido de alguna manera en algo monstruoso",
            tr: "Seğiren yaratığa bakarken güzelliğin bir şekilde canavarca bir şeye dönüştüğünü fark etti",
          },
        ],
      },
      {
        title: { ar: "التخلي", es: "El abandono", tr: "Terk Ediş" },
        sentences: [
          {
            ar: "غير قادر على تحمل رؤية خلقه هرب فيكتور من المختبر في ذعر أعمى",
            es: "Incapaz de soportar la vista de su creación, Victor huyó del laboratorio en un pánico ciego",
            tr: "Yaratımının görüntüsüne dayanamayan Victor, kör bir panikle laboratuvardan kaçtı",
          },
          {
            ar: "تجول في الشوارع طوال الليل محاولًا بشدة الهروب مما فعله للتو",
            es: "Vagó por las calles toda la noche, intentando desesperadamente huir de lo que acababa de hacer",
            tr: "Az önce yaptığı şeyden umutsuzca kaçmaya çalışarak bütün gece sokaklarda dolaştı",
          },
          {
            ar: "عندما عاد أخيرًا إلى منزله كان المخلوق قد اختفى بالفعل دون أي أثر",
            es: "Cuando finalmente regresó a casa, la criatura ya había desaparecido sin dejar rastro alguno",
            tr: "Sonunda eve döndüğünde yaratık hiçbir iz bırakmadan çoktan kaybolmuştu",
          },
          {
            ar: "لم يخبر فيكتور أحدًا بالحقيقة ودفن سره الرهيب عميقًا في داخله",
            es: "Victor no le contó la verdad a nadie, enterrando su terrible secreto profundamente dentro de sí mismo",
            tr: "Victor kimseye gerçeği söylemedi ve korkunç sırrını içinde derinlere gömdü",
          },
          {
            ar: "مرض بشدة لأسابيع معذبًا بالشعور بالذنب والحمى والكوابيس المستمرة",
            es: "Cayó gravemente enfermo durante semanas, atormentado por la culpa, la fiebre y pesadillas constantes",
            tr: "Suçluluk, ateş ve sürekli kabuslarla eziyet çekerek haftalarca ağır hasta düştü",
          },
          {
            ar: "في الوقت نفسه تجول المخلوق المتخلى عنه وحيدًا مرتبكًا خائفًا وبلا صديق تمامًا",
            es: "Mientras tanto, la criatura abandonada vagaba sola, confundida, asustada y completamente sin amigos",
            tr: "Bu arada terk edilmiş yaratık yalnız, kafası karışmış, korkmuş ve tamamen arkadaşsız dolaşıyordu",
          },
          {
            ar: "صرخ القرويون الذين رأوه وطردوه بالحجارة والمشاعل المشتعلة",
            es: "Los aldeanos que lo vieron gritaron y lo ahuyentaron con piedras y antorchas encendidas",
            tr: "Onu gören köylüler çığlık attı ve taşlar ile yanan meşalelerle onu kovaladı",
          },
          {
            ar: "تعلّم المخلوق تدريجيًا أن مظهره وحده كافٍ لإلهام الكراهية فقط",
            es: "La criatura fue aprendiendo poco a poco que su sola apariencia bastaba para inspirar únicamente odio",
            tr: "Yaratık, sadece görünüşünün bile yalnızca nefret uyandırmaya yettiğini yavaş yavaş öğrendi",
          },
        ],
      },
      {
        title: { ar: "المخلوق يتعلّم", es: "La criatura aprende", tr: "Yaratık Öğreniyor" },
        sentences: [
          {
            ar: "مختبئًا قرب بيت ريفي معزول صغير راقب المخلوق سرًا عائلة فقيرة طيبة",
            es: "Escondido cerca de una pequeña cabaña aislada, la criatura observaba en secreto a una familia pobre y bondadosa",
            tr: "Küçük, tenha bir kulübenin yakınında saklanan yaratık, yoksul ve iyi kalpli bir aileyi gizlice izledi",
          },
          {
            ar: "بمراقبته من شق في الجدار تعلّم لغتهم تدريجيًا يومًا بعد يوم",
            es: "Observando a través de una grieta en la pared, aprendió su idioma poco a poco, día tras día",
            tr: "Duvardaki bir çatlaktan izleyerek gün geçtikçe onların dilini yavaşça öğrendi",
          },
          {
            ar: "أعجب بحبهم اللطيف لبعضهم البعض واشتاق بهدوء لتلك الرابطة نفسها",
            es: "Admiraba su tierno afecto mutuo y anhelaba en silencio esa misma conexión",
            tr: "Birbirlerine olan nazik sevgilerine hayran kaldı ve sessizce aynı bağı özledi",
          },
          {
            ar: "جمع لهم الحطب سرًا في الليل راغبًا بشدة في كسب ثقتهم",
            es: "En secreto, les recogía leña por las noches, deseando desesperadamente ganarse su confianza",
            tr: "Gizlice geceleri onlar için odun topladı, güvenlerini kazanmayı çok istiyordu",
          },
          {
            ar: "قرأ كتبًا تُركت قريبًا متعلمًا ليس فقط الكلمات بل أفكار الفقد والانتماء",
            es: "Leyó libros que habían dejado cerca, aprendiendo no solo palabras sino ideas de pérdida y pertenencia",
            tr: "Yakınlarda bırakılan kitapları okuyarak sadece kelimeleri değil, kayıp ve ait olma kavramlarını da öğrendi",
          },
          {
            ar: "في يوم ما جمع شجاعته أخيرًا واقترب بلطف من الأب الأعمى العجوز للعائلة",
            es: "Un día finalmente reunió su valor y se acercó con delicadeza al anciano padre ciego de la familia",
            tr: "Bir gün sonunda cesaretini topladı ve ailenin kör yaşlı babasına nazikçe yaklaştı",
          },
          {
            ar: "بينما بدآ يتحدثان بلطف عاد باقي أفراد العائلة ورأوا وجهه",
            es: "Justo cuando empezaban a hablar amablemente, los demás miembros de la familia regresaron y vieron su rostro",
            tr: "Nazikçe konuşmaya başladıkları sırada ailenin diğer üyeleri döndü ve yüzünü gördü",
          },
          {
            ar: "صرخوا رعبًا وطردوه بعنف تمامًا كما فعل الجميع قبلهم",
            es: "Gritaron de terror y lo alejaron violentamente, exactamente como todos los demás antes",
            tr: "Dehşet içinde çığlık attılar ve ondan öncekiler gibi onu şiddetle kovdular",
          },
        ],
      },
      {
        title: { ar: "طلب رفيقة", es: "Una petición de compañía", tr: "Bir Eş İsteği" },
        sentences: [
          {
            ar: "مفطور القلب وغاضبًا تتبع المخلوق فيكتور حتى الجبال الجليدية العالية",
            es: "Con el corazón roto y enfurecida, la criatura rastreó a Victor hasta lo alto de las montañas heladas",
            tr: "Kalbi kırık ve öfkeli olan yaratık, Victor'u buzlu dağların yükseklerinde buldu",
          },
          {
            ar: "واجه خالقه مطالبًا أن يُسمع أخيرًا بعد كل هذا العذاب القاسي",
            es: "Se enfrentó a su creador, exigiendo ser finalmente escuchado tras tanto sufrimiento cruel",
            tr: "Bu kadar acımasız ıstırabın ardından sonunda dinlenmeyi talep ederek yaratıcısıyla yüzleşti",
          },
          {
            ar: "وصف عزلته ورفضه وجوعه اليائس لصداقة بسيطة",
            es: "Describió su soledad, su rechazo y su hambre desesperada de una simple compañía",
            tr: "Yalnızlığını, reddedilişini ve basit bir arkadaşlığa olan umutsuz açlığını anlattı",
          },
          {
            ar: "جادل بأن فيكتور يتحمل المسؤولية الكاملة عن بؤس خلقه المتخلى عنه",
            es: "Argumentó que Victor cargaba con toda la responsabilidad de la miseria de su propia creación abandonada",
            tr: "Kendi terk edilmiş yaratımının sefaletinden Victor'un tam sorumlu olduğunu savundu",
          },
          {
            ar: "طلب المخلوق من فيكتور أن يخلق رفيقة واحدة وحيدة مثله تمامًا",
            es: "La criatura exigió que Victor creara una sola compañera tan solitaria como él mismo",
            tr: "Yaratık, Victor'dan kendisi kadar yalnız tek bir eş yaratmasını talep etti",
          },
          {
            ar: "وعد بأنه مع رفيقة سيختفي للأبد في برية بعيدة",
            es: "Prometió que con una compañera desaparecería para siempre en algún páramo lejano",
            tr: "Bir eşle birlikte uzak bir vahşi doğaya sonsuza dek kaybolacağına söz verdi",
          },
          {
            ar: "متأثرًا رغمًا عنه بألم المخلوق الصادق وافق فيكتور بتردد على المحاولة",
            es: "Conmovido a pesar de sí mismo por el dolor puro de la criatura, Victor accedió a regañadientes a intentarlo",
            tr: "Yaratığın çıplak acısından istemsizce etkilenen Victor, isteksizce denemeyi kabul etti",
          },
          {
            ar: "عاد إلى منزله مضطربًا يخشى بالفعل المهمة الرهيبة التي تنتظره الآن",
            es: "Regresó a casa preocupado, temiendo ya la terrible tarea que ahora lo esperaba",
            tr: "Şimdi önünde bekleyen korkunç görevden çoktan dehşete düşerek endişeli bir halde eve döndü",
          },
        ],
      },
      {
        title: { ar: "رفض فيكتور", es: "La negativa de Victor", tr: "Victor'un Reddi" },
        sentences: [
          {
            ar: "سافر فيكتور إلى بيت ريفي بعيد وبدأ سرًا ببناء مخلوق حي ثانٍ",
            es: "Victor viajó a una cabaña remota y comenzó en secreto a construir una segunda criatura viviente",
            tr: "Victor uzak bir kulübeye gitti ve gizlice ikinci bir canlı yaratık inşa etmeye başladı",
          },
          {
            ar: "تسلل الشك بثبات بينما تخيل جنسًا جديدًا كاملًا من كائنات وحشية قوية",
            es: "La duda se fue instalando mientras imaginaba toda una nueva raza de seres monstruosos y poderosos",
            tr: "Güçlü, canavarca varlıklardan oluşan tamamen yeni bir ırk hayal ederken şüphe içine sızmaya başladı",
          },
          {
            ar: "طغى خوفه مما قد تفعله هذه المخلوقات يومًا ما على وعده المتردد السابق",
            es: "El miedo a lo que tales criaturas pudieran hacer algún día venció su anterior promesa reticente",
            tr: "Bu yaratıkların bir gün ne yapabileceğine dair korku, önceki isteksiz vaadini bastırdı",
          },
          {
            ar: "في ليلة مظلمة دمّر فيكتور الرفيقة غير المكتملة أمام عيني المخلوق مباشرة",
            es: "Una noche oscura, Victor destruyó a la compañera inacabada justo ante los propios ojos de la criatura",
            tr: "Karanlık bir gecede Victor, bitmemiş eşi doğrudan yaratığın gözlerinin önünde yok etti",
          },
          {
            ar: "شاهد المخلوق بعدم تصديق بينما تُمزَّق أمله الوحيد في الرفقة",
            es: "La criatura observó con incredulidad cómo su única esperanza de compañía era destrozada",
            tr: "Yaratık, arkadaşlık için tek umudunun parçalandığını inanamayarak izledi",
          },
          {
            ar: "تحول حزنه فورًا إلى نذر بارد ومرعب بالانتقام الكامل",
            es: "Su dolor se transformó al instante en un frío y terrible juramento de venganza total",
            tr: "Kederi anında tam bir intikam için soğuk ve korkunç bir yemine dönüştü",
          },
          {
            ar: "أقسم أن فيكتور سيتألم بعمق مثل ما تألم هو نفسه",
            es: "Juró que Victor sufriría tan profundamente como él mismo había sufrido",
            tr: "Victor'un kendisinin çektiği kadar derin bir şekilde çekeceğine yemin etti",
          },
          {
            ar: "بالكاد استوعب فيكتور تحذير المخلوق المرعب قبل أن يختفي في الليل",
            es: "Victor apenas asimiló la escalofriante advertencia de la criatura antes de que esta desapareciera en la noche",
            tr: "Victor, yaratığın ürpertici uyarısını gecenin içinde kaybolmadan önce zar zor kavradı",
          },
        ],
      },
      {
        title: { ar: "انتقام المخلوق", es: "La venganza de la criatura", tr: "Yaratığın İntikamı" },
        sentences: [
          {
            ar: "بعد ذلك بوقت قصير وُجد صديق فيكتور العزيز هنري كليرفال مقتولًا في ظروف غامضة",
            es: "Poco después, Henry Clerval, el querido amigo de Victor, fue hallado asesinado en circunstancias misteriosas",
            tr: "Kısa süre sonra Victor'un sevgili arkadaşı Henry Clerval, gizemli koşullarda öldürülmüş bulundu",
          },
          {
            ar: "اشتبه فيكتور فورًا في المخلوق رغم أن أحدًا آخر لن يصدق قصته أبدًا",
            es: "Victor sospechó de inmediato de la criatura, aunque nadie más creería jamás su historia",
            tr: "Victor hemen yaratıktan şüphelendi, ancak başka hiç kimse hikayesine inanmayacaktı",
          },
          {
            ar: "منكسرًا ومنهكًا تزوج أخيرًا حبيبته إليزابيث أملًا في قدر من السلام",
            es: "Afligido y agotado, finalmente se casó con su amada Elizabeth, esperando algo de paz",
            tr: "Kederli ve tükenmiş bir halde, biraz huzur umarak sonunda sevgili Elizabeth ile evlendi",
          },
          {
            ar: "في ليلة زفافهما فتّش فيكتور كل غرفة متأكدًا أن الخطر قريب بطريقة ما",
            es: "En su noche de bodas, Victor revisó cada habitación, seguro de que el peligro estaba cerca de algún modo",
            tr: "Düğün gecelerinde Victor, tehlikenin bir şekilde yakında olduğundan emin olarak her odayı aradı",
          },
          {
            ar: "خرج للحظة إلى الخارج وسمع صرخة رهيبة واحدة من غرفة نومهما",
            es: "Salió afuera por un momento y escuchó un único y terrible grito proveniente de su habitación",
            tr: "Bir anlığına dışarı çıktı ve yatak odalarından tek, korkunç bir çığlık duydu",
          },
          {
            ar: "عاد مسرعًا فوجد إليزابيث بلا حياة بينما شكل المخلوق الوحشي يفرّ من النافذة",
            es: "Corriendo de vuelta, encontró a Elizabeth sin vida mientras la monstruosa figura de la criatura huía por la ventana",
            tr: "Aceleyle geri döndüğünde Elizabeth'i cansız buldu, yaratığın canavarca silueti pencereden kaçıyordu",
          },
          {
            ar: "حلّ حزن وغضب طاغيان محل أي سلام سمح فيكتور لنفسه بالشعور به لفترة قصيرة",
            es: "Un dolor y una furia abrumadores reemplazaron la breve paz que Victor se había permitido sentir",
            tr: "Victor'un kısaca hissetmesine izin verdiği huzurun yerini bunaltıcı bir keder ve öfke aldı",
          },
          {
            ar: "قرر في تلك اللحظة تعقب المخلوق حتى أقاصي الأرض",
            es: "Decidió entonces y allí mismo perseguir a la criatura hasta los últimos confines de la tierra",
            tr: "O anda ve orada yaratığı dünyanın en uçlarına kadar avlamaya karar verdi",
          },
        ],
      },
      {
        title: { ar: "الحزن والمطاردة", es: "Duelo y persecución", tr: "Keder ve Takip" },
        sentences: [
          {
            ar: "توفي والد فيكتور نفسه بعد ذلك بقلب منكسر من سلسلة المآسي التي لا تنتهي لعائلته",
            es: "El propio padre de Victor murió poco después, con el corazón roto por la interminable serie de tragedias familiares",
            tr: "Victor'un babası, ailenin bitmeyen trajedi zinciri yüzünden kısa süre sonra kalbi kırık bir halde öldü",
          },
          {
            ar: "وحيدًا الآن وبلا شيء يخشى فقدانه كرّس فيكتور كل ما تبقى منه للانتقام",
            es: "Ahora solo y sin nada más que perder, Victor dedicó cada gramo restante de sí mismo a la venganza",
            tr: "Artık yapayalnız ve kaybedecek hiçbir şeyi kalmayan Victor, kalan tüm gücünü intikama adadı",
          },
          {
            ar: "تعقب أثر المخلوق عبر البلدان ناجيًا بالغضب لا بأي أمل حقيقي",
            es: "Siguió el rastro de la criatura a través de países, sobreviviendo con rabia en lugar de con esperanza real",
            tr: "Yaratığın izini ülkeler boyunca takip etti, gerçek bir umuttan çok öfkeyle hayatta kaldı",
          },
          {
            ar: "بقي المخلوق دائمًا بعيدًا عن متناول يده تاركًا رسائل استهزاء منقوشة على الأشجار والحجارة",
            es: "La criatura siempre se mantenía fuera de su alcance, dejando notas burlonas grabadas en árboles y piedras",
            tr: "Yaratık her zaman erişilemeyecek kadar uzakta kalarak ağaçlara ve taşlara kazınmış alaycı notlar bıraktı",
          },
          {
            ar: "تحدث القرويون على طول الطريق بخوف عن شكل ضخم سريع يتحرك خلال الليل",
            es: "Los aldeanos por el camino hablaban con temor de una enorme y veloz figura que se movía en la noche",
            tr: "Yol boyunca köylüler, geceleri hareket eden büyük ve hızlı bir figürden korkuyla bahsetti",
          },
          {
            ar: "تدهورت صحة فيكتور تدريجيًا لكن مطاردته المهووسة لم تزدد إلا قوة",
            es: "La salud de Victor se deterioraba constantemente, pero su persecución obsesiva solo se hacía más fuerte",
            tr: "Victor'un sağlığı sürekli bozuldu ama saplantılı takibi sadece daha da güçlendi",
          },
          {
            ar: "في النهاية قاده الأثر إلى الصحاري الجليدية الشاسعة في الشمال القطبي اللامتناهي",
            es: "Finalmente, el rastro lo llevó a las vastas y heladas tierras del interminable norte ártico",
            tr: "Sonunda iz, onu sonsuz Kuzey Kutbu'nun uçsuz bucaksız donmuş çorak arazilerine götürdü",
          },
          {
            ar: "هناك وبمحض الصدفة أنقذه أخيرًا من الجليد قبطان سفينة عابرة يُدعى والتون",
            es: "Allí, por casualidad, un capitán de un barco que pasaba llamado Walton finalmente lo rescató del hielo",
            tr: "Orada tesadüfen, Walton adında geçmekte olan bir gemi kaptanı onu sonunda buzdan çıkardı",
          },
        ],
      },
      {
        title: {
          ar: "مطاردة القطب الشمالي",
          es: "La persecución en el Ártico",
          tr: "Kuzey Kutbu Takibi",
        },
        sentences: [
          {
            ar: "رعى القبطان والتون فيكتور المنهك المحتضر على متن سفينته المحاصرة عميقًا في الجليد",
            es: "El capitán Walton cuidó al exhausto y moribundo Victor a bordo de su barco, atrapado en lo profundo del hielo",
            tr: "Kaptan Walton, buzun içinde derinlerde sıkışıp kalan gemisinde bitkin, ölmekte olan Victor'a baktı",
          },
          {
            ar: "روى فيكتور قصته الغريبة المأساوية كاملة لوالتون خلال ليالٍ طويلة متجمدة عديدة",
            es: "Victor le contó a Walton toda su extraña y trágica historia durante muchas largas noches heladas",
            tr: "Victor, tüm garip ve trajik hikayesini birçok uzun, dondurucu gece boyunca Walton'a anlattı",
          },
          {
            ar: "حذّر والتون بشدة من مطاردة المعرفة المحرَّمة بتهور كما فعل هو نفسه ذات مرة",
            es: "Advirtió urgentemente a Walton contra perseguir conocimiento prohibido tan imprudentemente como él mismo lo había hecho",
            tr: "Walton'ı bir zamanlar kendisinin yaptığı gibi yasak bilgiyi pervasızca kovalamaması için aciliyetle uyardı",
          },
          {
            ar: "استمع والتون برعب متزايد وتعاطف هادئ مع الرجل المنكسر أمامه",
            es: "Walton escuchaba con creciente horror y silenciosa compasión por el hombre destrozado frente a él",
            tr: "Walton, önündeki kırılmış adama artan bir dehşet ve sessiz bir sempatiyle kulak verdi",
          },
          {
            ar: "استمرت صحة فيكتور بالتدهور سريعًا رغم كل جهد يائس ودقيق من الطاقم",
            es: "La salud de Victor seguía deteriorándose rápidamente a pesar de todos los esfuerzos desesperados y cuidadosos de la tripulación",
            tr: "Mürettebatın her umutsuz ve dikkatli çabasına rağmen Victor'un sağlığı hızla bozulmaya devam etti",
          },
          {
            ar: "تحدث عن المخلوق باستمرار متأكدًا أنه لا يزال يرصد من مكان ما هناك",
            es: "Hablaba constantemente de la criatura, seguro de que todavía estaba en algún lugar observando",
            tr: "Yaratığın hâlâ dışarıda bir yerde izlediğinden emin olarak ondan sürekli bahsetti",
          },
          {
            ar: "حتى الآن وهو محترق بالحمى أقسم فيكتور أنه سيكمل مطاردته الرهيبة إن استطاع",
            es: "Incluso ahora, consumido por la fiebre, Victor juró que terminaría su terrible cacería si pudiera",
            tr: "Hâlâ ateşler içinde yanan Victor, elinden gelse korkunç avını tamamlayacağına yemin etti",
          },
          {
            ar: "وعد والتون بجدية بتسجيل كل كلمة من اعتراف فيكتور الاستثنائي بأمانة",
            es: "Walton prometió solemnemente registrar fielmente cada palabra de la extraordinaria confesión de Victor",
            tr: "Walton, Victor'un olağanüstü itirafının her kelimesini sadakatle kaydedeceğine ciddiyetle söz verdi",
          },
        ],
      },
      {
        title: {
          ar: "موت فيكتور ووداع المخلوق",
          es: "La muerte de Victor y la despedida de la criatura",
          tr: "Victor'un Ölümü ve Yaratığın Vedası",
        },
        sentences: [
          {
            ar: "رغم كل الجهود مات فيكتور أخيرًا بهدوء على متن السفينة المحاصرة المتجمدة",
            es: "A pesar de los mejores esfuerzos de todos, Victor finalmente murió en silencio a bordo del barco atrapado en el hielo",
            tr: "Herkesin en iyi çabalarına rağmen Victor sonunda donmuş, sıkışmış geminin içinde sessizce öldü",
          },
          {
            ar: "حزن والتون على رجل لم يعرفه إلا لأقصر وأغرب فترة",
            es: "Walton lloró a un hombre al que había conocido durante el más breve y extraño de los tiempos",
            tr: "Walton, en kısa ve en tuhaf zaman diliminde tanıdığı bir adamın yasını tuttu",
          },
          {
            ar: "في تلك الليلة بالذات اكتشف والتون المخلوق يحزن بصمت على جسد فيكتور الساكن",
            es: "Esa misma noche, Walton descubrió a la criatura llorando en silencio sobre el cuerpo inmóvil de Victor",
            tr: "Tam o gece Walton, yaratığın Victor'un hareketsiz bedeninin üzerinde sessizce yas tuttuğunu keşfetti",
          },
          {
            ar: "تحدث المخلوق عن عذابه اللامتناهي وحبه المعقد الملتوي لخالقه",
            es: "La criatura habló de su propio sufrimiento interminable y de su complicado y retorcido amor por su creador",
            tr: "Yaratık kendi bitmeyen ıstırabından ve yaratıcısına karşı karmaşık, çarpık sevgisinden bahsetti",
          },
          {
            ar: "أوضح أن الانتقام لم يجلب له سلامًا حقيقيًا بل فقط فراغًا أعمق وأشد خواءً",
            es: "Explicó que la venganza no le había traído verdadera paz, solo un vacío hueco más profundo",
            tr: "İntikamın kendisine gerçek bir huzur getirmediğini, yalnızca daha derin, boş bir hiçlik getirdiğini açıkladı",
          },
          {
            ar: "استمع والتون في صمت مصدوم غير قادر على أن يكره تمامًا الشكل الحزين المرتجف",
            es: "Walton escuchó en un silencio atónito, incapaz de odiar por completo a la triste figura temblorosa",
            tr: "Walton, kederli, titreyen figürden tamamen nefret edemeyerek şaşkın bir sessizlik içinde dinledi",
          },
          {
            ar: "أعلن المخلوق أنه سينهي الآن أخيرًا وجوده الطويل المعذَّب تمامًا",
            es: "La criatura declaró que ahora finalmente pondría fin por completo a su larga y torturada existencia",
            tr: "Yaratık, artık kendi uzun, eziyetli varlığına tamamen son vereceğini beyan etti",
          },
          {
            ar: "اختفى وحيدًا عبر الجليد ولم يره أحد بعد ذلك على الإطلاق",
            es: "Desapareció solo a través del hielo, sin que nadie volviera a verlo jamás",
            tr: "Buzun üzerinden tek başına kayboldu ve bir daha hiç kimse tarafından görülmedi",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-old-man-sea",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة إرنست همنغواي عن سانتياغو، الصياد العجوز الذي يخوض معركة ثلاثة أيام مع أعظم صيدة في حياته — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Ernest Hemingway sobre Santiago, un viejo pescador atrapado en una batalla de tres días con la captura más grande de su vida — un relato personal, no el texto original.",
      tr: "Ernest Hemingway'in, hayatının en büyük avıyla üç günlük bir mücadeleye kilitlenen yaşlı balıkçı Santiago hakkındaki hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: {
          ar: "سانتياغو الصياد العجوز",
          es: "Santiago, el viejo pescador",
          tr: "Yaşlı Balıkçı Santiago",
        },
        sentences: [
          {
            ar: "كان سانتياغو صيادًا عجوزًا مرت عليه أربعة وثمانون يومًا دون أن يصيد سمكة حقيقية واحدة",
            es: "Santiago era un viejo pescador que llevaba ochenta y cuatro días sin capturar un solo pez de verdad",
            tr: "Santiago, seksen dört gündür gerçek bir balık bile tutamamış yaşlı bir balıkçıydı",
          },
          {
            ar: "رُقّع شراعه مرات كثيرة حتى بدا كراية هزيمة كاملة",
            es: "Su vela estaba tan remendada que parecía una bandera de completa derrota",
            tr: "Yelkeni o kadar çok yamalanmıştı ki tam bir yenilgi bayrağı gibi görünüyordu",
          },
          {
            ar: "وصفه القرويون علانية بأنه سيئ الحظ رغم أنه لم يسمح لكلامهم بجرحه فعلًا أبدًا",
            es: "Los aldeanos lo llamaban abiertamente desafortunado, aunque él nunca dejó que sus palabras lo herían de verdad",
            tr: "Köylüler onu açıkça uğursuz olarak adlandırdı, ama o sözlerinin kendisini gerçekten yaralamasına asla izin vermedi",
          },
          {
            ar: "كان صبي صغير يُدعى مانولين يصطاد معه منذ الطفولة ويحبه بعمق",
            es: "Un joven llamado Manolín había pescado con él desde la infancia y lo quería profundamente",
            tr: "Manolin adında küçük bir çocuk, çocukluğundan beri onunla balık tutuyordu ve onu çok seviyordu",
          },
          {
            ar: "منع والدا مانولين الصبي من الانضمام إلى قارب سانتياغو الصغير السيئ الحظ بعد الآن",
            es: "Los padres de Manolín habían prohibido al niño seguir uniéndose al pequeño y desafortunado esquife de Santiago",
            tr: "Manolin'in ailesi, çocuğun artık Santiago'nun uğursuz küçük sandalına katılmasını yasakladı",
          },
          {
            ar: "ومع ذلك كان الصبي يزوره كل مساء حاملًا الطعام ومساعدًا في إصلاح معدات الرجل العجوز",
            es: "Aun así, el niño lo visitaba cada tarde, llevando comida y ayudando a reparar el equipo del anciano",
            tr: "Yine de çocuk her akşam ziyaret ediyor, yemek getiriyor ve yaşlı adamın takımlarını onarmasına yardım ediyordu",
          },
          {
            ar: "تحدث سانتياغو كثيرًا وبحرارة عن البيسبول وخاصة اللاعب العظيم جو دي ماجيو",
            es: "Santiago hablaba a menudo y con calidez del béisbol, especialmente del gran jugador Joe DiMaggio",
            tr: "Santiago sık sık ve sıcak bir dille beyzboldan, özellikle büyük oyuncu Joe DiMaggio'dan bahsederdi",
          },
          {
            ar: "رغم فقره وتقدمه بالسن لم تخبُ ثقة سانتياغو بمهارته الخاصة أبدًا فعليًا",
            es: "A pesar de su pobreza y su edad, la confianza de Santiago en su propia habilidad nunca se desvaneció realmente",
            tr: "Yoksulluğuna ve yaşına rağmen Santiago'nun kendi becerisine olan güveni asla gerçekten sönmedi",
          },
        ],
      },
      {
        title: { ar: "الانطلاق وحيدًا", es: "Partiendo solo", tr: "Yalnız Yola Çıkış" },
        sentences: [
          {
            ar: "قبل شروق الشمس بكثير جذف سانتياغو بهدوء بقاربه الصغير بعيدًا في الخليج المظلم",
            es: "Mucho antes del amanecer, Santiago remó silenciosamente su pequeño esquife lejos, hacia el oscuro golfo",
            tr: "Gün doğumundan çok önce Santiago, küçük sandalını sessizce karanlık körfezin uzaklarına kürekledi",
          },
          {
            ar: "تجاوز قوارب الصيد الأخرى مصممًا على تجربة حظه أبعد من أي شخص آخر",
            es: "Pasó junto a los demás botes pesqueros, decidido a probar su suerte más lejos que nadie",
            tr: "Şansını herkesten daha uzakta denemeye kararlı bir şekilde diğer balıkçı teknelerini geçti",
          },
          {
            ar: "لا تزال النجوم معلقة في الأعلى بينما هزّت الأمواج اللطيفة قاربه الخشبي الصغير بثبات إلى الأمام",
            es: "Las estrellas todavía colgaban en el cielo mientras suaves olas mecían constantemente su pequeño bote de madera",
            tr: "Yıldızlar hâlâ yukarıda asılıyken nazik dalgalar küçük tahta kayığını istikrarlı bir şekilde sallıyordu",
          },
          {
            ar: "طعّم خيوطه بعناية ووضعها على أعماق مختلفة ودقيقة تحت السطح",
            es: "Cebó sus líneas con cuidado, colocándolas a diferentes profundidades cuidadosas bajo la superficie",
            tr: "Oltalarını dikkatle yemledi ve yüzeyin altında farklı, dikkatli derinliklere yerleştirdi",
          },
          {
            ar: "أخبرته الطيور والأعشاب البحرية العائمة بهدوء عن المكان الذي قد تخفي فيه الأسماك الكبيرة",
            es: "Los pájaros y las algas flotantes le indicaban silenciosamente dónde podrían esconderse los peces más grandes",
            tr: "Kuşlar ve sürüklenen yosunlar ona büyük balıkların nerede saklanabileceğini sessizce söyledi",
          },
          {
            ar: "تحدث بهدوء إلى نفسه وإلى البحر كما يتحدث صديق قديم إلى آخر",
            es: "Se hablaba suavemente a sí mismo y al mar, como un viejo amigo le habla a otro",
            tr: "Kendisiyle ve denizle, eski bir dostun bir başkasına seslendiği gibi yumuşak bir şekilde konuştu",
          },
          {
            ar: "بحلول منتصف الصباح كان قد انجرف أبعد من الشاطئ مما فعل خلال أشهر طويلة عديدة",
            es: "Hacia media mañana había derivado más lejos de la costa de lo que había ido en muchos largos meses",
            tr: "Öğleye doğru, aylardır gitmediği kadar kıyıdan uzağa sürüklenmişti",
          },
          {
            ar: "شيء عميق في عظامه العجوز المتعبة أخبره أن اليوم سيكون مختلفًا أخيرًا",
            es: "Algo profundo en sus viejos y cansados huesos le decía que hoy finalmente sería diferente",
            tr: "Yorgun, yaşlı kemiklerinin derinliklerindeki bir şey ona bugünün sonunda farklı olacağını söyledi",
          },
        ],
      },
      {
        title: {
          ar: "السمكة تعلق بالطعم",
          es: "El marlín muerde",
          tr: "Kılıç Balığı Yemi Yutuyor",
        },
        sentences: [
          {
            ar: "فجأة شُدّ أحد خيوطه بقوة لم يشعر بمثلها منذ سنوات",
            es: "De repente, una de sus líneas se tensó con una fuerza como ninguna que hubiera sentido en años",
            tr: "Aniden oltalarından biri, yıllardır hissetmediği bir güçle gerildi",
          },
          {
            ar: "تسارع قلب سانتياغو وهو يدرك حجم الكائن أسفل قاربه بعيدًا",
            es: "El corazón de Santiago se aceleró al darse cuenta del tamaño de la criatura muy por debajo de su bote",
            tr: "Santiago, teknesinin çok aşağısındaki yaratığın büyüklüğünü fark edince kalbi hızla çarptı",
          },
          {
            ar: "أمسك الخيط بثبات تاركًا له أن ينسل بلطف عبر يديه المتصلبتين المتجعدتين",
            es: "Sostuvo la línea firmemente, dejando que se deslizara suavemente por sus manos callosas y curtidas",
            tr: "Olta ipini sıkıca tuttu ve nasırlı, yıpranmış ellerinden yavaşça kaymasına izin verdi",
          },
          {
            ar: "سحبت السمكة الضخمة قاربه بأكمله بثبات أبعد إلى البحر المفتوح اللامتناهي",
            es: "El gran pez arrastraba todo su esquife constantemente más lejos hacia el mar abierto e infinito",
            tr: "Büyük balık, tüm sandalını sürekli olarak açık, sonsuz denize doğru sürüklüyordu",
          },
          {
            ar: "شدّ سانتياغو جسده مقابل الخشب مصممًا على ألا يفوّت هذه الفرصة الوحيدة",
            es: "Santiago afirmó su cuerpo contra la madera, decidido a no perder esta única oportunidad",
            tr: "Santiago, bu tek şansı kaçırmamaya kararlı bir şekilde bedenini tahtaya karşı sıkıca tuttu",
          },
          {
            ar: "تحدث إلى السمكة غير المرئية مناديًا إياها أخاه ومعجبًا بقوتها الخفية المذهلة",
            es: "Le hablaba al pez invisible llamándolo hermano y admirando su increíble fuerza oculta",
            tr: "Görünmeyen balığa kardeşim diyerek seslendi ve onun inanılmaz gizli gücüne hayran kaldı",
          },
          {
            ar: "مرت ساعات بينما استمرت السمكة بالسباحة إلى الأمام ساحبة القارب الصغير خلفها",
            es: "Pasaron las horas mientras el marlín seguía nadando constantemente, arrastrando el pequeño bote detrás",
            tr: "Kılıç balığı istikrarlı bir şekilde yüzerken ve küçük tekneyi ardından sürüklerken saatler geçti",
          },
          {
            ar: "أدرك سانتياغو برهبة متزايدة أن هذه قد تكون أكبر سمكة في حياته كلها",
            es: "Santiago se dio cuenta con creciente asombro de que este podría ser el pez más grande de toda su vida",
            tr: "Santiago, bunun tüm hayatının en büyük balığı olabileceğini artan bir hayranlıkla fark etti",
          },
        ],
      },
      {
        title: { ar: "يومان في البحر", es: "Dos días en el mar", tr: "Denizde İki Gün" },
        sentences: [
          {
            ar: "امتد الصراع طوال يوم كامل ثم عميقًا في ليلة ثانية طويلة",
            es: "La lucha se extendió durante todo un día y luego profundamente hasta una segunda larga noche",
            tr: "Mücadele bütün bir gün sürdü ve sonra derinlemesine ikinci uzun bir geceye uzandı",
          },
          {
            ar: "أصبحت يدا سانتياغو متقرحتين ونازفتين من ضغط الخيط المستمر الذي لا يرحم",
            es: "Las manos de Santiago se llagaron y sangraron por la constante e implacable presión de la línea",
            tr: "Santiago'nun elleri, oltanın sürekli ve amansız baskısıyla soyulup kanamaya başladı",
          },
          {
            ar: "قنّن مخزونه الصغير من الماء والسمك بعناية غير متأكد بالضبط كم سيستمر هذا",
            es: "Racionó cuidadosamente su pequeña reserva de agua y pescado, sin saber exactamente cuánto duraría esto",
            tr: "Bunun ne kadar süreceğini tam olarak bilmeden az miktardaki su ve balık stokunu dikkatle idareli kullandı",
          },
          {
            ar: "جذبه الإعياء باستمرار لكنه رفض أن يسمح لنفسه بالنوم لأكثر من لحظات",
            es: "El agotamiento lo arrastraba constantemente, pero se negaba a permitirse dormir más de unos instantes",
            tr: "Bitkinlik onu sürekli çekiştirse de kendine anlardan fazla uyumasına izin vermeyi reddetti",
          },
          {
            ar: "احترم السمكة بعمق رائيًا فيها قوة وكرامة تضاهي قوته وكرامته",
            es: "Respetaba profundamente al marlín, viendo en él una fuerza y una dignidad que igualaban las suyas",
            tr: "Kılıç balığına derinden saygı duydu, onda kendi gücüne ve onuruna denk bir güç ve onur gördü",
          },
          {
            ar: "أصابت التشنجات يديه بألم لكنه أجبر نفسه على الاستمرار بالعمل عبر الألم",
            es: "Los calambres se apoderaron dolorosamente de sus manos, pero se obligó a seguir trabajando a través del dolor",
            tr: "Kramplar ellerini acıyla ele geçirdi ama kendini acıya rağmen çalışmaya zorladı",
          },
          {
            ar: "تحدث بصوت مسموع كثيرًا مذكّرًا نفسه بحزم أن الرجل لا يُهزم فعلًا بالألم",
            es: "Hablaba en voz alta con frecuencia, recordándose firmemente que un hombre nunca es realmente derrotado por el dolor",
            tr: "Bir insanın acı tarafından asla gerçekten yenilmediğini kendine kararlılıkla hatırlatarak sık sık yüksek sesle konuştu",
          },
          {
            ar: "لم يرتخِ الخيط أبدًا ولم يُظهر الرجل ولا السمكة أصغر علامة على الاستسلام",
            es: "La línea nunca se aflojó, y ni el hombre ni el pez mostraron la más pequeña señal de rendición",
            tr: "Olta hiç gevşemedi ve ne adam ne de balık en ufak bir teslim olma işareti gösterdi",
          },
        ],
      },
      {
        title: { ar: "الذكريات والعزلة", es: "Recuerdos y soledad", tr: "Hatıralar ve Yalnızlık" },
        sentences: [
          {
            ar: "وحيدًا على الماء اللامتناهي عاد عقل سانتياغو كثيرًا إلى سنواته الأصغر والأقوى",
            es: "Solo en el agua interminable, la mente de Santiago volvía a menudo a sus años más jóvenes y fuertes",
            tr: "Sonsuz suların üzerinde tek başına, Santiago'nun aklı sık sık daha genç, daha güçlü yıllarına döndü",
          },
          {
            ar: "تذكر مباريات مصارعة الأذرع التي فاز بها ذات مرة بمجرد إرادة عنيدة صرفة",
            es: "Recordaba competencias de pulso que una vez había ganado por pura y obstinada voluntad",
            tr: "Bir zamanlar sadece inatçı bir irade gücüyle kazandığı bilek güreşi yarışmalarını hatırladı",
          },
          {
            ar: "أراحته أفكار وفاء مانولين خلال أصعب الساعات وأشدها عزلة في البحر",
            es: "Los pensamientos sobre la lealtad de Manolín lo consolaban durante las horas más solitarias y difíciles en el mar",
            tr: "Manolin'in sadakatine dair düşünceler, denizdeki en yalnız ve en zorlu saatlerde ona huzur verdi",
          },
          {
            ar: "تخيل ما سيفكر فيه دي ماجيو العظيم بشأن نضاله الطويل المذهل",
            es: "Imaginaba qué pensaría el gran DiMaggio de su propia larga e increíble lucha",
            tr: "Büyük DiMaggio'nun kendi uzun, inanılmaz mücadelesi hakkında ne düşüneceğini hayal etti",
          },
          {
            ar: "حلّقت طيور البحر بفضول في الأعلى وكأنها تشاهد هذه المباراة الغريبة الوحيدة تتكشف",
            es: "Las aves marinas volaban en círculos con curiosidad arriba, como si observaran desarrollarse este extraño y solitario duelo",
            tr: "Deniz kuşları, bu tuhaf ve yalnız yarışmanın açılışını izliyormuş gibi meraklı bir şekilde başının üzerinde daireler çizdi",
          },
          {
            ar: "تحدث بلطف إلى يديه المتعبتين مشجعًا لهما كما شجّع مانولين ذات مرة",
            es: "Le hablaba con dulzura a sus propias manos cansadas, animándolas como una vez animó a Manolín",
            tr: "Bir zamanlar Manolin'i teşvik ettiği gibi kendi yorgun ellerine nazikçe konuşarak onları teşvik etti",
          },
          {
            ar: "رغم إعيائه لم يفكر جديًا ولا مرة واحدة في قطع الخيط والتخلي عنه",
            es: "A pesar de su agotamiento, nunca consideró seriamente simplemente cortar la línea y liberarla",
            tr: "Bitkinliğine rağmen ipi kesip bırakmayı bir kez olsun ciddi şekilde düşünmedi",
          },
          {
            ar: "شعرت عزلته في عرض الماء بأنها شاسعة لكنها لم تكن أبدًا فارغة تمامًا من المعنى",
            es: "Su soledad en el agua se sentía vasta, pero nunca del todo vacía de sentido",
            tr: "Sudaki yalnızlığı uçsuz bucaksız hissettiriyordu ama bir kez olsun anlamdan tamamen yoksun değildi",
          },
        ],
      },
      {
        title: {
          ar: "السمكة تظهر على السطح",
          es: "El marlín emerge",
          tr: "Kılıç Balığı Yüzeye Çıkıyor",
        },
        sentences: [
          {
            ar: "في اليوم الثالث بدأت السمكة الضخمة أخيرًا تحوم ببطء أقرب إلى القارب الصغير",
            es: "Al tercer día, el gran marlín finalmente comenzó a girar lentamente más cerca del pequeño bote",
            tr: "Üçüncü günde büyük kılıç balığı sonunda küçük tekneye yavaşça daha yakın dönmeye başladı",
          },
          {
            ar: "حظي سانتياغو بأول نظرة كاملة على السمكة وشهق من حجمها المذهل",
            es: "Santiago vislumbró por primera vez al pez completo y se quedó sin aliento ante su increíble tamaño",
            tr: "Santiago balığı ilk kez tam olarak gördü ve inanılmaz büyüklüğüne nefesi kesildi",
          },
          {
            ar: "امتد جسده الفضي أطول بكثير من قاربه بأكمله متلألئًا بشدة في الشمس",
            es: "Su cuerpo plateado se extendía mucho más largo que todo su esquife, brillando intensamente al sol",
            tr: "Gümüşi bedeni, güneşte parlak bir şekilde ışıldayarak tüm sandalından çok daha uzun uzanıyordu",
          },
          {
            ar: "مستجمعًا كل ذرة قوة متبقية سحب السمكة بثبات أقرب إلى القارب",
            es: "Reuniendo cada gramo de fuerza que le quedaba, atrajo al marlín constantemente más cerca del bote",
            tr: "Kalan tüm gücünü toplayarak kılıç balığını istikrarlı bir şekilde tekneye yaklaştırdı",
          },
          {
            ar: "بجهد أخير يائس غرس رمحه عميقًا في جانب السمكة الضخمة",
            es: "Con un último esfuerzo desesperado, hundió su arpón profundamente en el costado del gran pez",
            tr: "Son bir çaresiz çabayla zıpkınını büyük balığın böğrüne derinlemesine sapladı",
          },
          {
            ar: "قفزت السمكة مرة واحدة بعنف نحو السماء قبل أن تهدأ تمامًا في النهاية",
            es: "El marlín saltó una vez violentamente contra el cielo antes de finalmente quedar completamente quieto",
            tr: "Kılıç balığı sonunda tamamen hareketsiz kalmadan önce göğe karşı bir kez şiddetle sıçradı",
          },
          {
            ar: "بكى سانتياغو بهدوء من الإعياء والارتياح وشيء قريب من الحزن الحقيقي",
            es: "Santiago lloró en silencio por el agotamiento, el alivio y algo cercano a un verdadero duelo",
            tr: "Santiago; bitkinlik, rahatlama ve gerçek kedere yakın bir şeyden sessizce ağladı",
          },
          {
            ar: "لقد فاز ومع ذلك شعر بتواضع غريب أمام الكائن العظيم الذي قتله للتو",
            es: "Había ganado, pero se sentía extrañamente humilde ante la magnífica criatura que acababa de matar",
            tr: "Kazanmıştı ama az önce öldürdüğü muhteşem yaratık karşısında tuhaf bir şekilde küçük hissetti",
          },
        ],
      },
      {
        title: { ar: "ربط السمكة", es: "Atando al marlín", tr: "Kılıç Balığını Bağlamak" },
        sentences: [
          {
            ar: "ربط سانتياغو السمكة الضخمة بأمان بجانب قاربه الخشبي الصغير المتقادم",
            es: "Santiago amarró firmemente al enorme marlín junto a su pequeño y envejecido esquife de madera",
            tr: "Santiago, kocaman kılıç balığını küçük, eskimiş tahta sandalının yanına sıkıca bağladı",
          },
          {
            ar: "انتشر دم السمكة الضخمة ببطء ملطخًا الماء الصافي بلون أحمر داكن عميق",
            es: "La sangre del gran pez se extendía lentamente, tiñendo el agua clara de un rojo oscuro y profundo",
            tr: "Büyük balığın kanı yavaşça yayılarak berrak suyu koyu, kızıl bir renge boyadı",
          },
          {
            ar: "بدأ الرحلة الطويلة المضنية عائدًا نحو الشاطئ البعيد الذي تركه خلفه",
            es: "Comenzó el largo y agotador viaje de regreso hacia la lejana costa que había dejado atrás",
            tr: "Geride bıraktığı uzak kıyıya doğru uzun, bitkin yolculuğuna başladı",
          },
          {
            ar: "تألم كل عضلة في جسده بشدة لكن الفخر حمله بثبات إلى الأمام رغم ذلك",
            es: "Cada músculo de su cuerpo le dolía intensamente, pero el orgullo lo impulsaba constantemente hacia adelante de todos modos",
            tr: "Vücudundaki her kas şiddetle acıyordu ama gurur ona yine de istikrarlı bir şekilde ileri gitme gücü verdi",
          },
          {
            ar: "تخيل بفخر وجوه القرويين المذهولة الذين استهزؤوا بحظه ذات مرة",
            es: "Se imaginaba con orgullo los rostros asombrados de los aldeanos que una vez se habían burlado de su suerte",
            tr: "Bir zamanlar şansıyla alay eden köylülerin şaşkın yüzlerini gururla hayal etti",
          },
          {
            ar: "لكن رائحة الدم انتشرت بعيدًا عبر الماء إلى عمق البحر المفتوح",
            es: "Sin embargo, el olor de la sangre se extendía lejos por el agua hacia el mar abierto más profundo",
            tr: "Ancak kan kokusu suyun üzerinden daha derin açık denize kadar uzağa yayıldı",
          },
          {
            ar: "لاحظ سانتياغو أول شكل بعيد يقطع الأمواج بسرعة نحوه",
            es: "Santiago notó la primera forma distante que cortaba velozmente las olas hacia él",
            tr: "Santiago, dalgaların arasından kendisine doğru hızla ilerleyen ilk uzak şekli fark etti",
          },
          {
            ar: "أمسك رمحه بقوة مستشعرًا أن أصعب نضاله قد لا يكون قد انتهى بعد",
            es: "Aferró su arpón con fuerza, sintiendo que su lucha más difícil quizás no había terminado aún",
            tr: "En zorlu mücadelesinin henüz bitmemiş olabileceğini hissederek zıpkınını sıkıca kavradı",
          },
        ],
      },
      {
        title: {
          ar: "هجوم أسماك القرش",
          es: "El ataque de los tiburones",
          tr: "Köpekbalığı Saldırısı",
        },
        sentences: [
          {
            ar: "مزّق سمك قرش قوي فجأة وبضراوة لحم السمكة المكشوف المتدلي خلف القارب",
            es: "Un poderoso tiburón desgarró de repente y con ferocidad la carne expuesta del marlín que remolcaba",
            tr: "Güçlü bir köpekbalığı, arkadan gelen kılıç balığının açıkta kalan etine aniden ve vahşice saldırdı",
          },
          {
            ar: "قاوم سانتياغو بشدة طاعنًا القرش المهاجم بكل ما تبقى لديه",
            es: "Santiago luchó ferozmente, apuñalando al tiburón atacante con todo lo que le quedaba",
            tr: "Santiago şiddetle karşılık verdi ve elinde kalan her şeyle saldıran köpekbalığını bıçakladı",
          },
          {
            ar: "قتله في النهاية لكن ليس قبل أن يسرق جزءًا كبيرًا من صيده الثمين",
            es: "Finalmente lo mató, pero no antes de que le hubiera robado un gran trozo de su preciada captura",
            tr: "Sonunda onu öldürdü ama değerli avının büyük bir parçasını çalmadan önce değil",
          },
          {
            ar: "تبعتها أسماك قرش أخرى بشراهة منجذبة إلى نفس أثر الدم الذي لا يرحم",
            es: "Pronto le siguieron más tiburones, atraídos vorazmente por el mismo implacable rastro de sangre",
            tr: "Kısa süre sonra aynı amansız kan izine açgözlülükle çekilen daha fazla köpekbalığı geldi",
          },
          {
            ar: "قاوم سانتياغو كل واحدة بيأس رغم أن رمحه ضاع تمامًا في البحر الآن",
            es: "Santiago luchó desesperadamente contra cada uno, aunque su arpón ya se había perdido por completo en el mar",
            tr: "Zıpkını artık denizde tamamen kaybolmuş olsa da Santiago her biriyle umutsuzca savaştı",
          },
          {
            ar: "ابتكر أسلحة من سكين مربوط بمجداف وحتى بيديه العاريتين المرهقتين",
            es: "Improvisó armas con un cuchillo atado a un remo e incluso con sus propias manos desnudas y agotadas",
            tr: "Bir kürek sapına bağlanmış bir bıçaktan ve hatta kendi çıplak, bitkin ellerinden silahlar icat etti",
          },
          {
            ar: "جرّد كل هجوم جديد المزيد من السمكة التي كافح بشدة للفوز بها",
            es: "Cada nuevo ataque le arrebataba más del marlín por el que tanto había luchado para ganar",
            tr: "Her yeni saldırı, kazanmak için bu kadar çok savaştığı kılıç balığından daha fazlasını alıp götürdü",
          },
          {
            ar: "رفض سانتياغو الاستسلام حتى بينما اختفت جائزته العظيمة سابقًا ببطء",
            es: "Santiago se negó a rendirse incluso mientras su otrora magnífico premio desaparecía lentamente",
            tr: "Bir zamanlar muhteşem olan ödülü yavaşça yok olurken bile Santiago teslim olmayı reddetti",
          },
        ],
      },
      {
        title: { ar: "خسارة المعركة", es: "Perdiendo la batalla", tr: "Mücadeleyi Kaybetmek" },
        sentences: [
          {
            ar: "حلّ الليل وما زالت أسماك قرش أخرى تصل منجذبة برائحة الدم المتضائلة باستمرار",
            es: "Cayó la noche y aún más tiburones llegaban, atraídos por el aroma de sangre cada vez más débil",
            tr: "Gece çöktü ve sürekli zayıflayan kan kokusuna çekilen daha fazla köpekbalığı gelmeye devam etti",
          },
          {
            ar: "استمر سانتياغو بالمقاومة بعزم بالإحساس وحده في الظلام الشبه الكامل المحيط بقاربه",
            es: "Santiago siguió luchando con determinación, guiándose solo por el tacto en la casi total oscuridad que rodeaba su bote",
            tr: "Santiago, teknesini çevreleyen neredeyse tam karanlıkta sadece dokunma hissiyle kararlılıkla savaşmaya devam etti",
          },
          {
            ar: "تحدث بمرارة إلى أسماك القرش ناعتًا إياها باللصوص ولاعنًا حظه العاثر",
            es: "Les hablaba con amargura a los tiburones, llamándolos ladrones y maldiciendo su terrible suerte",
            tr: "Köpekbalıklarına hırsız diyerek acı bir dille seslendi ve kendi kötü şansına lanet etti",
          },
          {
            ar: "بحلول الوقت الذي انتهت فيه أسوأ الهجمات أخيرًا لم يتبق شيء صالح للأكل تقريبًا",
            es: "Para cuando lo peor de los ataques finalmente terminó, casi no quedaba nada comestible",
            tr: "Saldırıların en kötüsü sonunda bittiğinde yenilebilir hiçbir şey kalmamıştı",
          },
          {
            ar: "لم يبق سوى هيكل السمكة الأبيض الطويل يتدلى بلا فائدة خلف قاربه المتهالك",
            es: "Solo el largo esqueleto blanco del marlín todavía se arrastraba inútilmente tras su maltrecho esquife",
            tr: "Sadece kılıç balığının uzun, beyaz iskeleti hâlâ yıpranmış sandalının ardında işe yaramaz bir şekilde sürükleniyordu",
          },
          {
            ar: "شعر سانتياغو بفراغ تام وكأن مصير السمكة أصبح بطريقة ما مصيره الخاص",
            es: "Santiago se sintió completamente vacío, como si el destino del pez se hubiera convertido de algún modo en el suyo",
            tr: "Santiago, balığın kaderi bir şekilde kendi kaderi olmuş gibi tamamen boşalmış hissetti",
          },
          {
            ar: "ومع ذلك وجّه قاربه الصغير بثبات نحو الديار رافضًا الاستسلام حتى الآن",
            es: "Aun así, guió su pequeño bote constantemente hacia casa, negándose a rendirse incluso ahora",
            tr: "Yine de küçük teknesini istikrarlı bir şekilde eve doğru yönlendirdi ve şimdi bile teslim olmayı reddetti",
          },
          {
            ar: "استحوذ عليه الإعياء أخيرًا ونام منهارًا بثقل على ذراع الدفة",
            es: "El agotamiento finalmente lo venció y se durmió desplomado pesadamente sobre el timón",
            tr: "Sonunda bitkinlik onu ele geçirdi ve dümenin üzerine ağır bir şekilde yığılıp uyudu",
          },
        ],
      },
      {
        title: { ar: "العودة إلى الديار", es: "El regreso a casa", tr: "Eve Dönüş" },
        sentences: [
          {
            ar: "تجمّع صيادون آخرون في صمت مصدوم حول الهيكل الضخم الذي لا يزال مربوطًا بقاربه",
            es: "Otros pescadores se reunieron en un silencio atónito alrededor del enorme esqueleto todavía atado a su bote",
            tr: "Diğer balıkçılar, hâlâ teknesine bağlı olan devasa iskeletin etrafında şaşkın bir sessizlik içinde toplandı",
          },
          {
            ar: "انتشر الخبر بسرعة في القرية عن حجم السمكة المذهل الذي لا يُصدَّق",
            es: "La noticia se difundió rápidamente por el pueblo sobre el asombroso e increíble tamaño del marlín",
            tr: "Kılıç balığının şaşırtıcı, inanılmaz büyüklüğü hakkındaki haber kasabaya hızla yayıldı",
          },
          {
            ar: "وجد مانولين سانتياغو نائمًا نومًا عميقًا مرهقًا وبكى بهدوء لرؤية يديه الممزقتين النازفتين",
            es: "Manolín encontró a Santiago profundamente dormido, exhausto, y lloró en silencio al ver sus manos desgarradas y sangrantes",
            tr: "Manolin, Santiago'yu derin bir yorgunlukla uyurken buldu ve onun yırtık, kanayan ellerine sessizce ağladı",
          },
          {
            ar: "أحضر الصبي القهوة والجرائد مصممًا على رعاية الرجل العجوز بنفسه",
            es: "El niño trajo café y periódicos, decidido a cuidar él mismo del anciano",
            tr: "Çocuk, yaşlı adama bizzat bakmaya kararlı bir şekilde kahve ve gazeteler getirdi",
          },
          {
            ar: "استيقظ سانتياغو ببطء وهو لا يزال يتألم في كل مكان لكنه بغرابة في سلام مع كل ما حدث",
            es: "Santiago se despertó lentamente, todavía dolorido por todas partes, pero extrañamente en paz con todo lo sucedido",
            tr: "Santiago yavaşça uyandı, hâlâ her yeri ağrıyordu ama olan her şeyle tuhaf bir şekilde barışıktı",
          },
          {
            ar: "وعد مانولين بحزم أنهما سيصطادان معًا مجددًا قريبًا بغض النظر عن ما يقوله الآخرون",
            es: "Manolín prometió con firmeza que pronto volverían a pescar juntos, sin importar lo que dijeran los demás",
            tr: "Manolin, başkaları ne derse desin yakında tekrar birlikte balık tutacaklarına kararlılıkla söz verdi",
          },
          {
            ar: "أخطأ السياح في اعتبار الهيكل الضخم سمكة قرش وتعجبوا من طوله المذهل",
            es: "Los turistas confundieron el gigantesco esqueleto con un tiburón y se maravillaron de su increíble longitud",
            tr: "Turistler devasa iskeleti bir köpekbalığı zannetti ve inanılmaz uzunluğuna hayran kaldı",
          },
          {
            ar: "نام سانتياغو مرة أخرى حالمًا بسلام بالأسود على شواطئ أفريقيا المشمسة البعيدة",
            es: "Santiago volvió a dormir, soñando en paz con leones en lejanas playas africanas iluminadas por el sol",
            tr: "Santiago bir kez daha uyudu, uzak, güneşli Afrika sahillerindeki aslanları huzur içinde hayal etti",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-alice-wonderland",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة لويس كارول عن فتاة فضولية تتبع أرنبًا مستعجلًا إلى عالم عجيب تحت الأرض — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Lewis Carroll sobre una niña curiosa que sigue a un conejo apresurado hacia un mundo subterráneo sin sentido — un relato personal, no el texto original.",
      tr: "Lewis Carroll'ın, meraklı bir kızın aceleci bir tavşanı yeraltındaki anlamsız bir dünyaya kadar takip etmesini anlatan hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: {
          ar: "النزول إلى جحر الأرنب",
          es: "Por la madriguera del conejo",
          tr: "Tavşan Deliğinden Aşağı",
        },
        sentences: [
          {
            ar: "جلست أليس بنعاس على ضفة النهر بينما كانت أختها الكبرى تقرأ كتابًا بلا صور",
            es: "Alicia estaba sentada somnolienta junto a la orilla del río mientras su hermana mayor leía un libro sin ilustraciones",
            tr: "Alice, ablası resimsiz bir kitap okurken nehir kıyısında uyku sersemliğiyle oturuyordu",
          },
          {
            ar: "فجأة مر أرنب أبيض مسرعًا يرتدي صدرية ويتمتم بأنه متأخر",
            es: "De repente un Conejo Blanco pasó apresurado con un chaleco puesto, murmurando que llegaba tarde",
            tr: "Aniden bir Beyaz Tavşan yelek giymiş halde koşarak geçti, geç kaldığını mırıldanıyordu",
          },
          {
            ar: "مندهشة لرؤية أرنب يتفقد ساعة جيب قفزت أليس ولحقت به",
            es: "Asombrada al ver a un conejo revisando un reloj de bolsillo, Alicia se levantó de un salto y lo siguió",
            tr: "Bir tavşanın cep saatine baktığını görünce şaşıran Alice ayağa fırladı ve onu takip etti",
          },
          {
            ar: "طاردته عبر الحقل حتى اختفى داخل جحر أرنب كبير",
            es: "Lo persiguió a través del campo hasta que desapareció dentro de una gran madriguera de conejo",
            tr: "Onu tarlanın öbür ucuna kadar kovaladı, ta ki büyük bir tavşan deliğine dalıp kayboluncaya dek",
          },
          {
            ar: "دون أن تفكر مرتين تسلقت أليس داخل الجحر خلفه وبدأت تسقط ببطء إلى الأسفل",
            es: "Sin pensarlo dos veces, Alicia se metió en el agujero detrás de él y comenzó a caer lentamente hacia abajo",
            tr: "İki kez düşünmeden Alice onun peşinden deliğe girdi ve yavaşça aşağı doğru düşmeye başladı",
          },
          {
            ar: "كان النفق مبطنًا بخزائن ورفوف كتب وخرائط معلقة في ذلك الضوء الخافت الغريب",
            es: "El túnel estaba lleno de armarios, estanterías y mapas colgados bajo aquella extraña luz tenue",
            tr: "Tünel, o tuhaf loş ışıkta asılı duran dolaplar, kitap rafları ve haritalarla kaplıydı",
          },
          {
            ar: "سقطت لما شعرت أنه دقائق طويلة، وهبطت برفق على كومة من الأوراق",
            es: "Cayó durante lo que le pareció muchos minutos, aterrizando suavemente sobre un montón de hojas",
            tr: "Uzun dakikalar gibi hissettiren bir süre düştü ve bir yaprak yığınının üzerine yumuşakça indi",
          },
          {
            ar: "أمامها اختفى الأرنب الأبيض عند منعطف، فأسرعت أليس خلفه",
            es: "Delante de ella, el Conejo Blanco desapareció tras una esquina, y Alicia se apresuró a seguirlo",
            tr: "Önünde, Beyaz Tavşan bir köşeyi dönüp gözden kayboldu ve Alice hemen peşinden koştu",
          },
        ],
      },
      {
        title: { ar: "اشربيني، كليني", es: "Bébeme, cómeme", tr: "Beni İç, Beni Ye" },
        sentences: [
          {
            ar: "وجدت أليس نفسها في ردهة طويلة مصطفة بأبواب موصدة من كل حجم",
            es: "Alicia se encontró en un pasillo largo lleno de puertas cerradas de todos los tamaños",
            tr: "Alice kendini her boyutta kilitli kapıyla dolu uzun bir koridorda buldu",
          },
          {
            ar: "خلف ستارة صغيرة اكتشفت بابًا صغيرًا يؤدي إلى حديقة جميلة",
            es: "Detrás de una pequeña cortina descubrió una puertecita que llevaba a un hermoso jardín",
            tr: "Küçük bir perdenin arkasında güzel bir bahçeye açılan minik bir kapı keşfetti",
          },
          {
            ar: "على طاولة زجاجية وجدت زجاجة مكتوبًا عليها اشربيني بحروف أنيقة",
            es: "Sobre una mesa de cristal encontró una botella con la etiqueta Bébeme escrita con letras cuidadas",
            tr: "Cam bir masanın üzerinde, üzerinde özenli harflerle Beni İç yazan bir şişe buldu",
          },
          {
            ar: "شربت السائل الحلو وبدأت فورًا تتقلص وتصغر أكثر فأكثر",
            es: "Bebió el dulce líquido y de inmediato comenzó a encogerse cada vez más",
            tr: "Tatlı sıvıyı içti ve hemen küçülüp küçülmeye başladı",
          },
          {
            ar: "أصبحت صغيرة جدًا بحيث لم تعد تصل إلى المفتاح، فوجدت كعكة مكتوبًا عليها كليني قريبًا",
            es: "Se volvió tan pequeña que ya no alcanzaba la llave, así que encontró un pastel etiquetado Cómeme cerca",
            tr: "O kadar küçülmüştü ki artık anahtara ulaşamıyordu, bu yüzden yakınlarda Beni Ye yazan bir kek buldu",
          },
          {
            ar: "قضمة واحدة من الكعكة جعلتها تكبر بسرعة حتى اصطدم رأسها بالسقف",
            es: "Un solo bocado del pastel la hizo crecer rápidamente hasta que su cabeza chocó con el techo",
            tr: "Kekten bir ısırık onu öyle hızlı büyüttü ki başı tavana çarptı",
          },
          {
            ar: "غمرها الإحباط من تغير حجمها الغريب وبدأت تبكي دموعًا ضخمة وثقيلة",
            es: "Abrumada por su extraño y cambiante tamaño, Alicia comenzó a llorar lágrimas enormes y pesadas",
            tr: "Tuhaf, sürekli değişen boyutu karşısında bunalan Alice, kocaman ve ağır gözyaşları dökmeye başladı",
          },
          {
            ar: "متذكرة المروحة في يدها تقلصت من جديد وانزلقت عبر الباب الصغير",
            es: "Recordando el abanico en su mano, se encogió de nuevo y se deslizó por la puertecita",
            tr: "Elindeki yelpazeyi hatırlayınca yeniden küçüldü ve minik kapıdan içeri süzüldü",
          },
        ],
      },
      {
        title: { ar: "بركة الدموع", es: "El charco de lágrimas", tr: "Gözyaşı Havuzu" },
        sentences: [
          {
            ar: "وجدت أليس نفسها تسبح في بركة مكوّنة بالكامل من دموعها العملاقة",
            es: "Alicia se encontró nadando en un charco formado enteramente por sus propias lágrimas gigantes",
            tr: "Alice kendini, tamamen kendi kocaman gözyaşlarından oluşan bir havuzda yüzerken buldu",
          },
          {
            ar: "سبح فأر مذعور بالقرب منها فسألته أليس بأدب عن الطريق إلى الشاطئ",
            es: "Un Ratón asustado nadó cerca y Alicia le preguntó cortésmente el camino hacia la orilla",
            tr: "Ürkmüş bir Fare yakınında yüzdü ve Alice ona nazikçe kıyıya giden yolu sordu",
          },
          {
            ar: "سرعان ما جدّف حشد كامل من الحيوانات المبللة معًا نحو الضفة الموحلة",
            es: "Pronto toda una multitud de animales empapados remó junta hacia la orilla fangosa",
            tr: "Kısa süre sonra ıslanmış bir hayvan kalabalığı birlikte çamurlu kıyıya doğru kürek çekti",
          },
          {
            ar: "اقترح طائر الدودو سباق حلقة حيث يركض الجميع في دوائر حتى يجفوا",
            es: "El Dodo propuso una carrera en corro en la que todos corrían en círculos hasta secarse",
            tr: "Dodo kuşu, herkesin kuruyana kadar daireler çizerek koştuğu bir Yarış Meclisi önerdi",
          },
          {
            ar: "أُعلن كل حيوان فائزًا ووزعت أليس الحلوى كجوائز",
            es: "Se declaró ganador a cada animal y Alicia repartió caramelos como premios",
            tr: "Her hayvan kazanan ilan edildi ve Alice ödül olarak şeker dağıttı",
          },
          {
            ar: "بدأ الفأر يروي حكاية طويلة حزينة عن متاعب عائلية قديمة وضغائن موروثة",
            es: "El Ratón comenzó a contar una larga y triste historia sobre viejos problemas familiares y rencores antiguos",
            tr: "Fare, eski aile sorunları ve köhne kırgınlıklar hakkında uzun, hüzünlü bir hikaye anlatmaya başladı",
          },
          {
            ar: "شرد ذهن أليس أثناء الحكاية فأساءت للفأر الخجول دون قصد",
            es: "La mente de Alicia se distrajo durante el relato y sin querer ofendió al tímido Ratón",
            tr: "Alice'in aklı hikaye sırasında başka yere gitti ve istemeden çekingen Fare'yi gücendirdi",
          },
          {
            ar: "واحدًا تلو الآخر ابتعدت الحيوانات تاركة أليس وحيدة مجددًا بجانب الماء",
            es: "Uno a uno los animales se fueron alejando, dejando a Alicia sola de nuevo junto al agua",
            tr: "Hayvanlar teker teker uzaklaştı ve Alice'i suyun kenarında yine yalnız bıraktı",
          },
        ],
      },
      {
        title: {
          ar: "منزل الأرنب الأبيض",
          es: "La casa del Conejo Blanco",
          tr: "Beyaz Tavşan'ın Evi",
        },
        sentences: [
          {
            ar: "ظن الأرنب الأبيض خطأً أن أليس خادمته وأرسلها لإحضار قفازيه",
            es: "El Conejo Blanco confundió a Alicia con su criada y la envió a buscar sus guantes",
            tr: "Beyaz Tavşan, Alice'i hizmetçisiyle karıştırıp eldivenlerini getirmesi için gönderdi",
          },
          {
            ar: "داخل منزله المرتب الصغير وجدت أليس زجاجة أخرى وشربت منها دون تفكير",
            es: "Dentro de su ordenada casita, Alicia encontró otra botella y bebió de ella sin pensarlo",
            tr: "Onun derli toplu küçük evinde Alice başka bir şişe buldu ve düşünmeden içti",
          },
          {
            ar: "كبرت بشكل هائل حتى خرجت ذراع من النافذة وقدم من المدخنة",
            es: "Creció tan enormemente que un brazo se salió por la ventana y un pie por la chimenea",
            tr: "O kadar kocaman büyüdü ki bir kolu pencereden, bir ayağı bacadan dışarı fırladı",
          },
          {
            ar: "أمر الأرنب المذعور بستانيه بيل بالنزول عبر المدخنة لإخراجها",
            es: "El asustado Conejo ordenó a su jardinero Bill que bajara por la chimenea para sacarla",
            tr: "Korkmuş Tavşan, bahçıvanı Bill'e onu çıkarmak için bacadan aşağı inmesini emretti",
          },
          {
            ar: "ركلت أليس بشكل غريزي فأطارت بيل المسكين عاليًا في السماء",
            es: "Alicia dio una patada por instinto y envió al pobre Bill volando alto hacia el cielo",
            tr: "Alice içgüdüsel olarak tekme attı ve zavallı Bill'i gökyüzüne fırlattı",
          },
          {
            ar: "تجمع حشد من الحيوانات الصغيرة في الخارج يرمون حصى تحوّل إلى كعكات صغيرة",
            es: "Una multitud de animalitos se reunió afuera lanzando piedrecitas que se convertían en pastelitos",
            tr: "Dışarıda küçük hayvanlardan oluşan bir kalabalık toplandı ve minik kekler haline dönüşen çakıl taşları fırlattı",
          },
          {
            ar: "بتناول إحدى كعكات الحصى بدأت أليس تتقلص مرة أخرى إلى حجم صغير",
            es: "Al comer uno de los pastelitos de piedrecita, Alicia comenzó a encogerse de nuevo a un tamaño pequeño",
            tr: "Çakıl taşı keklerinden birini yiyince Alice yeniden küçük bir boyuta küçülmeye başladı",
          },
          {
            ar: "مرتاحة لصغر حجمها مجددًا ركضت إلى الغابة هربًا من الحشد",
            es: "Aliviada de volver a ser pequeña, corrió hacia el bosque para escapar de la multitud",
            tr: "Yeniden küçük olmaktan rahatlayan Alice, kalabalıktan kaçmak için ormana koştu",
          },
        ],
      },
      {
        title: { ar: "نصيحة من يسروع", es: "Consejo de una oruga", tr: "Bir Tırtıldan Öğüt" },
        sentences: [
          {
            ar: "في عمق الغابة قابلت أليس يسروعًا أزرق كبيرًا يجلس بهدوء على فطر",
            es: "En lo profundo del bosque, Alicia conoció a una gran oruga azul sentada tranquilamente sobre un hongo",
            tr: "Ormanın derinliklerinde Alice, bir mantarın üzerinde sakince oturan iri mavi bir Tırtıl'la karşılaştı",
          },
          {
            ar: "سألها ببساطة من أنتِ بصوت بطيء بلا اهتمام",
            es: "Le preguntó sencillamente quién eres con una voz lenta y aburrida",
            tr: "Ona sade bir şekilde sen kimsin diye yavaş ve ilgisiz bir sesle sordu",
          },
          {
            ar: "اعترفت أليس بأنها بالكاد تعرف نفسها بعد أن تغير حجمها مرات عديدة ذلك اليوم",
            es: "Alicia admitió que apenas se conocía a sí misma después de cambiar de tamaño tantas veces ese día",
            tr: "Alice o gün o kadar çok boyut değiştirdikten sonra artık kendini zar zor tanıdığını itiraf etti",
          },
          {
            ar: "أخبرها اليسروع أن جانبًا من الفطر سيجعلها تكبر والجانب الآخر سيجعلها تصغر",
            es: "La oruga le dijo que un lado del hongo la haría crecer y el otro la haría encoger",
            tr: "Tırtıl ona mantarın bir tarafının onu büyüteceğini, diğer tarafının ise küçülteceğini söyledi",
          },
          {
            ar: "كسرت قطعتين دون أن تعرف في البداية أي جانب هو أيهما",
            es: "Arrancó dos trozos sin saber al principio cuál lado era cuál",
            tr: "Hangi tarafın hangisi olduğunu önce bilmeden iki parça kopardı",
          },
          {
            ar: "بقضمها بحذر تقلصت بسرعة حتى اصطدمت ذقنها بقدمها بقوة",
            es: "Al mordisquear con cuidado se encogió tan rápido que su barbilla golpeó fuerte contra su propio pie",
            tr: "Dikkatlice ısırınca öyle hızlı küçüldü ki çenesi kendi ayağına sertçe çarptı",
          },
          {
            ar: "قضمة من القطعة الأخرى مدّت رقبتها عاليًا فوق قمم الأشجار",
            es: "Un mordisco del otro trozo estiró su cuello muy por encima de las copas de los árboles",
            tr: "Diğer parçadan bir ısırık boynunu ağaç tepelerinin çok üzerine uzattı",
          },
          {
            ar: "أخطأ حمام عابر في اعتبار رقبتها الطويلة أفعى تبحث عن بيضه",
            es: "Una paloma que pasaba confundió su largo cuello con una serpiente en busca de sus huevos",
            tr: "Oradan geçen bir güvercin, onun uzun boynunu yumurtalarını arayan bir yılan sandı",
          },
        ],
      },
      {
        title: { ar: "خنزير وفلفل", es: "Cerdo y pimienta", tr: "Domuz ve Karabiber" },
        sentences: [
          {
            ar: "وصلت أليس أخيرًا إلى منزل صغير حيث سلّمها خادم على هيئة سمكة دعوة إلى الداخل",
            es: "Alicia llegó por fin a una casita donde un Lacayo Pez entregó una invitación para entrar",
            tr: "Alice sonunda küçük bir eve ulaştı, bir Balık Uşak içeri girmesi için bir davetiye teslim etti",
          },
          {
            ar: "بالداخل كانت دوقة تحمل طفلًا يصرخ بينما أضافت طاهيتها كمية كبيرة جدًا من الفلفل",
            es: "Adentro, una Duquesa sostenía a un bebé que aullaba mientras su cocinera añadía demasiada pimienta",
            tr: "İçeride bir Düşes uluyan bir bebeği tutuyordu, aşçısı ise fazlasıyla çok karabiber ekliyordu",
          },
          {
            ar: "عطس الجميع في المطبخ باستمرار عدا الدوقة وقطتها الشيشاير ذات الابتسامة العريضة",
            es: "Todos en la cocina estornudaban sin parar, excepto la Duquesa y su Gato de Cheshire de amplia sonrisa",
            tr: "Mutfaktaki herkes durmadan hapşırdı, Düşes ve geniş sırıtışlı Cheshire Kedisi hariç",
          },
          {
            ar: "سلّمت الدوقة فجأة الطفل لأليس واندفعت للعب الكروكيه",
            es: "La Duquesa de repente le entregó el bebé a Alicia y se marchó a jugar al críquet",
            tr: "Düşes aniden bebeği Alice'e verdi ve kroket oynamaya gitti",
          },
          {
            ar: "حملت أليس الحزمة المتذمرة إلى الخارج لتشاهدها تتحول ببطء إلى خنزير",
            es: "Alicia cargó el bulto quejumbroso afuera solo para verlo transformarse lentamente en un cerdo",
            tr: "Alice huysuz bebeği dışarı taşıdı, sadece onun yavaşça bir domuza dönüştüğünü görmek için",
          },
          {
            ar: "مرتاحة بطريقة غريبة أطلقت الخنزير الصغير حرًا بين الأشجار",
            es: "Aliviada de una manera extraña, dejó al pequeño cerdo libre entre los árboles",
            tr: "Tuhaf bir şekilde rahatlayan Alice, küçük domuzu ağaçların arasında serbest bıraktı",
          },
          {
            ar: "ظهرت قطة الشيشاير مبتسمة فوق شجرة وعرضت الاتجاهات على شكل ألغاز",
            es: "El Gato de Cheshire apareció sonriendo en un árbol y ofreció direcciones en forma de acertijos",
            tr: "Cheshire Kedisi bir ağaçta sırıtarak belirdi ve bilmeceler şeklinde yol tarifleri verdi",
          },
          {
            ar: "أوضح أن الجميع هنا مجانين تمامًا بمن فيهم أليس نفسها لمجرد زيارتها",
            es: "Explicó que todos por aquí estaban bastante locos, incluida la propia Alicia por venir de visita",
            tr: "Buradaki herkesin fazlasıyla deli olduğunu, ziyarete geldiği için Alice'in kendisi de dahil, açıkladı",
          },
        ],
      },
      {
        title: { ar: "حفلة الشاي الجنونية", es: "La merienda de locos", tr: "Çılgın Çay Partisi" },
        sentences: [
          {
            ar: "وصلت أليس إلى طاولة في الهواء الطلق معدّة لحفلة شاي لا تنتهي أبدًا",
            es: "Alicia llegó a una mesa al aire libre preparada para una merienda que nunca terminaba",
            tr: "Alice, hiç bitmeyen bir çay partisi için hazırlanmış açık havadaki bir masaya vardı",
          },
          {
            ar: "تزاحم القبعجي والأرنب الآذاري ونعسان الفأر معًا في زاوية صغيرة واحدة",
            es: "El Sombrerero, la Liebre de Marzo y un Lirón somnoliento se apretujaban juntos en una pequeña esquina",
            tr: "Şapkacı, Mart Tavşanı ve uykulu Sıçan tek bir küçük köşeye sıkışmışlardı",
          },
          {
            ar: "أصروا على عدم وجود مكان رغم أن الطاولة امتدت بلا نهاية بجانبهم",
            es: "Insistían en que no había sitio, aunque la mesa se extendía sin fin a su lado",
            tr: "Masa yanlarında sonsuza dek uzansa da yer olmadığında ısrar ettiler",
          },
          {
            ar: "أظهرت ساعة القبعجي فقط يوم الشهر ولم تعرض الوقت الصحيح إطلاقًا",
            es: "El reloj del Sombrerero solo mostraba el día del mes y nunca la hora correcta",
            tr: "Şapkacı'nın saati yalnızca ayın gününü gösteriyordu, doğru saati asla göstermiyordu",
          },
          {
            ar: "أوضح بحزن أن الزمن نفسه توقف عن الحديث معه منذ شجار قديم",
            es: "Explicó tristemente que el Tiempo mismo había dejado de hablarle desde una vieja disputa",
            tr: "Üzülerek Zaman'ın eski bir kavgadan beri kendisiyle konuşmayı kestiğini anlattı",
          },
          {
            ar: "تناقلت ألغاز بلا إجابات حقيقية حول الطاولة مع أكواب الشاي",
            es: "Acertijos sin respuestas reales circulaban por la mesa junto con las tazas de té",
            tr: "Gerçek cevabı olmayan bilmeceler çay fincanlarıyla birlikte masada dolaştı",
          },
          {
            ar: "كلما اتسخ كوب انتقلت الحفلة بأكملها إلى المقعد التالي",
            es: "Cada vez que una taza se ensuciaba, todo el grupo simplemente se desplazaba al siguiente asiento",
            tr: "Bir fincan kirlendiğinde tüm parti basitçe bir sonraki koltuğa kayıyordu",
          },
          {
            ar: "منهكة ومنزعجة وقفت أليس أخيرًا وابتعدت عن الطاولة التي لا تنتهي",
            es: "Exhausta e irritada, Alicia finalmente se levantó y se alejó de la mesa interminable",
            tr: "Bitkin ve sinirlenen Alice sonunda ayağa kalktı ve sonu gelmeyen masadan uzaklaştı",
          },
        ],
      },
      {
        title: {
          ar: "ملعب الكروكيه الخاص بالملكة",
          es: "El campo de críquet de la Reina",
          tr: "Kraliçe'nin Kroket Sahası",
        },
        sentences: [
          {
            ar: "تجولت أليس في حديقة حيث كانت أوراق اللعب بعصبية تصبغ الورود البيضاء باللون الأحمر",
            es: "Alicia entró en un jardín donde unas cartas de baraja, nerviosas, pintaban de rojo rosas blancas",
            tr: "Alice, iskambil kağıtlarının gergin bir şekilde beyaz gülleri kırmızıya boyadığı bir bahçeye girdi",
          },
          {
            ar: "سرعان ما وصل موكب صاخب بقيادة ملكة القلوب الشرسة سريعة الغضب",
            es: "Pronto llegó una ruidosa procesión encabezada por la feroz y colérica Reina de Corazones",
            tr: "Kısa süre sonra öfkeli ve tez canlı Kupa Kraliçesi'nin önderlik ettiği gürültülü bir alay geldi",
          },
          {
            ar: "طالبت الملكة باسم أليس ثم هددت فورًا بعبارتها المفضلة اقطعوا رأسها",
            es: "La Reina exigió el nombre de Alicia y de inmediato amenazó con su frase favorita que le corten la cabeza",
            tr: "Kraliçe Alice'in adını istedi ve hemen en sevdiği ifadeyle tehdit etti kellesini uçurun",
          },
          {
            ar: "بدأت لعبة كروكيه غريبة تستخدم طيور فلامنغو حية كمضارب وقنافذ كأكرات",
            es: "Comenzó un extraño partido de críquet usando flamencos vivos como mazos y erizos como bolas",
            tr: "Canlı flamingoların sopa, kirpilerin ise top olarak kullanıldığı tuhaf bir kroket oyunu başladı",
          },
          {
            ar: "تجادل كل لاعب باستمرار بينما أمرت الملكة بالإعدام لأتفه الأخطاء",
            es: "Cada jugador discutía constantemente mientras la Reina ordenaba ejecuciones por los errores más pequeños",
            tr: "Her oyuncu sürekli tartışırken Kraliçe en küçük hatalar için bile idam emri veriyordu",
          },
          {
            ar: "ظهر رأس قطة الشيشاير المبتسم عائمًا في الهواء مربكًا الجلاد الغاضب",
            es: "La cabeza sonriente del Gato de Cheshire apareció flotando en el aire, confundiendo al furioso verdugo",
            tr: "Cheshire Kedisi'nin sırıtan kafası havada asılı belirdi ve öfkeli celladı şaşırttı",
          },
          {
            ar: "لاحظت أليس بغرابة أنه بالكاد أُعدم أحد فعليًا رغم صراخ الملكة المستمر",
            es: "Alicia notó con extrañeza que casi nadie era ejecutado realmente pese a los gritos constantes de la Reina",
            tr: "Alice, Kraliçe'nin sürekli bağırmasına rağmen neredeyse hiç kimsenin gerçekten idam edilmediğini fark etti, tuhaf bir şekilde",
          },
          {
            ar: "قادت الملكة أليس قريبًا لمقابلة مخلوق غريب يُدعى السلحفاة الوهمية",
            es: "Pronto la Reina llevó a Alicia a conocer a una extraña criatura llamada la Falsa Tortuga",
            tr: "Kraliçe kısa süre sonra Alice'i Sahte Kaplumbağa adındaki garip bir yaratıkla tanıştırmak için götürdü",
          },
        ],
      },
      {
        title: {
          ar: "قصة السلحفاة الوهمية",
          es: "La historia de la Falsa Tortuga",
          tr: "Sahte Kaplumbağa'nın Hikayesi",
        },
        sentences: [
          {
            ar: "قاد نسر متكلم أليس إلى الأسفل لمقابلة السلحفاة الوهمية الحزينة المتنهدة",
            es: "Un Grifo parlante guio a Alicia hacia abajo para conocer a la triste y suspirante Falsa Tortuga",
            tr: "Konuşan bir Grifon Alice'i aşağıya, hüzünlü ve iç çeken Sahte Kaplumbağa'yla tanışmaya götürdü",
          },
          {
            ar: "بكت السلحفاة الوهمية باستمرار وهي تتذكر دروسها من أيام مدرستها تحت البحر",
            es: "La Falsa Tortuga lloraba sin parar mientras recordaba sus lecciones de la escuela bajo el mar",
            tr: "Sahte Kaplumbağa, denizin altındaki okul günlerinden derslerini hatırlarken durmadan ağladı",
          },
          {
            ar: "وصفت مواد غريبة مثل التدحرج والتلوي وفروع مختلفة من الحساب",
            es: "Describió materias extrañas como el Retorcerse y distintas ramas de la Aritmética",
            tr: "Yuvarlanma ve Kıvranma gibi garip dersleri ve Aritmetiğin farklı dallarını anlattı",
          },
          {
            ar: "معًا أدى النسر والسلحفاة الوهمية رقصة نشيطة تُدعى رقصة الكركند",
            es: "Juntos, el Grifo y la Falsa Tortuga interpretaron un enérgico baile llamado la Cuadrilla de la Langosta",
            tr: "Grifon ve Sahte Kaplumbağa birlikte Istakoz Kadrili adlı hareketli bir dans sergiledi",
          },
          {
            ar: "استمعت أليس بأدب رغم أن الرقصة والأغاني الغريبة أربكتها أكثر في كل لحظة",
            es: "Alicia escuchó cortésmente aunque el extraño baile y las canciones la confundían cada vez más",
            tr: "Alice nazikçe dinledi, gerçi tuhaf dans ve şarkılar onu her an biraz daha şaşırtıyordu",
          },
          {
            ar: "غنّت السلحفاة الوهمية بحزن عن الحساء وهي تذرف دموعًا غزيرة وحزينة",
            es: "La Falsa Tortuga cantó con tristeza sobre la sopa mientras derramaba enormes y tristes lágrimas",
            tr: "Sahte Kaplumbağa çorba hakkında hüzünle şarkı söylerken kocaman, kederli gözyaşları döktü",
          },
          {
            ar: "دوّى صوت بوق فجأة في المسافة معلنًا أن محاكمة على وشك البدء",
            es: "Un trompetazo sonó de repente a lo lejos anunciando que un juicio estaba a punto de comenzar",
            tr: "Uzaktan aniden bir trompet sesi geldi ve bir duruşmanın başlamak üzere olduğunu duyurdu",
          },
          {
            ar: "أمسك النسر يد أليس واندفع بها بسرعة نحو قاعة المحكمة البعيدة",
            es: "El Grifo tomó la mano de Alicia y la llevó apresuradamente hacia el lejano tribunal",
            tr: "Grifon Alice'in elini tuttu ve onu hızla uzaktaki mahkeme salonuna doğru sürükledi",
          },
        ],
      },
      {
        title: { ar: "من سرق الفطائر؟", es: "¿Quién robó las tartas?", tr: "Turtaları Kim Çaldı?" },
        sentences: [
          {
            ar: "في قاعة المحكمة المزدحمة وقف والد الوليت متهمًا بسرقة فطائر الملكة",
            es: "En el abarrotado tribunal, la Sota de Corazones estaba acusada de robar las tartas de la Reina",
            tr: "Kalabalık mahkeme salonunda Kupa Valesi, Kraliçe'nin turtalarını çalmakla suçlanarak durdu",
          },
          {
            ar: "ترأس ملك القلوب الجلسة بعصبية بينما طالبت الملكة المتحمسة بحكم فوري",
            es: "El Rey de Corazones presidía nervioso mientras la excitable Reina exigía una sentencia inmediata",
            tr: "Kupa Kralı gergin bir şekilde başkanlık ederken çabuk heyecanlanan Kraliçe anında bir ceza istedi",
          },
          {
            ar: "قدّم الشهود إفادات مربكة لا طائل منها لم توضح شيئًا عن السرقة الفعلية",
            es: "Los testigos dieron testimonios confusos e inútiles que no explicaban absolutamente nada sobre el robo real",
            tr: "Tanıklar, gerçek hırsızlık hakkında hiçbir şeyi açıklamayan kafa karıştırıcı, anlamsız ifadeler verdi",
          },
          {
            ar: "استُدعيت أليس نفسها كشاهدة وبدأت فجأة تكبر مجددًا دون أي فطر",
            es: "Llamada como testigo, Alicia de repente empezó a crecer de nuevo sin ningún hongo",
            tr: "Tanık olarak çağrılan Alice, hiçbir mantar olmadan aniden yeniden büyümeye başladı",
          },
          {
            ar: "صرخت الملكة بأمرها المعتاد مصرّة على قطع رأس أليس على الفور",
            es: "La Reina gritó su orden habitual, insistiendo en que le cortaran la cabeza a Alicia de inmediato",
            tr: "Kraliçe her zamanki emrini haykırdı ve Alice'in kellesinin hemen uçurulmasında ısrar etti",
          },
          {
            ar: "أعلنت أليس بجرأة أنهم ليسوا سوى مجموعة من أوراق اللعب العادية",
            es: "Alicia declaró con audacia que no eran más que un montón de simples cartas de baraja",
            tr: "Alice cesurca onların sıradan bir deste iskambil kağıdından başka bir şey olmadığını ilan etti",
          },
          {
            ar: "ارتفعت حزمة أوراق اللعب بأكملها وانطلقت غاضبة نحو وجهها",
            es: "Todo el mazo de cartas se levantó y voló furiosamente hacia su cara",
            tr: "Bütün kağıt destesi havaya kalktı ve öfkeyle onun yüzüne doğru uçtu",
          },
          {
            ar: "استيقظت أليس فجأة على ضفة النهر مدركة أن المغامرة الغريبة بأكملها كانت مجرد حلم",
            es: "Alicia despertó de repente a orillas del río, comprendiendo que toda la extraña aventura había sido solo un sueño",
            tr: "Alice aniden nehir kıyısında uyandı ve bütün bu tuhaf maceranın sadece bir rüya olduğunu fark etti",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-dracula",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة برام ستوكر عن محامٍ شاب يُسجن في قلعة في ترانسلفانيا ومصاص دماء قديم يتبعه إلى وطنه — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Bram Stoker sobre un joven abogado encarcelado en un castillo de Transilvania y el antiguo vampiro que lo sigue hasta su hogar — un relato personal, no el texto original.",
      tr: "Bram Stoker'ın, Transilvanya'daki bir şatoya hapsedilen genç bir avukat ve onu evine kadar takip eden kadim vampirin hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: {
          ar: "رحلة جوناثان هاركر",
          es: "El viaje de Jonathan Harker",
          tr: "Jonathan Harker'ın Yolculuğu",
        },
        sentences: [
          {
            ar: "سافر جوناثان هاركر إلى أعماق ترانسلفانيا لإتمام صفقة عقارية للكونت دراكولا",
            es: "Jonathan Harker viajó a lo profundo de Transilvania para finalizar la venta de una propiedad para el Conde Drácula",
            tr: "Jonathan Harker, Kont Drakula için bir mülk satışını tamamlamak üzere Transilvanya'nın derinliklerine seyahat etti",
          },
          {
            ar: "شعر القرويون على طول الطريق بالقلق ووضعوا صليبًا صغيرًا في يده",
            es: "Los aldeanos a lo largo del camino se inquietaron y le pusieron un pequeño crucifijo en la mano",
            tr: "Yol boyunca köylüler tedirgin oldu ve eline küçük bir haç sıkıştırdı",
          },
          {
            ar: "همسوا بخوف عن الذئاب وحذروه من عدم السفر أبدًا بعد منتصف الليل",
            es: "Susurraron con miedo sobre los lobos y le advirtieron que nunca viajara después de medianoche",
            tr: "Kurtlar hakkında korkuyla fısıldadılar ve gece yarısından sonra asla yolculuk etmemesi konusunda onu uyardılar",
          },
          {
            ar: "التقت به عربة سوداء غامضة عند الممر الجبلي وحملته بسرعة إلى القلعة",
            es: "Un misterioso carruaje negro lo esperaba en el paso de montaña y lo llevó rápidamente al castillo",
            tr: "Gizemli siyah bir araba onu geçitte karşıladı ve hızla şatoya götürdü",
          },
          {
            ar: "استقبله الكونت دراكولا شخصيًا عند الباب لأنه على ما يبدو لا يحتفظ بخدم",
            es: "El Conde Drácula lo recibió personalmente en la puerta, ya que aparentemente no tenía sirvientes",
            tr: "Kont Drakula onu bizzat kapıda karşıladı, çünkü görünüşe göre hiç hizmetçisi yoktu",
          },
          {
            ar: "كان الكونت شاحبًا وطويل القامة بقبضة قوية وأسنان مدببة غير معتادة",
            es: "El Conde, pálido y alto, tenía un apretón fuerte y unos dientes puntiagudos inusuales",
            tr: "Solgun ve uzun boylu olan Kont'un kavrayışı güçlüydü ve sivri dişleri alışılmadıktı",
          },
          {
            ar: "سأله باهتمام عن لندن وتفاصيل منزله الإنجليزي الجديد",
            es: "Le preguntó con interés sobre Londres y los detalles de su nueva casa inglesa",
            tr: "Ona Londra'yı ve yeni İngiliz evinin ayrıntılarını hevesle sordu",
          },
          {
            ar: "رغم أسلوب الكونت المهذب شعر هاركر برعب هادئ يتسلل إليه",
            es: "A pesar de los modales educados del Conde, Harker sintió un extraño temor silencioso que crecía en él",
            tr: "Kont'un kibar tavırlarına rağmen Harker içine sızan tuhaf, sessiz bir korku hissetti",
          },
        ],
      },
      {
        title: { ar: "سجين في القلعة", es: "Prisionero en el castillo", tr: "Şatoda Bir Tutsak" },
        sentences: [
          {
            ar: "لاحظ هاركر أن القلعة لا تحتوي على مرايا في أي مكان وأن الكونت لم يأكل معه أبدًا",
            es: "Harker notó que el castillo no tenía espejos en ninguna parte y que el Conde nunca comía con él",
            tr: "Harker şatoda hiçbir yerde ayna olmadığını ve Kont'un onunla asla yemek yemediğini fark etti",
          },
          {
            ar: "متجولًا في الممرات ليلًا أدرك أن كل باب كان موصدًا بإحكام",
            es: "Al vagar por los pasillos de noche, comprendió que cada puerta estaba firmemente cerrada",
            tr: "Gece koridorlarda dolaşırken her kapının sımsıkı kilitli olduğunu fark etti",
          },
          {
            ar: "من نافذته رأى مرة دراكولا يزحف رأسًا على عقب أسفل الجدار الخارجي للقلعة",
            es: "Desde su ventana vio una vez a Drácula arrastrándose cabeza abajo por el muro exterior del castillo",
            tr: "Penceresinden bir keresinde Drakula'yı şatonun dış duvarından baş aşağı sürünerek inerken gördü",
          },
          {
            ar: "مرعوبًا من المشهد أدرك هاركر أنه أصبح الآن سجينًا حقيقيًا عاجزًا",
            es: "Horrorizado por la escena, Harker comprendió que ahora era verdaderamente un prisionero indefenso",
            tr: "Bu manzaradan dehşete düşen Harker artık gerçekten çaresiz bir tutsak olduğunu anladı",
          },
          {
            ar: "كتب رسائل متوسلة إلى وطنه رغم أنه اشتبه بأن الكونت يتحكم سرًا بالبريد",
            es: "Escribió cartas suplicantes a su hogar, aunque sospechaba que el Conde controlaba secretamente el correo",
            tr: "Evine yalvaran mektuplar yazdı, gerçi Kont'un postayı gizlice kontrol ettiğinden şüpheleniyordu",
          },
          {
            ar: "طافت ذئاب عواءها الغريب حول أرض القلعة كل ليلة دون استثناء",
            es: "Extraños lobos aullantes rondaban los terrenos del castillo todas las noches sin excepción",
            tr: "Tuhaf uluyan kurtlar hiç istisnasız her gece şatonun etrafında dolaştı",
          },
          {
            ar: "بحث هاركر يائسًا عن أي باب غير موصد أو ممر مخفي يؤدي إلى الخارج",
            es: "Harker buscó desesperadamente cualquier puerta sin cerrar o pasadizo oculto que llevara al exterior",
            tr: "Harker dışarı açılan kilitli olmayan bir kapı ya da gizli bir geçit için çaresizce arandı",
          },
          {
            ar: "أضعف الخوف والعزلة شجاعته ببطء مع مرور كل يوم وحيد",
            es: "El miedo y el aislamiento fueron minando lentamente su valor con cada solitario día que pasaba",
            tr: "Korku ve yalnızlık, geçen her yalnız günle birlikte cesaretini yavaş yavaş kemiriyordu",
          },
        ],
      },
      {
        title: { ar: "العرائس الثلاث", es: "Las tres novias", tr: "Üç Gelin" },
        sentences: [
          {
            ar: "أثناء استكشافه غرفة محظورة صادف هاركر ثلاث نساء غريبات جميلات بعيون جائعة متوهجة",
            es: "Explorando una habitación prohibida, Harker se encontró con tres extrañas y hermosas mujeres de ojos hambrientos y brillantes",
            tr: "Yasak bir odayı keşfederken Harker, parlayan aç gözlere sahip üç tuhaf, güzel kadınla karşılaştı",
          },
          {
            ar: "اقتربن منه ببطء يتحركن برشاقة غير طبيعية جعلته يتجمد في مكانه",
            es: "Se acercaron a él lentamente, moviéndose con una gracia antinatural que lo dejó paralizado",
            tr: "Ona doğru yavaşça yaklaştılar, onu olduğu yere mıhlayan doğal olmayan bir zarafetle hareket ediyorlardı",
          },
          {
            ar: "بالضبط عندما اقتربن اقتحم دراكولا الغرفة غاضبًا وأمرهن بالابتعاد",
            es: "Justo cuando se acercaban, Drácula irrumpió furioso y les ordenó que se alejaran",
            tr: "Tam yaklaştıkları sırada Drakula öfkeyle içeri daldı ve onlara uzaklaşmalarını emretti",
          },
          {
            ar: "حذرهن بشدة بأن هاركر يخصه هو وحده ولا أحد غيره",
            es: "Les advirtió severamente que Harker le pertenecía solo a él y a nadie más",
            tr: "Onları sert bir şekilde Harker'ın yalnızca kendisine ait olduğu konusunda uyardı",
          },
          {
            ar: "لاحقًا اكتشف هاركر دراكولا مستلقيًا بلا حراك داخل صندوق خشبي قديم من التراب",
            es: "Más tarde, Harker descubrió a Drácula inmóvil dentro de una antigua caja de madera llena de tierra",
            tr: "Daha sonra Harker, Drakula'yı eski bir tahta toprak kutusunun içinde hareketsiz yatarken buldu",
          },
          {
            ar: "عازمًا على الهروب تسلق نفس الجدار المرعب الذي رأى الكونت يستخدمه من قبل",
            es: "Decidido a escapar, trepó por el mismo muro aterrador que una vez vio usar al Conde",
            tr: "Kaçmaya kararlı olan Harker, bir zamanlar Kont'u kullanırken gördüğü o korkunç duvara tırmandı",
          },
          {
            ar: "فرّ عبر الريف ووصل إلى مستشفى حيث لازمته الحمى لأسابيع",
            es: "Huyó a través del campo y llegó a un hospital donde la fiebre lo mantuvo postrado durante semanas",
            tr: "Kırlardan kaçtı ve haftalarca ateş içinde kaldığı bir hastaneye ulaştı",
          },
          {
            ar: "منهكًا ومهزوزًا تعافى هاركر أخيرًا بما يكفي للعودة إلى وطنه والزواج من مينا",
            es: "Destrozado y conmocionado, Harker finalmente se recuperó lo suficiente para volver a casa y casarse con Mina",
            tr: "Sarsılmış ve harap olan Harker sonunda eve dönüp Mina ile evlenecek kadar iyileşti",
          },
        ],
      },
      {
        title: { ar: "الوصول إلى إنجلترا", es: "Llegada a Inglaterra", tr: "İngiltere'ye Varış" },
        sentences: [
          {
            ar: "انجرفت سفينة محطمة تُدعى ديميتر إلى ميناء ويتبي دون طاقم على قيد الحياة",
            es: "Un barco maltrecho llamado Deméter llegó a la deriva al puerto de Whitby sin tripulación viva",
            tr: "Demeter adlı harap bir gemi, hayatta kalan mürettebatı olmadan Whitby limanına sürüklendi",
          },
          {
            ar: "وصف سجل القبطان اختفاء أفراد الطاقم واحدًا تلو الآخر خلال الرحلة",
            es: "El diario del capitán describía la desaparición de la tripulación uno a uno durante el viaje",
            tr: "Kaptanın kayıt defteri, yolculuk boyunca mürettebatın teker teker kaybolduğunu anlatıyordu",
          },
          {
            ar: "لم يتبقَّ سوى جثته مربوطة بإحكام إلى عجلة قيادة السفينة حتى النهاية",
            es: "Solo su propio cuerpo quedó atado firmemente al timón del barco hasta el final",
            tr: "Sadece kendi cesedi, sonuna kadar geminin dümenine sıkıca bağlı kalmıştı",
          },
          {
            ar: "أقسم شهود على الشاطئ أنهم رأوا مخلوقًا يشبه الذئب يقفز إلى اليابسة",
            es: "Testigos en la orilla juraron haber visto una criatura parecida a un lobo saltar a tierra",
            tr: "Kıyıdaki tanıklar kurt benzeri bir yaratığın karaya sıçradığını gördüklerine yemin ettiler",
          },
          {
            ar: "أُفرغت صناديق من تراب ترانسلفانيا بهدوء ونُقلت بعربة",
            es: "Cajas de tierra transilvana fueron descargadas silenciosamente y llevadas en un carro",
            tr: "Transilvanya toprağıyla dolu kutular sessizce boşaltıldı ve bir arabayla götürüldü",
          },
          {
            ar: "في هذه الأثناء بدأت لوسي ويستنرا الشابة المرحة تمشي أثناء نومها ليلًا",
            es: "Por esta época, Lucy Westenra, una joven alegre, comenzó a caminar dormida por las noches",
            tr: "Bu sıralarda neşeli genç bir kadın olan Lucy Westenra geceleri uyurgezerlik yapmaya başladı",
          },
          {
            ar: "وجدتها صديقتها القلقة مينا مرة جالسة شاحبة وساكنة بالقرب من المنحدرات",
            es: "Su preocupada amiga Mina la encontró una vez sentada pálida e inmóvil cerca de los acantilados",
            tr: "Endişeli arkadaşı Mina onu bir keresinde uçurumların yakınında solgun ve hareketsiz otururken buldu",
          },
          {
            ar: "ظهرت علامتان صغيرتان بشكل غامض على رقبة لوسي لم يستطع أحد تفسيرهما تمامًا",
            es: "Dos pequeñas marcas aparecieron misteriosamente en el cuello de Lucy que nadie podía explicar del todo",
            tr: "Lucy'nin boynunda kimsenin tam olarak açıklayamadığı iki küçük iz gizemli bir şekilde belirdi",
          },
        ],
      },
      {
        title: {
          ar: "مرض لوسي الغريب",
          es: "La extraña enfermedad de Lucy",
          tr: "Lucy'nin Tuhaf Hastalığı",
        },
        sentences: [
          {
            ar: "ضعفت لوسي أكثر كل يوم مهما حصلت من راحة أو رعاية",
            es: "Lucy se debilitaba más cada día sin importar cuánto descanso o cuidado recibiera",
            tr: "Ne kadar dinlense ya da bakılsa da Lucy her geçen gün daha da güçsüzleşiyordu",
          },
          {
            ar: "تناوب ثلاثة رجال أحبوها بصدق على مراقبتها بقلق",
            es: "Tres hombres que la amaban profundamente se turnaban para vigilarla con ansiedad",
            tr: "Onu içtenlikle seven üç adam onu endişeyle izlemek için nöbetleşiyordu",
          },
          {
            ar: "اعترف الدكتور سيوارد أحد خطّابها القلقين بأن مرضها أربك خبرته الطبية",
            es: "El Dr. Seward, uno de sus ansiosos pretendientes, admitió que su enfermedad desconcertaba su formación médica",
            tr: "Endişeli taliplerinden biri olan Dr. Seward, hastalığının tıbbi bilgisini şaşırttığını itiraf etti",
          },
          {
            ar: "كتب على عجل إلى معلمه القديم طبيب هولندي حكيم يُدعى فان هيلسنغ",
            es: "Escribió urgentemente a su antiguo maestro, un sabio médico holandés llamado Van Helsing",
            tr: "Eski öğretmeni, Van Helsing adlı bilge bir Hollandalı doktora acilen yazdı",
          },
          {
            ar: "أصبح نوم لوسي مضطربًا أكثر فأكثر وبدت قوتها تتلاشى كل صباح",
            es: "El sueño de Lucy se volvió cada vez más inquieto y su fuerza parecía desvanecerse cada mañana",
            tr: "Lucy'nin uykusu giderek huzursuzlaştı ve gücü her sabah biraz daha eriyor gibiydi",
          },
          {
            ar: "استمرت علامات العض الغريبة بالظهور على رقبتها رغم كل الاحتياطات الدقيقة المتخذة",
            es: "Extrañas marcas de mordedura seguían reapareciendo en su cuello pese a todas las cuidadosas precauciones tomadas",
            tr: "Alınan tüm dikkatli önlemlere rağmen boynunda tuhaf ısırık izleri belirmeye devam etti",
          },
          {
            ar: "اقتحم ذئب نافذة غرفتها مرة خلال عاصفة رعدية عنيفة",
            es: "Un lobo irrumpió una vez por la ventana de su habitación durante una violenta tormenta eléctrica",
            tr: "Şiddetli bir gök gürültülü fırtına sırasında bir kurt bir keresinde odasının penceresinden içeri daldı",
          },
          {
            ar: "أصبحت عائلتها وخطّابها يائسين وهم يراقبونها تذبل أمام أعينهم العاجزة",
            es: "Su familia y sus pretendientes se desesperaban al verla marchitarse ante sus ojos impotentes",
            tr: "Ailesi ve talipleri, onun çaresiz gözlerinin önünde solup gitmesini izlerken çaresizliğe kapıldı",
          },
        ],
      },
      {
        title: { ar: "وصول فان هيلسنغ", es: "Llega Van Helsing", tr: "Van Helsing Geliyor" },
        sentences: [
          {
            ar: "وصل فان هيلسنغ واشتبه فورًا بشيء أغرب بكثير من مرض عادي",
            es: "Van Helsing llegó y de inmediato sospechó de algo mucho más extraño que una enfermedad común",
            tr: "Van Helsing geldi ve hemen sıradan bir hastalıktan çok daha tuhaf bir şeyden şüphelendi",
          },
          {
            ar: "أمر بتعليق أزهار الثوم بكثافة حول غرفة لوسي ورقبتها كل ليلة",
            es: "Ordenó colgar flores de ajo en abundancia alrededor de la habitación y el cuello de Lucy cada noche",
            tr: "Her gece Lucy'nin odasının ve boynunun etrafına bolca sarımsak çiçeği asılmasını emretti",
          },
          {
            ar: "رغم احتياطاته الدقيقة أزالت والدة لوسي الأزهار دون أن تفهم غرضها الحقيقي",
            es: "A pesar de sus cuidadosas precauciones, la madre de Lucy quitó las flores sin comprender su verdadero propósito",
            tr: "Onun dikkatli önlemlerine rağmen Lucy'nin annesi gerçek amacını anlamadan çiçekleri kaldırdı",
          },
          {
            ar: "بالكاد أبقت عمليات نقل الدم المتعددة من خطّابها المخلصين لوسي على قيد الحياة في كل مرة",
            es: "Múltiples transfusiones de sangre de sus devotos pretendientes apenas mantenían con vida a Lucy cada vez",
            tr: "Sadık taliplerinden yapılan çok sayıda kan nakli her seferinde Lucy'yi zar zor hayatta tutuyordu",
          },
          {
            ar: "أصبح فان هيلسنغ أكثر جدية وألمح بهدوء إلى شيء قديم وشرير",
            es: "Van Helsing se puso cada vez más grave e insinuó con calma algo antiguo y maligno",
            tr: "Van Helsing giderek daha ciddileşti ve sessizce kadim ve kötücül bir şeye işaret etti",
          },
          {
            ar: "رفض في البداية أن يشرح بالكامل شكه المتزايد حول مصاصي الدماء",
            es: "Al principio se negó a explicar por completo su creciente sospecha sobre los vampiros",
            tr: "Vampirlerle ilgili artan şüphesini başta tam olarak açıklamayı reddetti",
          },
          {
            ar: "رغم كل الجهود استمرت حالة لوسي بالتدهور مع كل ليلة مرعبة تمر",
            es: "A pesar de todos los esfuerzos, el estado de Lucy siguió empeorando con cada aterradora noche que pasaba",
            tr: "Tüm çabalara rağmen Lucy'nin durumu geçen her korkunç geceyle birlikte kötüleşmeye devam etti",
          },
          {
            ar: "في صباح مأساوي وجدت العائلة أخيرًا لوسي شاحبة وباردة وساكنة تمامًا",
            es: "Una trágica mañana, la familia finalmente encontró a Lucy pálida, fría y completamente inmóvil",
            tr: "Trajik bir sabah aile sonunda Lucy'yi solgun, soğuk ve tamamen hareketsiz buldu",
          },
        ],
      },
      {
        title: { ar: "مصير لوسي", es: "El destino de Lucy", tr: "Lucy'nin Kaderi" },
        sentences: [
          {
            ar: "بعد جنازتها انتشرت تقارير مقلقة عن امرأة شاحبة شوهدت بالقرب من أطفال المنطقة",
            es: "Tras su funeral, surgieron inquietantes informes de una mujer pálida vista cerca de niños del lugar",
            tr: "Cenazesinden sonra, yerel çocukların yakınında görülen solgun bir kadına dair rahatsız edici haberler yayıldı",
          },
          {
            ar: "كشف فان هيلسنغ أخيرًا نظريته المروعة بأن لوسي أصبحت واحدة من الموتى الأحياء",
            es: "Van Helsing finalmente reveló su terrible teoría de que Lucy se había convertido en una de los no muertos",
            tr: "Van Helsing sonunda Lucy'nin ölümsüzlerden biri haline geldiğine dair korkunç teorisini açıkladı",
          },
          {
            ar: "قاد خطّابها الحزانى إلى ضريحها في ليلة مقلقة مقمرة",
            es: "Guio a sus afligidos pretendientes hasta su tumba en una inquietante noche de luna",
            tr: "Yasa boğulmuş taliplerini ürkütücü, ay ışığıyla aydınlanan bir gecede mezarına götürdü",
          },
          {
            ar: "بالداخل وجدوا تابوتها فارغًا تمامًا رغم دفنها الأخير",
            es: "Adentro encontraron su ataúd completamente vacío a pesar de su reciente entierro",
            tr: "İçeride, yakın zamanda gömülmüş olmasına rağmen tabutunun tamamen boş olduğunu buldular",
          },
          {
            ar: "بعد ذلك بوقت قصير شاهدوا لوسي نفسها تنزلق بصمت عائدة نحو ضريحها",
            es: "Poco después, presenciaron a la propia Lucy deslizarse silenciosamente de vuelta hacia su tumba",
            tr: "Kısa süre sonra Lucy'nin kendisinin sessizce mezarına doğru süzüldüğüne tanık oldular",
          },
          {
            ar: "بدا وجهها اللطيف يومًا ما باردًا وقاسيًا وجائعًا للدماء بلا شك",
            es: "Su rostro, antes gentil, ahora se veía frío, cruel e indudablemente hambriento de sangre",
            tr: "Bir zamanlar nazik olan yüzü artık soğuk, acımasız ve şüphesiz kan susamışı görünüyordu",
          },
          {
            ar: "بقلب محطم لكنه عازم غرس خطيبها وتدًا في قلبها لتحريرها",
            es: "Con el corazón roto pero decidido, su prometido le clavó una estaca en el corazón para liberarla",
            tr: "Kalbi kırık ama kararlı olan nişanlısı, onu özgür kılmak için kalbine bir kazık sapladı",
          },
          {
            ar: "قطعوا رأسها وملأوا فمها بالثوم لينهوا معاناتها إلى الأبد",
            es: "Le cortaron la cabeza y le llenaron la boca de ajo, poniendo fin a su sufrimiento para siempre",
            tr: "Başını kestiler ve acısına sonsuza dek son vermek için ağzını sarımsakla doldurdular",
          },
        ],
      },
      {
        title: { ar: "مينا في خطر", es: "Mina en peligro", tr: "Mina Tehlikede" },
        sentences: [
          {
            ar: "بعد رحيل لوسي وجّهت المجموعة اهتمامها العازم نحو تدمير دراكولا نفسه",
            es: "Con Lucy fuera, el grupo dirigió su atención decidida hacia destruir al propio Drácula",
            tr: "Lucy gittikten sonra grup kararlı dikkatini Drakula'nın kendisini yok etmeye yöneltti",
          },
          {
            ar: "تعقّبوا وأغلقوا كل صندوق من التراب يحتاجه للراحة",
            es: "Localizaron y sellaron cada caja de tierra que él necesitaba para descansar",
            tr: "Onun dinlenmek için ihtiyaç duyduğu her toprak kutusunu buldular ve mühürlediler",
          },
          {
            ar: "غاضبًا من تدخلهم بدأ دراكولا باستهداف مينا هاركر كضحيته التالية",
            es: "Furioso por su intromisión, Drácula comenzó a apuntar a Mina Harker como su próxima víctima",
            tr: "Müdahalelerine öfkelenen Drakula, bir sonraki kurbanı olarak Mina Harker'ı hedef almaya başladı",
          },
          {
            ar: "تسلل إلى غرفتها ليلًا وأجبرها على شرب دمه الخاص",
            es: "Se coló en su habitación por la noche y la obligó a beber su propia sangre",
            tr: "Geceleyin odasına sızdı ve onu kendi kanını içmeye zorladı",
          },
          {
            ar: "خلق هذا الفعل المروع رابطًا نفسيًا مظلمًا بين دراكولا ومينا",
            es: "Este terrible acto creó un oscuro vínculo psíquico entre Drácula y Mina",
            tr: "Bu korkunç eylem Drakula ile Mina arasında karanlık bir zihinsel bağ yarattı",
          },
          {
            ar: "مرعوبة وخجلة توسلت مينا للمجموعة أن يدمروها إذا تحولت يومًا ما",
            es: "Horrorizada y avergonzada, Mina suplicó al grupo que la destruyeran si alguna vez se transformaba",
            tr: "Dehşete düşen ve utanan Mina, eğer bir gün dönüşürse kendisini yok etmeleri için gruba yalvardı",
          },
          {
            ar: "حماها فان هيلسنغ بقربانة مباركة تركت علامة حارقة على جلدها",
            es: "Van Helsing la protegió con una hostia bendita que dejó una marca ardiente en su piel",
            tr: "Van Helsing onu kutsanmış bir ekmekle korudu ve bu cildinde yanan bir iz bıraktı",
          },
          {
            ar: "سباقًا مع الزمن طاردت المجموعة صناديق دراكولا المتبقية المخفية في أنحاء لندن",
            es: "Contra el tiempo, el grupo rastreó las cajas restantes y escondidas de Drácula por todo Londres",
            tr: "Zamana karşı yarışan grup, Drakula'nın Londra genelinde gizli kalan kutularının peşine düştü",
          },
        ],
      },
      {
        title: { ar: "الصيادون يقتربون", es: "Los cazadores se acercan", tr: "Avcılar Yaklaşıyor" },
        sentences: [
          {
            ar: "واحدًا تلو الآخر حددوا موقع كل صندوق من تراب ترانسلفانيا في لندن ودمّروه",
            es: "Uno por uno localizaron y destruyeron cada caja de tierra transilvana en Londres",
            tr: "Teker teker Londra'daki her Transilvanya toprağı kutusunu buldular ve yok ettiler",
          },
          {
            ar: "محاصَرًا وغاضبًا فرّ دراكولا من المدينة عازمًا على العودة إلى قلعته",
            es: "Acorralado y furioso, Drácula huyó de la ciudad decidido a regresar a su castillo",
            tr: "Köşeye sıkışan ve öfkelenen Drakula, şatosuna dönmeye kararlı bir şekilde şehirden kaçtı",
          },
          {
            ar: "مستخدمًا رابطهما الغريب نوّم فان هيلسنغ مينا مغناطيسيًا لتحديد موقع الكونت",
            es: "Usando su extraño vínculo, Van Helsing hipnotizó a Mina para sentir la ubicación del Conde",
            tr: "Van Helsing, garip bağlarını kullanarak Mina'yı Kont'un konumunu hissetmesi için hipnotize etti",
          },
          {
            ar: "انقسمت المجموعة وسارعت برًا ونهرًا لاعتراضه أولًا",
            es: "El grupo se dividió, corriendo por tierra y río para interceptarlo primero",
            tr: "Grup ikiye bölündü, onu ilk ele geçirmek için karadan ve nehirden yarıştılar",
          },
          {
            ar: "أبطأ ثلج الشتاء رحلتهم الصعبة عبر ريف ترانسلفانيا البري",
            es: "La nieve invernal ralentizó su difícil viaje a través del salvaje campo transilvano",
            tr: "Kış karı, vahşi Transilvanya kırsalındaki zorlu yolculuklarını yavaşlattı",
          },
          {
            ar: "حرس الغجر الموالون لدراكولا عربة تحمل صندوقه الأخير من التراب",
            es: "Gitanos leales a Drácula custodiaban un carro que transportaba su última caja de tierra",
            tr: "Drakula'ya sadık çingeneler, son toprak kutusunu taşıyan bir arabayı koruyordu",
          },
          {
            ar: "اندلع قتال متوتر ويائس تمامًا مع بدء غروب الشمس",
            es: "Estalló una lucha tensa y desesperada justo cuando el sol comenzaba a ponerse",
            tr: "Güneş batmaya başladığı sırada gergin, çaresiz bir mücadele patlak verdi",
          },
          {
            ar: "قاتل الصيادون بشراسة عازمين على إنهاء المطاردة قبل عودة الظلام",
            es: "Los cazadores lucharon ferozmente, decididos a terminar la persecución antes de que volviera la oscuridad",
            tr: "Avcılar karanlık geri dönmeden kovalamacayı bitirmeye kararlı bir şekilde şiddetle savaştı",
          },
        ],
      },
      {
        title: {
          ar: "المطاردة إلى ترانسلفانيا",
          es: "La persecución hacia Transilvania",
          tr: "Transilvanya'ya Kovalamaca",
        },
        sentences: [
          {
            ar: "شق جوناثان هاركر حنجرة الكونت بالضبط عندما فُتح الغطاء",
            es: "Jonathan Harker cortó la garganta del Conde justo cuando se abría la tapa",
            tr: "Kapak açıldığı anda Jonathan Harker Kont'un boğazını kesti",
          },
          {
            ar: "غرز كوينسي موريس نصله مباشرة في قلب دراكولا في اللحظة نفسها تمامًا",
            es: "Quincy Morris clavó su cuchilla directamente en el corazón de Drácula en ese mismo instante",
            tr: "Quincy Morris aynı anda bıçağını doğrudan Drakula'nın kalbine sapladı",
          },
          {
            ar: "تفتت جسد دراكولا بسرعة إلى غبار في اللحظة التي لامسه فيها ضوء الشمس الأخير",
            es: "El cuerpo de Drácula se desmoronó rápidamente en polvo en el instante en que lo tocó la última luz del sol",
            tr: "Son güneş ışığı ona değdiği anda Drakula'nın bedeni hızla toz haline geldi",
          },
          {
            ar: "اختفت العلامة المظلمة على جبين مينا فورًا محررة إياها من لعنته",
            es: "La marca oscura en la frente de Mina desapareció al instante, liberándola de su maldición",
            tr: "Mina'nın alnındaki karanlık iz anında kayboldu ve onu lanetinden özgür kıldı",
          },
          {
            ar: "غمرت الراحة والإرهاق المجموعة بعد انتهاء مطاردتهم الطويلة والخطيرة",
            es: "El alivio y el agotamiento invadieron al grupo tras el final de su larga y peligrosa persecución",
            tr: "Uzun ve tehlikeli kovalamacaları sona erdikten sonra grubu rahatlama ve bitkinlik kapladı",
          },
          {
            ar: "للأسف أُصيب كوينسي موريس إصابة قاتلة خلال المعركة ومات بين أصدقائه",
            es: "Tristemente, Quincy Morris resultó mortalmente herido durante la lucha y murió entre sus amigos",
            tr: "Ne yazık ki Quincy Morris mücadele sırasında ölümcül şekilde yaralandı ve arkadaşlarının arasında öldü",
          },
          {
            ar: "سمّت مينا وجوناثان لاحقًا ابنهما جزئيًا تكريمًا لذلك الرجل الشجاع",
            es: "Mina y Jonathan más tarde nombraron a su hijo en parte en honor a aquel hombre valiente",
            tr: "Mina ve Jonathan daha sonra oğullarına kısmen o cesur adamın onuruna isim verdiler",
          },
          {
            ar: "بعد سنوات احتفظوا بملاحظاتهم الغريبة كدليل على أن كابوسهم قد انتهى حقًا",
            es: "Años después, conservaron sus extrañas notas como prueba de que su pesadilla realmente había terminado",
            tr: "Yıllar sonra, kabuslarının gerçekten sona erdiğinin kanıtı olarak tuhaf notlarını sakladılar",
          },
        ],
      },
    ],
  },
  {
    id: "book-novel-hound-baskervilles",
    description: {
      ar: "ملخص أصلي من سنتنس ستيب لقصة آرثر كونان دويل عن شيرلوك هولمز وهو يحقق في أسطورة مميتة تطارد أراضي عائلة باسكرفيل — إعادة سرد شخصية، وليست النص الأصلي.",
      es: "Un resumen original de SentenceStep de la historia de Arthur Conan Doyle sobre Sherlock Holmes investigando una leyenda mortal que atormenta el páramo de la familia Baskerville — un relato personal, no el texto original.",
      tr: "Arthur Conan Doyle'ın, Sherlock Holmes'un Baskerville ailesinin bozkırına musallat olan ölümcül bir efsaneyi araştırmasını anlatan hikayesinin özgün bir SentenceStep özeti — kişisel bir yeniden anlatım, orijinal metin değil.",
    },
    sections: [
      {
        title: {
          ar: "زيارة الدكتور مورتيمر",
          es: "La visita del Dr. Mortimer",
          tr: "Dr. Mortimer'ın Ziyareti",
        },
        sentences: [
          {
            ar: "زار الدكتور جيمس مورتيمر شيرلوك هولمز حاملًا تعبيرًا قلقًا قديمًا وعصا مشي",
            es: "El Dr. James Mortimer visitó a Sherlock Holmes con una vieja expresión preocupada y un bastón",
            tr: "Dr. James Mortimer, endişeli eski bir ifade ve bir baston taşıyarak Sherlock Holmes'u ziyaret etti",
          },
          {
            ar: "أوضح أن صديقه السير تشارلز باسكرفيل وُجد ميتًا مؤخرًا في الأراضي الموحشة",
            es: "Explicó que su amigo Sir Charles Baskerville había sido hallado muerto recientemente en el páramo",
            tr: "Arkadaşı Sör Charles Baskerville'in yakın zamanda bozkırda ölü bulunduğunu anlattı",
          },
          {
            ar: "تجمّد وجه السير تشارلز في تعبير من الرعب المطلق الذي لا لبس فيه",
            es: "El rostro de Sir Charles quedó congelado en una expresión de terror absoluto e inconfundible",
            tr: "Sör Charles'ın yüzü, kesin ve mutlak bir dehşet ifadesiyle donup kalmıştı",
          },
          {
            ar: "اكتُشفت آثار مخالب كبيرة بشكل غريب في الطين بالقرب من جثته",
            es: "Se descubrieron extrañamente grandes huellas de garras en el barro cerca de su cuerpo sin vida",
            tr: "Cansız bedeninin yakınındaki çamurda tuhaf derecede büyük pençe izleri keşfedildi",
          },
          {
            ar: "وصف مورتيمر أسطورة عائلية قديمة عن كلب وحشي يلعن سلالة باسكرفيل",
            es: "Mortimer describió una vieja leyenda familiar sobre un perro monstruoso que maldecía el linaje Baskerville",
            tr: "Mortimer, Baskerville soyunu lanetleyen canavarca bir tazı hakkındaki eski bir aile efsanesini anlattı",
          },
          {
            ar: "قبل قرون استدعى جد قاسٍ يُدعى هوغو المخلوق بنفسه على ما يبدو",
            es: "Siglos atrás, un cruel antepasado llamado Hugo aparentemente había invocado a la criatura él mismo",
            tr: "Yüzyıllar önce Hugo adında zalim bir ata görünüşe göre yaratığı kendisi çağırmıştı",
          },
          {
            ar: "استمع هولمز بعناية رغم أنه ظل متشككًا علنًا تجاه أي تفسير خارق للطبيعة",
            es: "Holmes escuchó con atención, aunque se mantuvo públicamente escéptico ante cualquier explicación sobrenatural",
            tr: "Holmes dikkatle dinledi, gerçi doğaüstü herhangi bir açıklama konusunda açıkça şüpheci kaldı",
          },
          {
            ar: "وافق على التحقيق خاصة أن وريثًا جديدًا كان مسافرًا للمطالبة بالعقار",
            es: "Aceptó investigar, especialmente porque un nuevo heredero viajaba para reclamar la propiedad",
            tr: "Özellikle yeni bir varisin mülkü talep etmek için yolculuk ettiğini öğrenince araştırmayı kabul etti",
          },
        ],
      },
      {
        title: { ar: "الأسطورة", es: "La leyenda", tr: "Efsane" },
        sentences: [
          {
            ar: "قرأ مورتيمر بصوت عالٍ مخطوطة قديمة مصفرّة تصف لعنة باسكرفيل الأصلية",
            es: "Mortimer leyó en voz alta un viejo manuscrito amarillento que describía la maldición original de los Baskerville",
            tr: "Mortimer, orijinal Baskerville lanetini anlatan eski, sararmış bir el yazmasını yüksek sesle okudu",
          },
          {
            ar: "كان هوغو باسكرفيل الشرير قد اختطف يومًا ابنة مزارع محلي خائفة وصغيرة",
            es: "El malvado Hugo Baskerville había secuestrado una vez a la joven y asustada hija de un granjero local",
            tr: "Kötü Hugo Baskerville bir zamanlar yerel bir çiftçinin küçük, korkmuş kızını kaçırmıştı",
          },
          {
            ar: "عندما هربت من النافذة طاردها هوغو بغضب عبر الأراضي المظلمة",
            es: "Cuando ella escapó por la ventana, Hugo la persiguió furioso a través del páramo oscuro",
            tr: "Kız pencereden kaçtığında Hugo onu karanlık bozkırda öfkeyle kovaladı",
          },
          {
            ar: "وجد أصدقاؤه الثملون لاحقًا جثته الممزقة بجانب كلب ضخم متوهج",
            es: "Sus amigos borrachos encontraron después su cuerpo destrozado junto a un enorme perro resplandeciente",
            tr: "Sarhoş arkadaşları daha sonra onun parçalanmış cesedini kocaman, parıldayan bir köpeğin yanında buldu",
          },
          {
            ar: "منذ تلك الليلة المروعة أُبلغ عن رؤية وحوش سوداء غريبة تطارد الأراضي",
            es: "Desde aquella terrible noche se informó de extrañas bestias negras que rondaban el páramo",
            tr: "O korkunç geceden beri bozkırda tuhaf kara canavarlar görüldüğü bildirildi",
          },
          {
            ar: "توفي العديد من أفراد عائلة باسكرفيل فجأة في ظروف غامضة بنفس القدر",
            es: "Varios miembros de la familia Baskerville murieron repentinamente en circunstancias igualmente misteriosas",
            tr: "Baskerville ailesinden birçok kişi aynı derecede gizemli koşullar altında aniden öldü",
          },
          {
            ar: "استجوب هولمز كل تفصيل عملي رافضًا قبول الأسطورة دون دليل حقيقي",
            es: "Holmes cuestionó cada detalle práctico, negándose a aceptar la leyenda sin pruebas reales",
            tr: "Holmes her pratik ayrıntıyı sorguladı, gerçek kanıt olmadan efsaneyi kabul etmeyi reddetti",
          },
          {
            ar: "قرر أن اللغز يتطلب عملًا ميدانيًا دقيقًا بدلًا من الخرافات أو حكايات الأشباح القديمة",
            es: "Decidió que el misterio requería un trabajo de campo cuidadoso en lugar de superstición o viejas historias de fantasmas",
            tr: "Gizemin batıl inanç ya da eski hayalet hikayeleri yerine dikkatli saha çalışması gerektirdiğine karar verdi",
          },
        ],
      },
      {
        title: { ar: "وصول السير هنري", es: "Llega Sir Henry", tr: "Sör Henry Geliyor" },
        sentences: [
          {
            ar: "وصل السير هنري باسكرفيل من كندا متحمسًا للمطالبة بميراثه الجديد غير المتوقع",
            es: "Sir Henry Baskerville llegó desde Canadá, ansioso por reclamar su inesperada nueva herencia",
            tr: "Sör Henry Baskerville, beklenmedik yeni mirasını talep etmek için hevesle Kanada'dan geldi",
          },
          {
            ar: "اختفى أحد حذائه الجديدين بشكل غامض من غرفته في الفندق بين عشية وضحاها",
            es: "Una de sus botas nuevas desapareció misteriosamente de su habitación de hotel de la noche a la mañana",
            tr: "Yeni çizmelerinden biri bir gecede otel odasından gizemli bir şekilde kayboldu",
          },
          {
            ar: "حذّرته رسالة غريبة مُجمّعة من حروف صحف بالابتعاد عن الأراضي الموحشة",
            es: "Una extraña nota compuesta con letras de periódico le advirtió que se mantuviera alejado del páramo",
            tr: "Gazete harflerinden oluşturulmuş garip bir not, onu bozkırdan uzak durması konusunda uyardı",
          },
          {
            ar: "لاحظ هولمز أن أحدهم كان يتبع السير هنري سرًا عبر شوارع لندن المزدحمة",
            es: "Holmes notó que alguien había estado siguiendo en secreto a Sir Henry por las concurridas calles de Londres",
            tr: "Holmes birinin Sör Henry'yi Londra'nın kalabalık sokaklarında gizlice takip ettiğini fark etti",
          },
          {
            ar: "وقعت الشبهة سريعًا على باريمور الخادم الهادئ منذ فترة طويلة في منزل باسكرفيل",
            es: "La sospecha recayó rápidamente sobre Barrymore, el mayordomo tranquilo y de largo servicio de la casa Baskerville",
            tr: "Şüphe hızla Baskerville hanesinin uzun süredir sessiz uşağı Barrymore üzerine düştü",
          },
          {
            ar: "قرر هولمز أنه لا يستطيع مغادرة لندن بعد رغم أن القضية تتطلب اهتمامًا أوثق",
            es: "Holmes decidió que aún no podía dejar Londres, aunque el caso exigía una atención más cercana",
            tr: "Holmes, dava daha yakından ilgi gerektirse de henüz Londra'dan ayrılamayacağına karar verdi",
          },
          {
            ar: "بدلًا من ذلك أرسل الدكتور واطسون لمرافقة السير هنري بأمان إلى قصر باسكرفيل",
            es: "En su lugar, envió al Dr. Watson para acompañar a Sir Henry con seguridad hasta la mansión Baskerville",
            tr: "Bunun yerine Dr. Watson'ı Sör Henry'ye Baskerville Malikanesi'ne kadar güvenle eşlik etmesi için gönderdi",
          },
          {
            ar: "وافق واطسون فورًا عازمًا على حماية موكل صديقه من أي خطر حقيقي",
            es: "Watson aceptó de inmediato, decidido a proteger al cliente de su amigo de cualquier peligro real",
            tr: "Watson hemen kabul etti, arkadaşının müvekkilini gerçek bir tehlikeden korumaya kararlıydı",
          },
        ],
      },
      {
        title: {
          ar: "واطسون في قصر باسكرفيل",
          es: "Watson en la mansión Baskerville",
          tr: "Baskerville Malikanesi'nde Watson",
        },
        sentences: [
          {
            ar: "وقف القصر القديم كئيبًا ومهيبًا محاطًا بالأراضي الموحشة الشاسعة",
            es: "La antigua mansión se erguía sombría e imponente, rodeada por el vasto y solitario páramo",
            tr: "Eski malikane, geniş ve ıssız bozkırla çevrili, kasvetli ve heybetli bir şekilde duruyordu",
          },
          {
            ar: "لاحظ واطسون أن زوجة باريمور كانت تبكي مؤخرًا رغم أنها أنكرت وجود أي مشكلة",
            es: "Watson notó que la esposa de Barrymore había estado llorando recientemente, aunque ella negó cualquier problema",
            tr: "Watson, Barrymore'un karısının yakın zamanda ağladığını fark etti, gerçi kadın herhangi bir sorunu inkar etti",
          },
          {
            ar: "في إحدى الليالي المتأخرة سمع واطسون نحيبًا واضحًا يتردد صداه عبر المنزل القديم الصامت",
            es: "Una noche tardía, Watson escuchó un llanto inconfundible resonando por la silenciosa casa antigua",
            tr: "Geç bir gece Watson, sessiz eski evde yankılanan belirgin bir hıçkırık sesi duydu",
          },
          {
            ar: "سرعان ما اكتشف أن باريمور كان يشير سرًا لشخص ما في الأراضي المظلمة بشمعة",
            es: "Pronto descubrió que Barrymore estaba haciendo señales en secreto a alguien en el páramo oscuro con una vela",
            tr: "Kısa süre sonra Barrymore'un bir mumla karanlık bozkırdaki birine gizlice işaret verdiğini keşfetti",
          },
          {
            ar: "عند مواجهته مباشرة اعترف باريمور بأنه كان يساعد سجينًا هاربًا يُدعى سيلدن على البقاء حيًا",
            es: "Confrontado directamente, Barrymore admitió que estaba ayudando a sobrevivir a un convicto fugado llamado Selden",
            tr: "Doğrudan yüzleştirildiğinde Barrymore, Selden adlı kaçak bir mahkumun hayatta kalmasına yardım ettiğini itiraf etti",
          },
          {
            ar: "بشكل مذهل تبيّن أن سيلدن هو شقيق زوجته اليائس المضطرب",
            es: "Sorprendentemente, Selden resultó ser el propio hermano desesperado y problemático de su esposa",
            tr: "Şaşırtıcı bir şekilde Selden, karısının çaresiz, sorunlu öz kardeşi çıktı",
          },
          {
            ar: "بدت الأراضي نفسها خطيرة بشكل متزايد مع مستنقعاتها المخفية وضبابها الكثيف الذي لا يمكن التنبؤ به",
            es: "El propio páramo se sentía cada vez más peligroso, con sus ciénagas ocultas y su espesa niebla impredecible",
            tr: "Bozkırın kendisi, gizli bataklıkları ve öngörülemeyen yoğun sisiyle giderek daha tehlikeli hissettiriyordu",
          },
          {
            ar: "كتب واطسون رسائل مفصلة إلى هولمز يصف كل حدث غريب ومقلق",
            es: "Watson escribió cartas detalladas a Holmes describiendo cada extraño e inquietante suceso",
            tr: "Watson, Holmes'a her tuhaf ve rahatsız edici olayı anlatan ayrıntılı mektuplar yazdı",
          },
        ],
      },
      {
        title: {
          ar: "الرجل على التلة الصخرية",
          es: "El hombre en el peñasco",
          tr: "Kayalıktaki Adam",
        },
        sentences: [
          {
            ar: "في إحدى الليالي رصد واطسون شخصية غامضة صامتة تقف وحدها فوق تلة صخرية",
            es: "Una noche, Watson divisó una figura misteriosa y silenciosa de pie sola sobre un peñasco rocoso",
            tr: "Bir gece Watson, kayalık bir tepenin üzerinde tek başına duran gizemli, sessiz bir figür gördü",
          },
          {
            ar: "اختفى الرجل المجهول قبل أن يستطيع واطسون الاقتراب بما يكفي لرؤية وجهه",
            es: "El hombre desconocido desapareció antes de que Watson pudiera acercarse lo suficiente para verle el rostro",
            tr: "Watson yüzünü görecek kadar yaklaşamadan tanınmayan adam ortadan kayboldu",
          },
          {
            ar: "صادف واطسون أيضًا سيلدن الشرس المتصلب مختبئًا بين صخور الأراضي الوعرة",
            es: "Watson también se topó con el feroz y endurecido Selden escondido entre las rocas del páramo",
            tr: "Watson ayrıca bozkırın kayalık uçurumları arasında saklanan vahşi, sertleşmiş Selden'le karşılaştı",
          },
          {
            ar: "علم بوجود عائلة ستابلتون عالم طبيعة وأخته الصغرى اللذين يعيشان بالقرب",
            es: "Se enteró de los Stapleton, un naturalista y su hermana menor, que vivían cerca",
            tr: "Yakınlarda yaşayan bir doğa bilimci ve küçük kız kardeşi olan Stapleton'ları öğrendi",
          },
          {
            ar: "طارد ستابلتون الفراشات بنشاط عبر الأراضي غير مكترث على ما يبدو بمستنقعاتها الخطيرة",
            es: "Stapleton perseguía mariposas enérgicamente por el páramo, aparentemente indiferente a sus peligrosas ciénagas",
            tr: "Stapleton, tehlikeli bataklıklarına aldırmıyormuş gibi görünerek bozkırda enerjik bir şekilde kelebek kovaladı",
          },
          {
            ar: "أشار إلى مستنقع غريمبن سيئ السمعة محذرًا من أنه قد يبتلع شخصًا بالكامل",
            es: "Señaló la infame Ciénaga de Grimpen, advirtiendo que podía tragarse a una persona por completo",
            tr: "Bir kişiyi bütünüyle yutabileceği konusunda uyararak kötü şöhretli Grimpen Bataklığı'nı işaret etti",
          },
          {
            ar: "وجد واطسون نفسه منجذبًا أكثر فأكثر لأخت ستابلتون الساحرة الذكية بيريل",
            es: "Watson se sintió cada vez más atraído por la encantadora e inteligente hermana de Stapleton, Beryl",
            tr: "Watson kendini Stapleton'ın çekici, zeki kız kardeşi Beryl'e giderek daha fazla çekilmiş buldu",
          },
          {
            ar: "حذّرته بشكل غير متوقع بإلحاح بمغادرة الأراضي وعدم العودة أبدًا",
            es: "Ella le advirtió inesperadamente y con urgencia que dejara el páramo y no regresara jamás",
            tr: "Beklenmedik bir şekilde onu bozkırı terk etmesi ve asla geri dönmemesi konusunda aciliyetle uyardı",
          },
        ],
      },
      {
        title: { ar: "جيران غريبون", es: "Vecinos extraños", tr: "Tuhaf Komşular" },
        sentences: [
          {
            ar: "تتبّع واطسون أخيرًا الغريب الغامض المراقب إلى كوخ حجري مخفي في الأراضي",
            es: "Watson finalmente rastreó al misterioso extraño vigilante hasta una choza de piedra escondida en el páramo",
            tr: "Watson sonunda gizemli, gözetleyen yabancıyı bozkırda gizli bir taş kulübeye kadar izledi",
          },
          {
            ar: "بالداخل فوجئ وسُرّ لاكتشاف شيرلوك هولمز ينتظره بهدوء",
            es: "Adentro, se sorprendió y alegró al descubrir a Sherlock Holmes esperándolo tranquilamente",
            tr: "İçeride, Sherlock Holmes'un sakince kendisini beklediğini keşfedince şaşırdı ve sevindi",
          },
          {
            ar: "أوضح هولمز أنه كان يحقق سرًا في كل شيء من الظل طوال الوقت",
            es: "Holmes explicó que había estado investigando todo en secreto desde las sombras todo este tiempo",
            tr: "Holmes bunca zamandır gölgelerden her şeyi gizlice araştırdığını açıkladı",
          },
          {
            ar: "كشف أن بيريل كانت في الواقع زوجة ستابلتون وليست أخته حقًا",
            es: "Reveló que Beryl era en realidad la esposa de Stapleton y no verdaderamente su hermana",
            tr: "Beryl'in aslında Stapleton'ın karısı olduğunu, gerçekten kız kardeşi olmadığını açıkladı",
          },
          {
            ar: "ربطهم اسم عائلتهم الحقيقي سرًا بسلالة باسكرفيل الملعونة نفسها",
            es: "Su verdadero apellido los conectaba en secreto con el propio linaje maldito de los Baskerville",
            tr: "Gerçek soyadları onları gizlice lanetli Baskerville soyunun kendisine bağlıyordu",
          },
          {
            ar: "فجأة اخترقت صرخة مرعبة الظلام الضبابي في مكان ما في الأراضي",
            es: "De repente, un grito aterrador rasgó la oscuridad brumosa en algún lugar del páramo",
            tr: "Aniden dehşet verici bir çığlık, bozkırda bir yerlerde sisli karanlığı yardı",
          },
          {
            ar: "اندفع الرجلان بجنون نحو الصوت خائفين على السير هنري من الأسوأ",
            es: "Ambos hombres corrieron frenéticamente hacia el sonido, temiendo lo peor para Sir Henry",
            tr: "İki adam da sesin geldiği yöne çılgınca koştu, Sör Henry için en kötüsünden korkuyorlardı",
          },
          {
            ar: "وجدا جثة سيلدن مرتدية ملابس مستعارة بوضوح من السير هنري",
            es: "Encontraron el cuerpo de Selden vestido con ropas claramente prestadas de Sir Henry",
            tr: "Selden'in cesedini, açıkça Sör Henry'den ödünç alınmış giysiler içinde buldular",
          },
        ],
      },
      {
        title: { ar: "صرخة في الليل", es: "Un grito en la noche", tr: "Gecede Bir Çığlık" },
        sentences: [
          {
            ar: "يبدو أن سيلدن سقط ميتًا وهو يهرب من شيء مرعب عبر الأراضي",
            es: "Selden aparentemente había caído muerto mientras huía de algo aterrador a través del páramo",
            tr: "Selden, görünüşe göre bozkırda korkunç bir şeyden kaçarken düşüp ölmüştü",
          },
          {
            ar: "اشتبه هولمز أن الكلب أخطأ سيلدن بالسير هنري في الظلام والضباب",
            es: "Holmes sospechó que el perro había confundido a Selden con Sir Henry en la oscuridad y la niebla",
            tr: "Holmes, köpeğin karanlıkta ve siste Selden'i Sör Henry sanmış olabileceğinden şüphelendi",
          },
          {
            ar: "وصل ستابلتون إلى مكان الحادثة متظاهرًا بالصدمة رغم أن عينيه خانتا خيبة أمل حقيقية",
            es: "Stapleton llegó a la escena fingiendo conmoción, aunque sus ojos delataban una decepción real",
            tr: "Stapleton olay yerine şok geçirmiş gibi davranarak geldi, gerçi gözleri gerçek bir hayal kırıklığını ele veriyordu",
          },
          {
            ar: "قرر هولمز بهدوء استخدام السير هنري نفسه كطُعم للإمساك بالقاتل أخيرًا",
            es: "Holmes decidió tranquilamente usar al propio Sir Henry como cebo para atrapar finalmente al asesino",
            tr: "Holmes sessizce katili sonunda yakalamak için Sör Henry'nin kendisini yem olarak kullanmaya karar verdi",
          },
          {
            ar: "عاد هو وواطسون سرًا إلى لندن لتعزيز أدلتهما ضد ستابلتون",
            es: "Él y Watson regresaron en secreto a Londres para reforzar sus pruebas contra Stapleton",
            tr: "O ve Watson, Stapleton'a karşı kanıtlarını güçlendirmek için gizlice Londra'ya döndüler",
          },
          {
            ar: "اكتشفا لوحة قديمة تثبت صلة ستابلتون الحقيقية التي لا لبس فيها بعائلة باسكرفيل",
            es: "Descubrieron un antiguo retrato que probaba la verdadera e inconfundible conexión de Stapleton con la familia Baskerville",
            tr: "Stapleton'ın Baskerville ailesiyle gerçek ve kesin bağlantısını kanıtlayan eski bir portre keşfettiler",
          },
          {
            ar: "واثقين من هذا الدليل الجديد أسرع هولمز وواطسون بالعودة نحو الأراضي الموحشة",
            es: "Confiados con esta nueva evidencia, Holmes y Watson se apresuraron de vuelta hacia el solitario páramo",
            tr: "Bu yeni kanıttan emin olan Holmes ve Watson, ıssız bozkıra doğru aceleyle geri döndüler",
          },
          {
            ar: "وافق السير هنري بتوتر على المشي إلى المنزل وحيدًا من عشاء كما هو مخطط كطُعم",
            es: "Sir Henry accedió nervioso a caminar solo a casa desde una cena, tal como se planeó, como cebo",
            tr: "Sör Henry, planlandığı gibi yem olarak bir akşam yemeğinden yalnız yürüyerek eve dönmeyi gergin bir şekilde kabul etti",
          },
        ],
      },
      {
        title: {
          ar: "هولمز يكشف عن نفسه",
          es: "Holmes se revela",
          tr: "Holmes Kendini Gösteriyor",
        },
        sentences: [
          {
            ar: "أوضح هولمز أن غيابه الطويل السري كان ضروريًا لمراقبة ستابلتون دون أن يُرى",
            es: "Holmes explicó que su larga ausencia secreta había sido necesaria para observar a Stapleton sin ser visto",
            tr: "Holmes, uzun gizli yokluğunun Stapleton'ı görülmeden gözlemlemek için gerekli olduğunu açıkladı",
          },
          {
            ar: "كشف أن ستابلتون درّب كلبًا ضخمًا باستخدام الفوسفور لجعله يتوهج",
            es: "Reveló que Stapleton había entrenado a un perro enorme usando fósforo para hacerlo brillar",
            tr: "Stapleton'ın kocaman bir köpeği fosfor kullanarak parlaması için eğittiğini açıkladı",
          },
          {
            ar: "استُخدم هذا الكلب المتوهج المرعب نفسه لإخافة السير تشارلز حتى الموت",
            es: "Ese mismo aterrador perro resplandeciente había sido usado para asustar a Sir Charles hasta la muerte",
            tr: "Aynı korkunç, parlayan köpek, Sör Charles'ı korkudan öldürmek için kullanılmıştı",
          },
          {
            ar: "أمل ستابلتون أن يرث ثروة باسكرفيل بأكملها بالقضاء على كل وريث متبقٍ",
            es: "Stapleton esperaba heredar toda la fortuna Baskerville eliminando a cada heredero restante",
            tr: "Stapleton, kalan her varisi ortadan kaldırarak Baskerville servetinin tamamını miras almayı umuyordu",
          },
          {
            ar: "تمركز هولمز وواطسون بعناية في الضباب منتظرَين بالقرب من طريق الأراضي",
            es: "Holmes y Watson se posicionaron cuidadosamente en la niebla, esperando cerca del sendero del páramo",
            tr: "Holmes ve Watson bozkır patikasının yakınında bekleyerek sisin içinde dikkatlice konumlandılar",
          },
          {
            ar: "انضم إليهم المفتش ليستراد بهدوء مسلحًا ومستعدًا لأي شيء قد يظهر",
            es: "El inspector Lestrade se unió a ellos en silencio, armado y listo para lo que pudiera surgir",
            tr: "Müfettiş Lestrade sessizce onlara katıldı, silahlıydı ve ne çıkarsa çıksın hazırdı",
          },
          {
            ar: "جعل الضباب الكثيف المتدحرج الانتظار الخطير أكثر توترًا وإرهاقًا للأعصاب",
            es: "La espesa niebla que se arrastraba hizo que la peligrosa espera fuera aún más tensa y angustiante",
            tr: "Yuvarlanan yoğun sis, tehlikeli bekleyişi daha da gergin ve sinir bozucu hale getirdi",
          },
          {
            ar: "أخيرًا سمعوا خطوات السير هنري تقترب بثبات على طول الطريق المظلم الموحش",
            es: "Finalmente escucharon los pasos de Sir Henry acercándose firmemente por el oscuro y solitario camino",
            tr: "Sonunda Sör Henry'nin adımlarının karanlık, ıssız yol boyunca kararlı bir şekilde yaklaştığını duydular",
          },
        ],
      },
      {
        title: { ar: "الكلب يهاجم", es: "El sabueso ataca", tr: "Tazı Saldırıyor" },
        sentences: [
          {
            ar: "انفجر كلب ضخم متوهج فجأة من الضباب مطاردًا السير هنري بلا رحمة",
            es: "Un monstruoso perro resplandeciente irrumpió de repente entre la niebla, persiguiendo sin piedad a Sir Henry",
            tr: "Canavarca, parlayan bir tazı aniden sisin içinden fırlayarak Sör Henry'yi acımasızca kovaladı",
          },
          {
            ar: "أطلق هولمز وواطسون النار من مسدساتهما بسرعة مما أسقط المخلوق الضخم",
            es: "Holmes y Watson dispararon sus revólveres rápidamente, derribando a la enorme criatura",
            tr: "Holmes ve Watson tabancalarını hızla ateşleyerek kocaman yaratığı yere serdi",
          },
          {
            ar: "نجا السير هنري وهو مصدوم بشدة لكنه لحسن الحظ لم يُصب من هجوم الوحش الضخم",
            es: "Sir Henry sobrevivió gravemente conmocionado, pero afortunadamente ileso por el ataque de la enorme bestia",
            tr: "Sör Henry ağır şekilde sarsılmış olarak hayatta kaldı ama neyse ki dev canavarın saldırısından zarar görmedi",
          },
          {
            ar: "عند فحص الكلب عن قرب أكدوا أن التوهج الغريب جاء من الفوسفور المطلي",
            es: "Al examinar al perro de cerca, confirmaron que el extraño resplandor provenía del fósforo pintado",
            tr: "Köpeği yakından inceleyince o tuhaf parıltının boyalı fosfordan geldiğini doğruladılar",
          },
          {
            ar: "اختفى ستابلتون في اللحظة التي فشلت فيها خطته الوحشية بوضوح وتمامًا",
            es: "Stapleton había desaparecido en el momento en que su monstruoso plan fracasó clara y completamente",
            tr: "Stapleton, canavarca planı açıkça ve tamamen başarısız olduğu anda ortadan kaybolmuştu",
          },
          {
            ar: "اشتبه هولمز أنه فرّ يائسًا عبر الأراضي نحو مستنقع غريمبن الخطير",
            es: "Holmes sospechó que había huido desesperadamente por el páramo hacia la peligrosa Ciénaga de Grimpen",
            tr: "Holmes onun çaresizce bozkırdan tehlikeli Grimpen Bataklığı'na doğru kaçtığından şüphelendi",
          },
          {
            ar: "بحثوا بإلحاح عبر الضباب متتبعين آثار أقدامه المتسرعة اليائسة والمتهورة",
            es: "Buscaron urgentemente entre la niebla, siguiendo sus apresuradas, desesperadas y temerarias huellas",
            tr: "Onun aceleci, çaresiz ve pervasız ayak izlerini takip ederek sisin içinde aceleyle arandılar",
          },
          {
            ar: "لم يُعثر إلا على حذاء السير هنري المفقود مهجورًا في أعماق المستنقع الغادر",
            es: "Solo se encontró la bota perdida de Sir Henry, abandonada en lo profundo de la traicionera ciénaga",
            tr: "Sadece Sör Henry'nin kayıp çizmesi, hain bataklığın derinliklerinde terk edilmiş halde bulundu",
          },
        ],
      },
      {
        title: { ar: "الحقيقة تُكشف", es: "La verdad revelada", tr: "Gerçek Ortaya Çıkıyor" },
        sentences: [
          {
            ar: "استنتج هولمز أن ستابلتون غرق على الأرجح تمامًا داخل المستنقع الذي لا يرحم",
            es: "Holmes concluyó que Stapleton casi con certeza se había ahogado dentro de la implacable ciénaga",
            tr: "Holmes, Stapleton'ın neredeyse kesin olarak o acımasız bataklığın içinde boğulduğu sonucuna vardı",
          },
          {
            ar: "أوضح أن ستابلتون كان سرًا سليل باسكرفيل منبوذًا يسعى وراء ثروة العائلة المفقودة",
            es: "Explicó que Stapleton era en secreto un descendiente Baskerville repudiado que buscaba la fortuna perdida de la familia",
            tr: "Stapleton'ın gizlice reddedilmiş bir Baskerville soyundan geldiğini ve ailenin kayıp servetinin peşinde olduğunu açıkladı",
          },
          {
            ar: "استُخدم الحذاء المسروق لإعطاء الكلب رائحة السير هنري المميزة",
            es: "La bota robada se había usado para darle al perro el olor distintivo de Sir Henry",
            tr: "Çalınan çizme, köpeğe Sör Henry'nin ayırt edici kokusunu vermek için kullanılmıştı",
          },
          {
            ar: "اعترفت بيريل بأنها حاولت يائسة تحذير السير هنري رغم تهديدات زوجها",
            es: "Beryl admitió que había intentado desesperadamente advertir a Sir Henry a pesar de las amenazas de su esposo",
            tr: "Beryl, kocasının tehditlerine rağmen Sör Henry'yi çaresizce uyarmaya çalıştığını itiraf etti",
          },
          {
            ar: "تعافى السير هنري ببطء من المحنة المرعبة رغم أنه بقي مهزوزًا بعمق من الأحداث",
            es: "Sir Henry se recuperó lentamente de la aterradora prueba, aunque quedó profundamente afectado por los sucesos",
            tr: "Sör Henry korkunç sınavdan yavaşça toparlandı, gerçi olaylardan derinden sarsılmış olarak kaldı",
          },
          {
            ar: "سافر في النهاية إلى الخارج آملًا أن تشفي المسافة والوقت أعصابه تمامًا",
            es: "Finalmente viajó al extranjero, esperando que la distancia y el tiempo sanaran por completo sus nervios",
            tr: "Sonunda mesafenin ve zamanın sinirlerini tamamen iyileştireceğini umarak yurt dışına gitti",
          },
          {
            ar: "استنتج هولمز بحزم أنه لا توجد لعنة حقيقية بل فقط طمع وقسوة ذكية وعلم",
            es: "Holmes concluyó firmemente que no existía ninguna maldición real, solo codicia, crueldad ingeniosa y ciencia",
            tr: "Holmes kesin bir şekilde gerçek bir lanetin olmadığı, yalnızca açgözlülük, kurnaz zalimlik ve bilim olduğu sonucuna vardı",
          },
          {
            ar: "ينتهي كلب عائلة باسكرفيل بحل اللغز العائلي القديم أخيرًا وبشكل كامل",
            es: "El sabueso de los Baskerville termina con la vieja leyenda familiar finalmente y por completo resuelta",
            tr: "Baskervilleların Tazısı, eski aile efsanesinin sonunda ve tamamen çözülmesiyle sona erer",
          },
        ],
      },
    ],
  },
];

async function main() {
  const descriptionRows: {
    content_type: "book";
    content_id: string;
    field: "description";
    locale: "ar" | "es" | "tr";
    value: string;
    status: "approved";
  }[] = [];
  const titleRows: {
    content_type: "book_section";
    content_id: string;
    field: "title";
    locale: "ar" | "es" | "tr";
    value: string;
    status: "approved";
  }[] = [];
  const sentenceRows: {
    content_type: "book_sentence";
    content_id: string;
    field: "text";
    locale: "ar" | "es" | "tr";
    value: string;
    status: "approved";
  }[] = [];

  for (const novel of TRANSLATIONS) {
    for (const locale of ["ar", "es", "tr"] as const) {
      descriptionRows.push({
        content_type: "book",
        content_id: novel.id,
        field: "description",
        locale,
        value: novel.description[locale],
        status: "approved",
      });
    }
    novel.sections.forEach((section, secIndex) => {
      const sectionId = `${novel.id}-sec${secIndex + 1}`;
      for (const locale of ["ar", "es", "tr"] as const) {
        titleRows.push({
          content_type: "book_section",
          content_id: sectionId,
          field: "title",
          locale,
          value: section.title[locale],
          status: "approved",
        });
      }
      section.sentences.forEach((sentence, sentIndex) => {
        const sentenceId = `${sectionId}-s${sentIndex + 1}`;
        for (const locale of ["ar", "es", "tr"] as const) {
          sentenceRows.push({
            content_type: "book_sentence",
            content_id: sentenceId,
            field: "text",
            locale,
            value: sentence[locale],
            status: "approved",
          });
        }
      });
    });
  }

  const { error: descError } = await supabase
    .from("content_translations")
    .upsert(descriptionRows, { onConflict: "content_type,content_id,field,locale" });
  if (descError) throw descError;
  console.log(`Upserted ${descriptionRows.length} description translations.`);

  const { error: titleError } = await supabase
    .from("content_translations")
    .upsert(titleRows, { onConflict: "content_type,content_id,field,locale" });
  if (titleError) throw titleError;
  console.log(`Upserted ${titleRows.length} section title translations.`);

  // Sentence rows are large — chunked to stay well under any single-request
  // payload/row limit, same reasoning as chunked .in() queries elsewhere.
  const CHUNK = 200;
  let sentenceCount = 0;
  for (let i = 0; i < sentenceRows.length; i += CHUNK) {
    const chunk = sentenceRows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("content_translations")
      .upsert(chunk, { onConflict: "content_type,content_id,field,locale" });
    if (error) throw error;
    sentenceCount += chunk.length;
  }
  console.log(`Upserted ${sentenceCount} sentence translations.`);
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
