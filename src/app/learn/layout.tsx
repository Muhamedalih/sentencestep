import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";

export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
