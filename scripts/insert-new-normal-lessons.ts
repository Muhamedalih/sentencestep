/**
 * One-time push of the 12 new Normal lessons (normal-13..normal-24 in the
 * local static seed, src/data/lessons/normal.ts) into the live, linked
 * Supabase project. Not part of the running app.
 *
 * Why a script instead of the admin CMS UI: creating a lesson through
 * /admin/content/new requires typing Spanish and Turkish text into every
 * title/description/sentence field (validateLessonInput's isNewContent
 * requirement) — driving that by browser automation for 12 lessons would be
 * ~500+ individual UI interactions. This script writes the exact same rows
 * saveLesson() (src/lib/admin/content-actions.ts) would produce for a
 * fully-filled-out admin submission: a `lessons` row, 9 `sentences` rows
 * (with word_translations populated directly, since the admin CMS has no
 * editor for that field), and content_translations rows for es/ar/tr on the
 * title, description, and every sentence, each marked "approved" exactly as
 * a direct human edit would be (see upsertTranslation's doc comment).
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-new-normal-lessons.ts
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { normalLessons } from "../src/data/lessons/normal";
import { REQUIRED_SENTENCE_COUNT } from "../src/lib/admin/validation";
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

const LEVEL_ID: Record<1 | 2 | 3, string> = {
  1: "c358850c-bc55-4867-9d0b-1fd77ce5244c",
  2: "5f2d679d-c0b6-4f58-8378-52ef78f45648",
  3: "dc1f8d84-0999-4fad-8b37-6872f8263e9b",
};

interface Translation {
  es: string;
  tr: string;
}

/** Spanish/Turkish translations, keyed by lesson id then sentence id — the local seed only carries en/ar, so these live here rather than widening that file's shape for a one-time push. */
const TITLE_TRANSLATIONS: Record<string, Translation> = {
  "normal-13": { es: "El Ascensor Silencioso", tr: "Sessiz Asansör" },
  "normal-14": { es: "El Reto del Karaoke", tr: "Karaoke Meydan Okuması" },
  "normal-15": { es: "El Perro Perdido", tr: "Kayıp Köpek" },
  "normal-16": { es: "El Corte de Pelo Desastroso", tr: "Kötü Saç Kesimi" },
  "normal-17": { es: "El Chat Grupal", tr: "Grup Sohbeti" },
  "normal-18": { es: "Hablar en la Reunión", tr: "Toplantıda Sesini Yükseltmek" },
  "normal-19": { es: "Diez Años Después", tr: "On Yıl Sonra" },
  "normal-20": { es: "La Lluvia No Invitada", tr: "Davetsiz Yağmur" },
  "normal-21": { es: "Principiante de Nuevo", tr: "Yeniden Acemi" },
  "normal-22": { es: "La Silla Vacía", tr: "Boş Sandalye" },
  "normal-23": { es: "Decirlo Primero", tr: "Önce Söylemek" },
  "normal-24": { es: "El Padrino de Boda", tr: "Sağdıç" },
};

