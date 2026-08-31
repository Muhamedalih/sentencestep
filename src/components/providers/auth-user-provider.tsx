"use client";

import { createContext, useContext, type ReactNode } from "react";

const AuthUserContext = createContext<string | null>(null);

/** Makes the signed-in user's id (resolved server-side) available to client components — see useProgress, which branches on it. */
export function AuthUserProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  return <AuthUserContext.Provider value={userId}>{children}</AuthUserContext.Provider>;
}

export function useAuthUserId(): string | null {
  return useContext(AuthUserContext);
}
