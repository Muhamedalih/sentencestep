import type { Metadata, Viewport } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://looma.app"),
  title: {
    default: "Looma — Learn English, letter by letter",
    template: "%s · Looma",
  },
  description:
    "Looma is a modern English-learning app for Arabic speakers. Hear a sentence, type it letter by letter, and build fluency through Normal, Stories, and Conversation lessons.",
  keywords: [
    "learn English",
    "English for Arabic speakers",
    "typing practice",
    "English lessons",
    "language learning app",
  ],
  openGraph: {
    title: "Looma — Learn English, letter by letter",
    description:
      "Hear a sentence, type it letter by letter, and build fluency through Normal, Stories, and Conversation lessons.",
    siteName: "Looma",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f4f8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
