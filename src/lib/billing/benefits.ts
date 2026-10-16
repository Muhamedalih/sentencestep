/** The two dictionary lines the benefit list is made of — kept structural so a client component can import this without pulling the dictionary in. */
interface PremiumBenefitCopy {
  benefits: readonly string[];
  benefitPassages: string;
}

/**
 * What Premium buys, as the list a buyer reads on /upgrade. While the Passages section is open to
 * everyone it gets a line of its own, so a new subscriber knows the whole section is included; before
 * that nobody is told about a section only the admin can open. The line goes just before the last
 * one, which is the open-ended "new features as they launch".
 */
export function premiumBenefits(copy: PremiumBenefitCopy, passagesOpen: boolean): string[] {
  const list = [...copy.benefits];
  if (!passagesOpen) return list;
  list.splice(Math.max(0, list.length - 1), 0, copy.benefitPassages);
  return list;
}
