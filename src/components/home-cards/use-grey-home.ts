"use client";

import { usePathname } from "next/navigation";

import { useFeatures } from "@/components/providers/feature-provider";

/**
 * Whether the grey look of Home (permission "greyCalm") applies to this screen: the permission is open
 * for the visitor AND the page is Home itself (/learn). The Word Lists page shows the words card too,
 * and the other pages keep their black page, so they are left as they are.
 */
export function useGreyHome(): boolean {
  const pathname = usePathname();
  const open = useFeatures().rollouts.greyCalm;
  return open && pathname === "/learn";
}
