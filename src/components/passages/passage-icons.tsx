import {
  BookOpen,
  Briefcase,
  Camera,
  Cat,
  Coffee,
  Dumbbell,
  Heart,
  House,
  Mail,
  Map,
  Music,
  Pizza,
  Plane,
  Smartphone,
  Sun,
  Waves,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { PassageIconKey } from "@/lib/passages/icons";

/** The card icon for each key a passage may use (see PASSAGE_ICON_KEYS). Unknown keys fall back to a book, never a crash. */
const ICONS: Record<PassageIconKey, LucideIcon> = {
  cat: Cat,
  camera: Camera,
  pizza: Pizza,
  smartphone: Smartphone,
  wallet: Wallet,
  mail: Mail,
  map: Map,
  music: Music,
  waves: Waves,
  dumbbell: Dumbbell,
  coffee: Coffee,
  plane: Plane,
  heart: Heart,
  sun: Sun,
  briefcase: Briefcase,
  house: House,
  book: BookOpen,
};

export function PassageIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (ICONS as Record<string, LucideIcon>)[name] ?? BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}
