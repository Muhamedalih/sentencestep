"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The Dictation switch of the phone lesson screen (permission mobilePhoneUx), handed down to the
 * row of lesson tools (sound, speed, settings) so it sits in that one row on a phone instead of
 * on a row of its own. null everywhere else, which leaves every other layout as it was.
 */
const PhoneToolsLeadContext = createContext<ReactNode>(null);

export const PhoneToolsLeadProvider = PhoneToolsLeadContext.Provider;

export function usePhoneToolsLead(): ReactNode {
  return useContext(PhoneToolsLeadContext);
}
