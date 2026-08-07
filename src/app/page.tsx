import { FreeCta } from "@/components/marketing/free-cta";
import { Hero } from "@/components/marketing/hero";
import { ModeSection } from "@/components/marketing/mode-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ModeSection />
        <FreeCta />
      </main>
      <SiteFooter />
    </div>
  );
}
