"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";

interface NavLink {
  href: string;
  label: string;
}

/**
 * The hamburger + slide-down panel for the marketing header. Kept separate
 * from SiteHeader so the header itself can stay a Server Component (it
 * fetches the signed-in user) — authArea is that server-rendered auth CTA
 * block, passed straight through as a slot rather than re-fetched here.
 */
export function MobileNav({ links, authArea }: { links: NavLink[]; authArea: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label={open ? t.marketing.closeMenu : t.marketing.openMenu}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </Button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="border-border/60 bg-background absolute inset-x-0 top-16 flex flex-col gap-1 border-b px-6 py-4 shadow-sm"
        >
          <nav className="flex flex-col gap-1" aria-label={t.marketing.primaryNav}>
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-foreground hover:text-primary rounded-md px-2 py-2.5 text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-2 flex flex-col gap-2 border-t pt-3">{authArea}</div>
        </div>
      )}
    </div>
  );
}
