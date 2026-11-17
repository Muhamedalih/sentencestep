/** Spanish + Turkish for the three emotional stories (story-211..213): lesson title/description, each sentence's text, and one gloss per English token ("|"-joined). */
export interface Tr {
  title: string;
  desc: string;
  /** Per sentence: [text, glosses joined by "|" — one per English token]. */
  s: [string, string][];
}

export const ES: Record<string, Tr> = {
  "story-211": {
    title: "Las manos cansadas de mamá",
    desc: "Después de un día largo, un niño encuentra su forma de dar las gracias",
    s: [
      ["Mamá llegó a casa del trabajo muy tarde", "Mamá|llegó|a casa|del|trabajo|muy|tarde"],
      ["Sus manos estaban rojas y cansadas", "Sus|manos|estaban|rojas|y|cansadas"],
      ["Empezó a lavar los platos despacio", "Ella|empezó|a|lavar|los|platos|despacio"],
      ['"Mamá, siéntate", dijo el pequeño Tom', "Mamá|siéntate|abajo|dijo|pequeño|Tom"],
      ["Lavó cada taza y cada plato él solo", "Él|lavó|cada|taza|y|cada|plato|por|sí mismo"],
      ["Luego besó sus manos cansadas", "Luego|él|besó|sus|cansadas|manos"],
      [
        '"Estas manos trabajan todo el día por mí", susurró',
        "Estas|manos|trabajan|todo|día|por|mí|él|susurró",
      ],
      [
        'Mamá lloró y dijo: "Ahora son las manos más felices del mundo."',
        "Mamá|lloró|y|dijo|Ahora|ellas|son|las|más felices|manos|en|el|mundo",
      ],
    ],
  },
  "story-212": {
    title: "El perro se comió el anillo",
    desc: "Planeó la propuesta perfecta, pero su perro tenía otros planes",
    s: [
      [
        "Practiqué mi propuesta durante un mes frente a mi perro, Max",
        "Yo|practiqué|mi|propuesta|durante|un|mes|en|frente|de|mi|perro|Max",
      ],
      [
        "El viernes dejé la caja del anillo sobre la mesa por un minuto",
        "El|viernes|yo|dejé|la|anillo|caja|sobre|la|mesa|por|un|minuto",
      ],
      [
        "Cuando volví, la caja estaba vacía y Max parecía culpable",
        "Cuando|yo|volví|atrás|la|caja|estaba|vacía|y|Max|parecía|culpable",
      ],
      [
        "Corrí al veterinario, y Lina vino conmigo, muy preocupada",
        "Yo|corrí|a|el|veterinario|y|Lina|vino|con|mí|muy|preocupada",
      ],
      [
        "El doctor nos mostró una radiografía con un anillo diminuto dentro de Max",
        "El|doctor|mostró|nos|una|radiografía|con|un|diminuto|anillo|dentro|Max",
      ],
      [
        "Lina se rió tan fuerte que tuvo que sentarse",
        "Lina|rió|tan|fuerte|que|ella|tuvo|que|sentarse|abajo",
      ],
      [
        '"Quería un momento perfecto", dije, "pero el anillo está dentro del perro."',
        "Yo|quería|un|perfecto|momento|yo|dije|pero|el|anillo|está|dentro|del|perro",
      ],
      [
        'Se secó las lágrimas y dijo: "Pregúntame de todos modos."',
        "Ella|secó|sus|lágrimas|y|dijo|Pregunta|me|de todos modos",
      ],
      [
        "En una sala de espera llena de gatos, me arrodillé y se lo pedí, y ella dijo que sí",
        "En|una|espera|sala|llena|de|gatos|yo|me arrodillé|abajo|y|pregunté|y|ella|dijo|sí",
      ],
    ],
  },
  "story-213": {
    title: "Las cuatro palabras de mi madre",
    desc: "Nunca aprendió inglés, hasta el día en que su hija se graduó",
    s: [
      [
        "Mi madre nunca aprendió inglés porque trabajaba en dos empleos para criarme",
        "Mi|madre|nunca|aprendió|inglés|porque|ella|trabajó|dos|empleos|para|criar|me",
      ],
      [
        "Limpiaba oficinas por la noche y nunca se quejó ni una vez",
        "Ella|limpiaba|oficinas|por|la noche|y|nunca|vez|se quejó",
      ],
      [
        "El día de mi graduación, se sentó en la última fila con su mejor vestido",
        "En|mi|graduación|día|ella|se sentó|en|la|última|fila|con|su|mejor|vestido",
      ],
      [
        "Cuando dijeron mi nombre, se puso de pie antes que nadie",
        "Cuando|ellos|llamaron|mi|nombre|ella|se levantó|arriba|antes de|todos|demás",
      ],
      [
        "Después, tomó mi cara entre sus manos y habló despacio",
        "Después|ella|tomó|mi|cara|entre|sus|manos|y|habló|despacio",
      ],
      [
        '"Estoy orgullosa de ti", dijo en un inglés cuidadoso y ensayado',
        "Yo soy|orgullosa|de|ti|ella|dijo|en|cuidadoso|ensayado|inglés",
      ],
      [
        "Había ensayado esas cuatro palabras durante meses, sola, en el autobús",
        "Ella|había|ensayado|esas|cuatro|palabras|durante|meses|sola|en|el|autobús",
      ],
      [
        "Había esperado toda mi vida para oírlas, en cualquier idioma",
        "Yo|había|esperado|mi|toda|vida|para|oír|las|en|cualquier|idioma",
      ],
      [
        "Lloré porque ella trabajó más duro por esas cuatro palabras que yo por mi título",
        "Yo|lloré|porque|ella|trabajó|más duro|por|esas|cuatro|palabras|que|yo|hice|por|mi|título",
      ],
    ],
  },
};

