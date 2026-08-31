"use client";

import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { useLocale } from "@/components/providers/locale-provider";

export function SiteFooter() {
  const { t } = useLocale();

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: t.footer.productColumn,
      links: [
        // "/#..." not "#..." — SiteFooter also renders on /privacy and
        // /terms, where a bare hash link has no matching id to scroll to.
        { href: "/#how-it-works", label: t.nav.howItWorks },
        { href: "/#modes", label: t.nav.learningModes },
        { href: "/upgrade", label: t.nav.pricing },
      ],
    },
    {
      title: t.footer.learningColumn,
      links: [
        { href: "/learn/normal", label: t.nav.normalLessons },
        { href: "/learn/stories", label: t.nav.stories },
        { href: "/learn/conversation", label: t.nav.conversation },
      ],
    },
    {
      title: t.footer.accountColumn,
      links: [
        { href: "/login", label: t.common.signIn },
        { href: "/register", label: t.nav.createAccount },
        { href: "/learn", label: t.common.dashboard },
      ],
    },
    {
      title: t.footer.legalColumn,
      links: [
        { href: "/privacy", label: t.footer.privacy },
        { href: "/terms", label: t.footer.terms },
      ],
    },
  ];

  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="text-muted-foreground max-w-xs text-sm">{t.footer.tagline}</p>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold tracking-tight">{column.title}</h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border/60 mt-10 border-t pt-6 text-center sm:text-left">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
