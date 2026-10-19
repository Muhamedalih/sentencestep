import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { applyUnsubscribe, unsubscribeLanguage } from "@/lib/email/unsubscribe";
import { unsubscribeQuery, verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

type Language = "ar" | "es" | "tr" | "en";

const TEXT: Record<
  Language,
  {
    title: string;
    body: string;
    button: string;
    doneTitle: string;
    doneBody: string;
    bad: string;
    home: string;
  }
> = {
  ar: {
    title: "إيقاف رسائل التذكير والعروض",
    body: "اضغط الزر وسنتوقف عن إرسال التذكيرات والعروض إلى بريدك. تبقى رسائل الدفع والحساب المهمة تصلك، ويمكنك تغيير ذلك لاحقاً من الإعدادات.",
    button: "إلغاء الاشتراك",
    doneTitle: "تم إيقاف الرسائل",
    doneBody: "لن نرسل لك تذكيرات أو عروضاً بعد الآن. يمكنك إعادة تفعيلها من الإعدادات متى شئت.",
    bad: "هذا الرابط غير صالح. افتح الإعدادات داخل التطبيق لإدارة رسائل البريد.",
    home: "العودة إلى SentenceStep",
  },
  es: {
    title: "Dejar de recibir recordatorios y ofertas",
    body: "Pulsa el botón y dejaremos de enviarte recordatorios y ofertas. Seguirás recibiendo los mensajes importantes de pagos y de tu cuenta, y puedes cambiarlo después en Ajustes.",
    button: "Darme de baja",
    doneTitle: "Listo, no te escribiremos más",
    doneBody:
      "Ya no recibirás recordatorios ni ofertas. Puedes volver a activarlos en Ajustes cuando quieras.",
    bad: "Este enlace no es válido. Abre Ajustes en la aplicación para gestionar tus correos.",
    home: "Volver a SentenceStep",
  },
  tr: {
    title: "Hatırlatma ve teklif e-postalarını durdur",
    body: "Düğmeye bastığınızda hatırlatma ve teklif e-postaları göndermeyi bırakırız. Ödeme ve hesapla ilgili önemli iletiler gelmeye devam eder; bunu daha sonra Ayarlar'dan değiştirebilirsiniz.",
    button: "Abonelikten çık",
    doneTitle: "Tamam, artık yazmayacağız",
    doneBody:
      "Artık hatırlatma veya teklif almayacaksınız. İstediğiniz zaman Ayarlar'dan yeniden açabilirsiniz.",
    bad: "Bu bağlantı geçerli değil. E-postalarınızı yönetmek için uygulamadaki Ayarlar'ı açın.",
    home: "SentenceStep'e dön",
  },
  en: {
    title: "Stop reminder and offer emails",
    body: "Press the button and we'll stop sending you reminders and offers. You'll still get important payment and account messages, and you can change this later in Settings.",
    button: "Unsubscribe",
    doneTitle: "Done, we won't write again",
    doneBody:
      "You won't get reminders or offers any more. You can turn them back on in Settings whenever you like.",
    bad: "This link isn't valid. Open Settings in the app to manage your emails.",
    home: "Back to SentenceStep",
  },
};

async function confirmUnsubscribe(formData: FormData): Promise<void> {
  "use server";
  const userId = String(formData.get("u") ?? "");
  const token = String(formData.get("t") ?? "");
  if (!verifyUnsubscribeToken(userId, token, process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    redirect("/unsubscribe");
  }
  await applyUnsubscribe(userId);
  redirect(
    `/unsubscribe?${unsubscribeQuery(userId, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")}&done=1`,
  );
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string; done?: string }>;
}) {
  const { u, t, done } = await searchParams;
  const valid = verifyUnsubscribeToken(u, t, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const language: Language = valid && u ? await unsubscribeLanguage(u) : "en";
  const text = TEXT[language];

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16"
    >
      <Link
        href="/"
        className="mb-8 inline-flex min-h-11 items-center self-start"
        aria-label={text.home}
      >
        <Logo />
      </Link>
      {!valid ? (
        <p className="text-muted-foreground text-sm">{text.bad}</p>
      ) : done === "1" ? (
        <>
          <h1 className="text-xl font-semibold">{text.doneTitle}</h1>
          <p className="text-muted-foreground mt-3 text-sm">{text.doneBody}</p>
          <Link href="/" className="text-primary mt-6 text-sm underline">
            {text.home}
          </Link>
        </>
      ) : (
        <form action={confirmUnsubscribe}>
          <input type="hidden" name="u" value={u} />
          <input type="hidden" name="t" value={t} />
          <h1 className="text-xl font-semibold">{text.title}</h1>
          <p className="text-muted-foreground mt-3 text-sm">{text.body}</p>
          <Button type="submit" className="mt-6">
            {text.button}
          </Button>
        </form>
      )}
    </div>
  );
}
