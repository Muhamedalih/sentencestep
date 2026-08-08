import { MessagesSquare, NotebookText, Type } from "lucide-react";

import type { LearningMode } from "@/types/content";

export const LEARNING_MODES: LearningMode[] = ["normal", "stories", "conversation"];

export function isLearningMode(value: string): value is LearningMode {
  return (LEARNING_MODES as string[]).includes(value);
}

interface ModeMeta {
  title: string;
  description: string;
  icon: typeof Type;
}

export const modeMeta: Record<LearningMode, ModeMeta> = {
  normal: {
    title: "Ordinary Lessons",
    description: "Short, practical sentences organized from easy to difficult.",
    icon: Type,
  },
  stories: {
    title: "Stories",
    description: "Longer narratives you type sentence by sentence as they unfold.",
    icon: NotebookText,
  },
  conversation: {
    title: "Conversation",
    description: "Real-life dialogue for situations you'll actually use English in.",
    icon: MessagesSquare,
  },
};