export const TR: Record<string, Tr> = {
  "story-211": {
    title: "Annemin Yorgun Elleri",
    desc: "Uzun bir günün ardından küçük bir çocuk teşekkür etmenin yolunu bulur",
    s: [
      ["Annem işten eve çok geç geldi", "Annem|geldi|eve|-den|iş|çok|geç"],
      ["Elleri kırmızı ve yorgundu", "Onun|elleri|idi|kırmızı|ve|yorgun"],
      ["Bulaşıkları yavaşça yıkamaya başladı", "O|başladı|-meye|yıkamak|-|bulaşıklar|yavaşça"],
      ['"Anne, otur," dedi küçük Tom', "Anne|otur|aşağı|dedi|küçük|Tom"],
      [
        "Her fincanı ve her tabağı kendi başına yıkadı",
        "O|yıkadı|her|fincan|ve|her|tabak|-yle|kendi",
      ],
      ["Sonra onun yorgun ellerini öptü", "Sonra|o|öptü|onun|yorgun|elleri"],
      [
        '"Bu eller bütün gün benim için çalışıyor," diye fısıldadı',
        "Bu|eller|çalışır|bütün|gün|için|ben|o|fısıldadı",
      ],
      [
        'Annem ağladı ve dedi ki: "Artık dünyanın en mutlu elleri onlar."',
        "Annem|ağladı|ve|dedi|Artık|onlar|-dir|-|en mutlu|eller|-de|-|dünya",
      ],
    ],
  },
  "story-212": {
    title: "Köpek Yüzüğü Yedi",
    desc: "Mükemmel evlenme teklifini planladı ama köpeğinin başka planları vardı",
    s: [
      [
        "Evlenme teklifimi bir ay boyunca köpeğim Max'in önünde prova ettim",
        "Ben|prova ettim|benim|teklif|boyunca|bir|ay|-de|önünde|-|benim|köpek|Max",
      ],
      [
        "Cuma günü yüzük kutusunu bir dakikalığına masanın üstünde bıraktım",
        "-de|Cuma|ben|bıraktım|-|yüzük|kutu|üstünde|-|masa|için|bir|dakika",
      ],
      [
        "Geri döndüğümde kutu boştu ve Max suçlu görünüyordu",
        "Ne zaman|ben|döndüm|geri|-|kutu|idi|boş|ve|Max|görünüyordu|suçlu",
      ],
      [
        "Veterinere koştum, Lina da çok endişeli bir şekilde benimle geldi",
        "Ben|koştum|-e|-|veteriner|ve|Lina|geldi|ile|ben|çok|endişeli",
      ],
      [
        "Doktor bize Max'in içinde minik bir yüzük olan bir röntgen gösterdi",
        "-|doktor|gösterdi|bize|bir|röntgen|ile|bir|minik|yüzük|içinde|Max",
      ],
      [
        "Lina o kadar güldü ki oturmak zorunda kaldı",
        "Lina|güldü|o kadar|sert|-ki|o|zorunda kaldı|-mek|oturmak|aşağı",
      ],
      [
        '"Mükemmel bir an istemiştim," dedim, "ama yüzük köpeğin içinde."',
        "Ben|istedim|bir|mükemmel|an|ben|dedim|ama|-|yüzük|-dir|içinde|-|köpek",
      ],
      [
        'Gözyaşlarını sildi ve dedi ki: "Yine de sor."',
        "O|sildi|onun|gözyaşları|ve|dedi|Sor|bana|yine de",
      ],
      [
        "Kedilerle dolu bir bekleme odasında diz çöktüm ve sordum, o da evet dedi",
        "-de|bir|bekleme|oda|dolu|-|kediler|ben|diz çöktüm|aşağı|ve|sordum|ve|o|dedi|evet",
      ],
    ],
  },
  "story-213": {
    title: "Annemin Dört Kelimesi",
    desc: "Kızının mezuniyet gününe kadar hiç İngilizce öğrenmedi",
    s: [
      [
        "Annem hiç İngilizce öğrenmedi, çünkü beni büyütmek için iki işte çalıştı",
        "Benim|annem|hiç|öğrendi|İngilizce|çünkü|o|çalıştı|iki|iş|için|büyütmek|beni",
      ],
      [
        "Geceleri ofis temizledi ve bir kez bile şikayet etmedi",
        "O|temizledi|ofisleri|-de|gece|ve|asla|bir kez|şikayet etti",
      ],
      [
        "Mezuniyet günümde en arka sırada en güzel elbisesiyle oturdu",
        "-de|benim|mezuniyet|gün|o|oturdu|-de|-|arka|sıra|-le|onun|en güzel|elbise",
      ],
      [
        "Adımı okuduklarında herkesten önce ayağa kalktı",
        "Ne zaman|onlar|çağırdı|benim|ad|o|kalktı|ayağa|önce|herkes|başka",
      ],
      [
        "Sonra yüzümü ellerinin arasına aldı ve yavaşça konuştu",
        "Sonra|o|aldı|benim|yüz|-de|onun|eller|ve|konuştu|yavaşça",
      ],
      [
        '"Seninle gurur duyuyorum," dedi, dikkatli ve çalışılmış bir İngilizceyle',
        "Ben|gururlu|-den|sen|o|dedi|-de|dikkatli|çalışılmış|İngilizce",
      ],
      [
        "O dört kelimeyi aylarca, tek başına, otobüste çalışmıştı",
        "O|-miş|çalışmıştı|o|dört|kelime|boyunca|aylar|yalnız|-de|-|otobüs",
      ],
      [
        "Bütün hayatım boyunca onları duymayı, hangi dilde olursa olsun, bekledim",
        "Ben|-miştim|bekledim|benim|bütün|hayat|-mek için|duymak|onları|-de|herhangi|dil",
      ],
      [
        "Ağladım, çünkü o, diploma için çalıştığımdan daha çok bu dört kelime için çalışmıştı",
        "Ben|ağladım|çünkü|o|çalıştı|daha çok|için|o|dört|kelime|-den|ben|yaptım|için|benim|diploma",
      ],
    ],
  },
};
