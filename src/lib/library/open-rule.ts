/**
 * Who may open the Library (Books and Novels): an admin always; a subscriber once the "libraryGift"
 * permission is open for them. Pure, so the pages, the menu and the tests share one rule.
 */
export function libraryOpenFor(input: {
  isAdmin: boolean;
  giftOpen: boolean;
  isPremium: boolean;
}): boolean {
  return input.isAdmin || (input.giftOpen && input.isPremium);
}