const DESCRIPTION_TRANSLATIONS: Record<string, Translation> = {
  "normal-13": {
    es: "Dos vecinos suben en el mismo ascensor todos los días sin decir una palabra, hasta que se corta la luz.",
    tr: "İki komşu, elektrikler kesilene kadar her gün aynı asansöre hiç konuşmadan biner.",
  },
  "normal-14": {
    es: "Unos amigos empujan a una cantante nerviosa hacia el escenario y ocurre algo sorprendente.",
    tr: "Arkadaşlar gergin bir şarkıcıyı sahneye iter ve şaşırtıcı bir şey olur.",
  },
  "normal-15": {
    es: "Un perro sin dueño da lugar a un acto de bondad inesperado.",
    tr: "Sahipsiz bir köpek beklenmedik bir iyilik hareketine yol açar.",
  },
  "normal-16": {
    es: "Un desastre de peluquería la noche antes de un gran evento enseña una lección sobre la confianza.",
    tr: "Büyük bir etkinlikten önceki gece yaşanan saç kesimi felaketi, özgüven hakkında bir ders verir.",
  },
  "normal-17": {
    es: "Un flujo constante de notificaciones empuja a alguien a poner un límite que no sabía que necesitaba.",
    tr: "Sürekli gelen bildirimler, birini ihtiyacı olduğunu bilmediği bir sınır koymaya iter.",
  },
  "normal-18": {
    es: "Un empleado nuevo se mantiene callado durante semanas hasta que una idea lo cambia todo.",
    tr: "Yeni bir çalışan haftalarca sessiz kalır, ta ki bir fikir her şeyi değiştirene kadar.",
  },
  "normal-19": {
    es: "Un reencuentro de secundaria convierte la comparación silenciosa en un alivio inesperado.",
    tr: "Bir lise buluşması, sessiz kıyaslamayı beklenmedik bir rahatlamaya dönüştürür.",
  },
  "normal-20": {
    es: "Un pícnic de cumpleaños se arruina por la lluvia hasta que el grupo se niega a dejar que termine.",
    tr: "Bir doğum günü pikniği yağmurla mahvolur, ta ki grup bunun bitmesine izin vermeyi reddedene kadar.",
  },
  "normal-21": {
    es: "Aprender a tocar la guitarra a los treinta y cuatro años significa enfrentarte a lo malo que eres en algo nuevo.",
    tr: "Otuz dört yaşında gitara başlamak, yeni bir şeyde ne kadar kötü olduğunla yüzleşmek demektir.",
  },
  "normal-22": {
    es: "Una llamada telefónica después de ocho años de silencio obliga a tomar una difícil decisión sobre el perdón.",
    tr: "Sekiz yıllık sessizlikten sonra gelen bir telefon araması, affetmekle ilgili zor bir karar vermeyi zorunlu kılar.",
  },
  "normal-23": {
    es: "Años ocultando un sentimiento por una amiga cercana finalmente llegan a un punto crítico.",
    tr: "Yakın bir arkadaşa duyulan bir hissi yıllarca gizlemek sonunda patlama noktasına gelir.",
  },
  "normal-24": {
    es: "Estar junto a su hermano, más exitoso que él, en el altar hace resurgir viejos celos.",
    tr: "Kendisinden daha başarılı olan kardeşinin yanında nikâh masasında durmak, eski kıskançlığı yüzeye çıkarır.",
  },
};

