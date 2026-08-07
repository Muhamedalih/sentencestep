import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <Logo />
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Looma. Learn English, one letter at a time.
        </p>
      </div>
    </footer>
  );
}