const SENTENCE_TRANSLATIONS: Record<string, Translation> = {
  "normal-13-s1": {
    es: "Cada mañana subía en el ascensor con mi vecina.",
    tr: "Her sabah komşumla aynı asansöre binerdim.",
  },
  "normal-13-s2": {
    es: "Nunca nos dijimos ni una sola palabra.",
    tr: "Birbirimize tek kelime bile etmezdik.",
  },
  "normal-13-s3": {
    es: "Una noche, el ascensor se detuvo de repente entre dos pisos.",
    tr: "Bir akşam asansör iki kat arasında aniden durdu.",
  },
  "normal-13-s4": {
    es: "Las luces se apagaron y mi corazón empezó a latir muy rápido.",
    tr: "Işıklar söndü ve kalbim hızla çarpmaya başladı.",
  },
  "normal-13-s5": {
    es: "Ella se rió nerviosamente y dijo esto es nuevo.",
    tr: "Gergin bir şekilde güldü ve bu yeni dedi.",
  },
  "normal-13-s6": {
    es: "Hablamos durante veinte minutos mientras esperábamos ayuda.",
    tr: "Yardım beklerken yirmi dakika boyunca konuştuk.",
  },
  "normal-13-s7": {
    es: "Descubrí que a ella le gustaba la misma música que a mí.",
    tr: "Onun da benimle aynı müziği sevdiğini öğrendim.",
  },
  "normal-13-s8": {
    es: "El ascensor finalmente volvió a moverse y los dos sonreímos.",
    tr: "Asansör sonunda tekrar hareket etti ve ikimiz de gülümsedik.",
  },
  "normal-13-s9": {
    es: "Ahora siempre nos saludamos y a veces tomamos un café juntas.",
    tr: "Şimdi her zaman selamlaşıyoruz ve bazen birlikte kahve içiyoruz.",
  },

  "normal-14-s1": {
    es: "Odio cantar delante de otras personas.",
    tr: "Başkalarının önünde şarkı söylemekten nefret ederim.",
  },
  "normal-14-s2": {
    es: "Mis amigos eligieron mi nombre para la noche de karaoke.",
    tr: "Arkadaşlarım karaoke gecesi için benim adımı seçti.",
  },
  "normal-14-s3": {
    es: "Mis manos temblaban cuando tomé el micrófono.",
    tr: "Mikrofonu aldığımda ellerim titriyordu.",
  },
  "normal-14-s4": {
    es: "Olvidé por completo la primera línea de la canción.",
    tr: "Şarkının ilk mısrasını tamamen unuttum.",
  },
  "normal-14-s5": {
    es: "Toda la sala empezó a cantarla por mí.",
    tr: "Tüm salon benim yerime söylemeye başladı.",
  },
  "normal-14-s6": {
    es: "Finalmente me relajé y simplemente disfruté la canción.",
    tr: "Sonunda rahatladım ve şarkının tadını çıkardım.",
  },
  "normal-14-s7": {
    es: "La gente aplaudió fuerte cuando la música se detuvo.",
    tr: "Müzik durduğunda insanlar yüksek sesle alkışladı.",
  },
  "normal-14-s8": {
    es: "Mis amigos dijeron que debería cantar más seguido.",
    tr: "Arkadaşlarım daha sık şarkı söylemem gerektiğini söyledi.",
  },
  "normal-14-s9": {
    es: "Ahora en realidad espero con ganas la noche de karaoke.",
    tr: "Şimdi karaoke gecesini gerçekten iple çekiyorum.",
  },

  "normal-15-s1": {
    es: "Un perrito me siguió a casa desde el parque.",
    tr: "Küçük bir köpek parktan eve kadar beni takip etti.",
  },
  "normal-15-s2": {
    es: "No tenía collar y parecía muy hambriento.",
    tr: "Tasması yoktu ve çok aç görünüyordu.",
  },
  "normal-15-s3": { es: "Le di agua y un poco de comida.", tr: "Ona su ve biraz yiyecek verdim." },
  "normal-15-s4": {
    es: "Publiqué su foto en un grupo local en internet.",
    tr: "Fotoğrafını internetteki yerel bir grupta paylaştım.",
  },
  "normal-15-s5": {
    es: "Una mujer respondió en menos de una hora, llorando de alivio.",
    tr: "Bir saat içinde bir kadın rahatlamış bir şekilde ağlayarak cevap verdi.",
  },
  "normal-15-s6": {
    es: "Dijo que el perro se había escapado hacía tres días.",
    tr: "Köpeğin üç gün önce kaçtığını söyledi.",
  },
  "normal-15-s7": {
    es: "Condujo directamente a mi casa para recogerlo.",
    tr: "Onu almak için doğruca evime araba sürdü.",
  },
  "normal-15-s8": {
    es: "El perro saltó a sus brazos de inmediato.",
    tr: "Köpek hemen onun kollarına atladı.",
  },
  "normal-15-s9": {
    es: "Todavía me manda fotos de él cada mes.",
    tr: "Hâlâ her ay bana onun fotoğraflarını gönderiyor.",
  },

  "normal-16-s1": {
    es: "Quería solo un pequeño retoque antes de la boda de mi hermana.",
    tr: "Kız kardeşimin düğününden önce sadece ufak bir düzeltme istiyordum.",
  },
  "normal-16-s2": {
    es: "La peluquera cortó mucho más de lo que pedí.",
    tr: "Kuaför istediğimden çok daha fazlasını kesti.",
  },
  "normal-16-s3": {
    es: "Me miré en el espejo y casi me pongo a llorar.",
    tr: "Aynaya baktım ve neredeyse ağlayacaktım.",
  },
  "normal-16-s4": {
    es: "Me probé tres sombreros distintos antes de salir de casa.",
    tr: "Evden çıkmadan önce üç farklı şapka denedim.",
  },
  "normal-16-s5": {
    es: "En la boda no dejaba de tocarme el pelo con nerviosismo.",
    tr: "Düğünde sürekli gergin bir şekilde saçıma dokunup duruyordum.",
  },
  "normal-16-s6": {
    es: "Mi prima dijo que el nuevo estilo en realidad me quedaba bien.",
    tr: "Kuzenim yeni stilin aslında bana yakıştığını söyledi.",
  },
  "normal-16-s7": {
    es: "Nadie en la fiesta se dio cuenta ni le importó.",
    tr: "Partide kimse fark etmedi bile, kimse umursamadı.",
  },
  "normal-16-s8": {
    es: "Finalmente dejé de preocuparme y bailé toda la noche.",
    tr: "Sonunda endişelenmeyi bıraktım ve tüm gece dans ettim.",
  },
  "normal-16-s9": {
    es: "Aprendí que la confianza importa más que un corte de pelo.",
    tr: "Özgüvenin bir saç kesiminden daha önemli olduğunu öğrendim.",
  },

  "normal-17-s1": {
    es: "Mi teléfono vibraba constantemente con mensajes del chat grupal de mi familia.",
    tr: "Telefonum aile grup sohbetimizden gelen mesajlarla sürekli titriyordu.",
  },
  "normal-17-s2": {
    es: "Sentía que tenía que responder a todo de inmediato.",
    tr: "Her şeye hemen cevap vermem gerektiğini hissediyordum.",
  },
  "normal-17-s3": {
    es: "Incluso durante las reuniones no dejaba de mirar mi pantalla a escondidas.",
    tr: "Toplantılar sırasında bile gizlice ekranıma bakıp duruyordum.",
  },
  "normal-17-s4": {
    es: "Una noche me di cuenta de que llevaba horas sin tener un pensamiento tranquilo.",
    tr: "Bir gece saatlerdir sakin bir düşünce bile kuramadığımı fark ettim.",
  },
  "normal-17-s5": {
    es: "Silencié el chat grupal y de inmediato sentí una ola de culpa.",
    tr: "Grup sohbetini sessize aldım ve hemen bir suçluluk dalgası hissettim.",
  },
  "normal-17-s6": {
    es: "En realidad nadie notó que había estado callada por unos días.",
    tr: "Aslında birkaç gündür sessiz kaldığımı kimse fark etmedi.",
  },
  "normal-17-s7": {
    es: "Empecé a revisar los mensajes solo una vez por la mañana y otra por la noche.",
    tr: "Mesajları sadece sabah bir kez ve gece bir kez kontrol etmeye başladım.",
  },
  "normal-17-s8": {
    es: "Mi concentración y mi estado de ánimo mejoraron casi de inmediato.",
    tr: "Odaklanmam ve ruh halim neredeyse hemen düzeldi.",
  },
  "normal-17-s9": {
    es: "Estar disponible todo el tiempo no es lo mismo que estar presente.",
    tr: "Her zaman ulaşılabilir olmak, gerçekten orada olmakla aynı şey değil.",
  },

  "normal-18-s1": {
    es: "Yo era, con diferencia, la persona más nueva del equipo.",
    tr: "Ekipteki açık ara en yeni kişi bendim.",
  },
  "normal-18-s2": {
    es: "En las reuniones casi siempre solo asentía y tomaba notas.",
    tr: "Toplantılarda çoğunlukla sadece başımı sallıyor ve notlar alıyordum.",
  },
  "normal-18-s3": {
    es: "Tenía terror de que mis ideas sonaran obvias o equivocadas.",
    tr: "Fikirlerimin bariz ya da yanlış görünmesinden çok korkuyordum.",
  },
  "normal-18-s4": {
    es: "Durante una reunión, el equipo se quedó atascado en un problema.",
    tr: "Bir toplantıda ekip bir sorunda takılıp kaldı.",
  },
  "normal-18-s5": {
    es: "Mencioné en voz baja una idea que tenía desde hacía semanas.",
    tr: "Haftalardır aklımda olan bir fikri sessizce dile getirdim.",
  },
  "normal-18-s6": {
    es: "La sala se quedó en silencio y me arrepentí de haber hablado al instante.",
    tr: "Oda sessizliğe büründü ve konuştuğuma anında pişman oldum.",
  },
  "normal-18-s7": {
    es: "Entonces mi jefa dijo eso en realidad es un buen punto.",
    tr: "Sonra yöneticim aslında bu çok iyi bir nokta dedi.",
  },
  "normal-18-s8": {
    es: "Al final construimos toda la solución alrededor de mi idea.",
    tr: "Sonunda çözümün tamamını benim fikrim üzerine kurduk.",
  },
  "normal-18-s9": {
    es: "Desde entonces no he vuelto a quedarme callada en una reunión.",
    tr: "O günden beri hiçbir toplantıda sessiz kalmadım.",
  },

  "normal-19-s1": {
    es: "Casi no voy a mi reencuentro de secundaria.",
    tr: "Lise buluşmama neredeyse gitmiyordum.",
  },
  "normal-19-s2": {
    es: "Imaginaba que todos los demás ya habían resuelto su vida.",
    tr: "Herkesin hayatını çoktan çözdüğünü hayal ediyordum.",
  },
  "normal-19-s3": {
    es: "Pasé una hora eligiendo un atuendo que pareciera exitoso.",
    tr: "Başarılı görünen bir kıyafet seçmek için bir saat harcadım.",
  },
  "normal-19-s4": {
    es: "El compañero que más admiraba confesó que él también se sentía perdido.",
    tr: "En çok hayran olduğum sınıf arkadaşım, kendisinin de kaybolmuş hissettiğini itiraf etti.",
  },
  "normal-19-s5": {
    es: "Casi todos admitieron en voz baja que su vida era más caótica que en internet.",
    tr: "Neredeyse herkes, hayatının internette göründüğünden daha dağınık olduğunu sessizce kabul etti.",
  },
  "normal-19-s6": {
    es: "Al final terminamos riéndonos de nuestras viejas fotos vergonzosas.",
    tr: "Sonunda eski utanç verici fotoğraflarımıza gülerek vakit geçirdik.",
  },
  "normal-19-s7": {
    es: "La comparación que tanto temía nunca llegó a suceder.",
    tr: "Korktuğum kıyaslama aslında hiç gerçekleşmedi.",
  },
  "normal-19-s8": {
    es: "Me fui sintiéndome más ligera de lo que me había sentido en meses.",
    tr: "Aylardır hissetmediğim kadar hafif hissederek ayrıldım.",
  },
  "normal-19-s9": {
    es: "Al parecer, todos simplemente están tratando de resolver las cosas en silencio.",
    tr: "Görünüşe göre herkes sessizce işleri çözmeye çalışıyor.",
  },

  "normal-20-s1": {
    es: "Habíamos planeado el pícnic de cumpleaños de mi hermana durante semanas.",
    tr: "Kız kardeşimin doğum günü pikniğini haftalardır planlıyorduk.",
  },
  "normal-20-s2": {
    es: "Unas nubes oscuras aparecieron justo cuando llegamos al parque.",
    tr: "Tam parka vardığımızda kara bulutlar toplanmaya başladı.",
  },
  "normal-20-s3": {
    es: "En cuestión de minutos la lluvia caía con fuerza.",
    tr: "Dakikalar içinde yağmur şiddetle boşalmaya başladı.",
  },
  "normal-20-s4": {
    es: "Todos se quedaron ahí, empapados, mirando el pastel arruinado.",
    tr: "Herkes sırılsıklam olmuş halde, mahvolmuş pastaya bakakalmıştı.",
  },
  "normal-20-s5": {
    es: "Mi hermana parecía a punto de llorar.",
    tr: "Kız kardeşim ağlamak üzereymiş gibi görünüyordu.",
  },
  "normal-20-s6": {
    es: "Alguien sugirió que trasladáramos toda la fiesta a mi apartamento.",
    tr: "Biri tüm partiyi benim daireme taşımamızı önerdi.",
  },
  "normal-20-s7": {
    es: "Subimos todo cargando y riéndonos de lo ridículos que nos veíamos.",
    tr: "Ne kadar komik göründüğümüze gülerek her şeyi yukarı taşıdık.",
  },
  "normal-20-s8": {
    es: "Terminamos bailando en la sala hasta la medianoche.",
    tr: "Sonunda gece yarısına kadar oturma odasında dans ettik.",
  },
  "normal-20-s9": {
    es: "Mi hermana dijo que, de alguna manera, había sido su mejor cumpleaños hasta ahora.",
    tr: "Kız kardeşim bunun bir şekilde şimdiye kadarki en iyi doğum günü olduğunu söyledi.",
  },

  "normal-21-s1": {
    es: "Compré una guitarra de segunda mano la semana que cumplí treinta y cuatro años.",
    tr: "Otuz dört yaşına girdiğim hafta ikinci el bir gitar aldım.",
  },
  "normal-21-s2": {
    es: "Mis dedos se negaban a cooperar incluso con los acordes más simples.",
    tr: "Parmaklarım en basit akorlarda bile bana itaat etmiyordu.",
  },
  "normal-21-s3": {
    es: "Cada video en internet parecía mostrar a un prodigio con la mitad de mi edad.",
    tr: "İnternetteki her video yaşımın yarısı kadar bir dâhiyi gösteriyor gibiydi.",
  },
  "normal-21-s4": {
    es: "Estuve a punto de rendirme más o menos en la segunda semana frustrante.",
    tr: "İkinci sinir bozucu haftada neredeyse pes ediyordum.",
  },
  "normal-21-s5": {
    es: "Una amiga me recordó que se supone que los principiantes suenan fatal.",
    tr: "Bir arkadaşım bana acemilerin kötü çalması gerektiğini hatırlattı.",
  },
  "normal-21-s6": {
    es: "Algo cambió cuando dejé de compararme con desconocidos en internet.",
    tr: "İnternetteki yabancılarla kendimi kıyaslamayı bıraktığımda bir şeyler değişti.",
  },
  "normal-21-s7": {
    es: "Empecé a practicar mal y con sinceridad, solo por el puro placer de hacerlo.",
    tr: "Sadece saf keyif için kötü ve içtenlikle pratik yapmaya başladım.",
  },
  "normal-21-s8": {
    es: "Seis meses después, por fin puedo tocar una canción sin detenerme.",
    tr: "Altı ay sonra sonunda bir şarkıyı durmadan çalabiliyorum.",
  },
  "normal-21-s9": {
    es: "Ser principiante de nuevo resultó ser, extrañamente, liberador.",
    tr: "Yeniden acemi olmak, tuhaf bir şekilde özgürleştirici çıktı.",
  },

  "normal-22-s1": {
    es: "Mi padre y yo no habíamos hablado en ocho años.",
    tr: "Babamla sekiz yıldır konuşmuyorduk.",
  },
  "normal-22-s2": {
    es: "Su número apareció en mi pantalla un martes cualquiera.",
    tr: "Sıradan bir salı günü numarası ekranımda belirdi.",
  },
  "normal-22-s3": {
    es: "Me quedé mirándolo y dejé que sonara hasta el final.",
    tr: "Ona bakakaldım ve tamamen susana kadar çalmasına izin verdim.",
  },
  "normal-22-s4": {
    es: "Dejó un mensaje de voz disculpándose, con una voz que apenas reconocí.",
    tr: "Zar zor tanıdığım bir sesle özür dileyerek sesli mesaj bıraktı.",
  },
  "normal-22-s5": {
    es: "Una parte de mí quería borrarlo sin escucharlo dos veces.",
    tr: "Bir yanım onu iki kez dinlemeden silmek istedi.",
  },
  "normal-22-s6": {
    es: "Otra parte, en cambio, seguía reproduciéndolo tarde por la noche.",
    tr: "Diğer yanım ise onu gece geç saatlerde tekrar tekrar dinledi.",
  },
  "normal-22-s7": {
    es: "No estaba lista para perdonarlo, pero tampoco estaba lista para perderlo.",
    tr: "Onu affetmeye hazır değildim ama onu kaybetmeye de hazır değildim.",
  },
  "normal-22-s8": {
    es: "Finalmente le respondí con tres palabras solo un café.",
    tr: "Sonunda ona sadece üç kelimeyle cevap yazdım: sadece bir kahve.",
  },
  "normal-22-s9": {
    es: "Pase lo que pase después, al menos la silla no quedará vacía para siempre.",
    tr: "Bundan sonra ne olursa olsun, en azından sandalye sonsuza dek boş kalmayacak.",
  },

  "normal-23-s1": {
    es: "Llevaba casi tres años enamorado de mi mejor amiga.",
    tr: "En yakın arkadaşıma neredeyse üç yıldır âşıktım.",
  },
  "normal-23-s2": {
    es: "Me decía a mí mismo que la amistad importaba más que el riesgo.",
    tr: "Kendime arkadaşlığın riskten daha önemli olduğunu söylüyordum.",
  },
  "normal-23-s3": {
    es: "Verla salir con otras personas me iba desgastando en silencio.",
    tr: "Onun başkalarıyla çıktığını görmek beni sessizce yıpratıyordu.",
  },
  "normal-23-s4": {
    es: "Una noche, después de su última ruptura, me preguntó por qué estaba tan callado.",
    tr: "Son ayrılığından sonra bir gece neden bu kadar sessiz olduğumu sordu.",
  },
  "normal-23-s5": {
    es: "Las palabras salieron antes de que pudiera convencerme de no decirlas.",
    tr: "Kendimi vazgeçirmeye fırsat bulamadan sözler ağzımdan çıktı.",
  },
  "normal-23-s6": {
    es: "Ella se quedó completamente inmóvil y no dijo nada por un momento.",
    tr: "Bir anlığına tamamen donakaldı ve hiçbir şey söylemedi.",
  },
  "normal-23-s7": {
    es: "De inmediato me arrepentí de haber arruinado algo que se sentía seguro.",
    tr: "Güvenli hissettiren bir şeyi mahvettiğim için hemen pişman oldum.",
  },
  "normal-23-s8": {
    es: "Entonces ella admitió en voz baja que se había preguntado lo mismo durante años.",
    tr: "Sonra o da yıllardır aynı şeyi merak ettiğini sessizce itiraf etti.",
  },
  "normal-23-s9": {
    es: "Todavía estamos descubriendo qué somos, pero al menos ahora es sincero.",
    tr: "Ne olduğumuzu hâlâ çözmeye çalışıyoruz ama en azından artık dürüst.",
  },

  "normal-24-s1": {
    es: "Mi hermano menor me pidió que fuera su padrino de boda.",
    tr: "Küçük kardeşim benden sağdıcı olmamı istedi.",
  },
  "normal-24-s2": {
    es: "Había construido una empresa exitosa antes de cumplir treinta años.",
    tr: "Otuz yaşına gelene kadar başarılı bir şirket kurmuştu.",
  },
  "normal-24-s3": {
    es: "Había pasado años comparando en silencio mi propio progreso con el suyo.",
    tr: "Yıllarca sessizce kendi ilerlememi onunkiyle kıyaslamıştım.",
  },
  "normal-24-s4": {
    es: "Escribir su discurso de boda me obligó a enfrentar esos celos directamente.",
    tr: "Düğün konuşmasını yazmak beni o kıskançlıkla doğrudan yüzleşmeye zorladı.",
  },
  "normal-24-s5": {
    es: "Casi escribí algo genérico solo para evitar la incomodidad.",
    tr: "Sadece rahatsızlıktan kaçınmak için neredeyse sıradan bir şey yazacaktım.",
  },
  "normal-24-s6": {
    es: "En cambio, escribí con sinceridad sobre lo orgulloso que realmente estaba.",
    tr: "Bunun yerine aslında ne kadar gurur duyduğumu içtenlikle yazdım.",
  },
  "normal-24-s7": {
    es: "Mi voz tembló a la mitad de leerlo en voz alta.",
    tr: "Yüksek sesle okurken yarısında sesim titredi.",
  },
  "normal-24-s8": {
    es: "Después me abrazó y susurró gracias por ser sincero.",
    tr: "Sonra bana sarıldı ve dürüst olduğun için teşekkürler diye fısıldadı.",
  },
  "normal-24-s9": {
    es: "Resulta que los celos y el amor pueden convivir en la misma frase.",
    tr: "Görünüşe göre kıskançlık ve sevgi aynı cümlede yaşayabiliyor.",
  },
};

const NEW_LESSON_IDS = new Set(Array.from({ length: 12 }, (_, i) => `normal-${13 + i}`));

function nowIso(): string {
  return new Date().toISOString();
}

async function upsertTranslation(
  locale: "es" | "ar" | "tr",
  contentType: "lesson" | "sentence",
  contentId: string,
  field: string,
  value: string,
  sourceText: string,
): Promise<void> {
  const { error } = await supabase.from("content_translations").upsert(
    {
      content_type: contentType,
      content_id: contentId,
      field,
      locale,
      value: value.trim(),
      status: "approved",
      is_stale: false,
      source_snapshot: sourceText.trim(),
      previous_value: null,
      updated_at: nowIso(),
    },
    { onConflict: "content_type,content_id,field,locale" },
  );
  if (error)
    throw new Error(
      `content_translations upsert failed (${contentType}/${contentId}/${field}/${locale}): ${error.message}`,
    );
}

async function main() {
  const lessons = normalLessons.filter((lesson) => NEW_LESSON_IDS.has(lesson.id));
  if (lessons.length !== 12) {
    throw new Error(`Expected exactly 12 new lessons in the local seed, found ${lessons.length}.`);
  }

  for (const lesson of lessons) {
    if (lesson.sentences.length !== REQUIRED_SENTENCE_COUNT.normal) {
      throw new Error(
        `${lesson.id} has ${lesson.sentences.length} sentences, expected ${REQUIRED_SENTENCE_COUNT.normal}.`,
      );
    }
    const level = lesson.level as 1 | 2 | 3;
    if (!LEVEL_ID[level]) throw new Error(`${lesson.id} has unknown level ${lesson.level}.`);

    const titleTr = TITLE_TRANSLATIONS[lesson.id];
    const descTr = DESCRIPTION_TRANSLATIONS[lesson.id];
    if (!titleTr || !descTr)
      throw new Error(`${lesson.id} is missing title/description translations.`);

    console.log(
      `Inserting ${lesson.id} — "${lesson.title}" (level ${level}, order ${lesson.order})...`,
    );

    const { error: lessonError } = await supabase.from("lessons").insert({
      id: lesson.id,
      mode: "normal",
      level_id: LEVEL_ID[level],
      order_index: lesson.order,
      title: lesson.title,
      title_ar: lesson.titleAr,
      description: lesson.description ?? null,
      description_ar: lesson.descriptionAr ?? null,
      is_free: lesson.isFree,
      status: "published",
      voice_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    if (lessonError)
      throw new Error(`lessons insert failed for ${lesson.id}: ${lessonError.message}`);

    const sentenceRows = lesson.sentences.map((sentence, index) => ({
      id: `${lesson.id}-s${index + 1}`,
      lesson_id: lesson.id,
      order_index: index,
      en: sentence.en,
      ar: sentence.ar,
      speaker: null,
      audio_url: null,
      word_translations: sentence.wordTranslations ?? null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }));

    const { error: sentencesError } = await supabase.from("sentences").insert(sentenceRows);
    if (sentencesError)
      throw new Error(`sentences insert failed for ${lesson.id}: ${sentencesError.message}`);

    await upsertTranslation("es", "lesson", lesson.id, "title", titleTr.es, lesson.title);
    await upsertTranslation("ar", "lesson", lesson.id, "title", lesson.titleAr, lesson.title);
    await upsertTranslation("tr", "lesson", lesson.id, "title", titleTr.tr, lesson.title);

    if (lesson.description) {
      await upsertTranslation(
        "es",
        "lesson",
        lesson.id,
        "description",
        descTr.es,
        lesson.description,
      );
      await upsertTranslation(
        "ar",
        "lesson",
        lesson.id,
        "description",
        lesson.descriptionAr ?? "",
        lesson.description,
      );
      await upsertTranslation(
        "tr",
        "lesson",
        lesson.id,
        "description",
        descTr.tr,
        lesson.description,
      );
    }

    for (const row of sentenceRows) {
      const translation = SENTENCE_TRANSLATIONS[row.id];
      if (!translation) throw new Error(`${row.id} is missing Spanish/Turkish translations.`);
      await upsertTranslation("es", "sentence", row.id, "text", translation.es, row.en);
      await upsertTranslation("ar", "sentence", row.id, "text", row.ar, row.en);
      await upsertTranslation("tr", "sentence", row.id, "text", translation.tr, row.en);
    }

    console.log(`  done: ${sentenceRows.length} sentences, 3 locales each field.`);
  }

  console.log(`\nAll ${lessons.length} lessons inserted successfully.`);
}

main().catch((error) => {
  console.error("FAILED:", error);
  process.exit(1);
});
