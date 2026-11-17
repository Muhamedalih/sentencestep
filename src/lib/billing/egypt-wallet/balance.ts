/**
 * The wallet's balance check. Every text from Vodafone that carries an operation number says what the
 * wallet's balance was AFTER that operation (money received, money sent out with its fee, anything else).
 * Put in the order of the operation numbers (they only ever rise), each text must follow from the one
 * before it: the previous balance, plus what came in or minus what went out and the fee, is the next
 * balance. When it does not, some money moved that no text we have explains: a text that was never
 * forwarded, or an operation of a kind we do not read. The admin page shows it and the admins are told
 * once. It never touches an order: it only watches the wallet.
 */

export interface BalanceObservation {
  /** Vodafone's operation number. */
  transactionId: string;
  /** "in": money received. "out": money sent out. "other": a text we only know the balance of. */
  kind: "in" | "out" | "other";
  amountPiasters: number | null;
  feePiasters: number | null;
  /** The balance after the operation, or null when the text does not say it. */
  balancePiasters: number | null;
  /** The time written in the text. */
  at: string;
  /** When the site received it. */
  seenAt: string;
}

/** Operation numbers are digit strings that only rise: a longer one is bigger, equal lengths compare as text. */
export function compareOperations(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
}

export interface BalanceBreak {
  /** The operation whose balance does not follow. */
  operation: string;
  kind: BalanceObservation["kind"];
  /** The operation before it that had a balance. */
  after: string;
  expectedPiasters: number;
  actualPiasters: number;
  /** actual minus expected: negative means money left that no text explains. */
  diffPiasters: number;
  seenAt: string;
  at: string;
}

/** What an operation does to the balance, or null when its amount is not known. */
function delta(observation: BalanceObservation): number | null {
  if (observation.amountPiasters === null) return null;
  if (observation.kind === "in") return observation.amountPiasters;
  if (observation.kind === "out")
    return -(observation.amountPiasters + (observation.feePiasters ?? 0));
  return null;
}

/**
 * Walks the observations in operation order and returns every step whose balance does not follow from
 * the one before. The first balance seen is only a starting point. An operation with no balance
 * (a transfer out whose text omits it) is carried into the next step instead of being skipped.
 */
export function checkBalanceChain(observations: readonly BalanceObservation[]): BalanceBreak[] {
  const ordered = [...observations].sort((a, b) =>
    compareOperations(a.transactionId, b.transactionId),
  );
  const breaks: BalanceBreak[] = [];
  let previous: { operation: string; balance: number } | null = null;
  let carried = 0;

  for (const observation of ordered) {
    const change = delta(observation);
    if (observation.balancePiasters === null) {
      carried += change ?? 0;
      continue;
    }
    if (previous) {
      const expected: number = previous.balance + carried + (change ?? 0);
      // A text of a kind we do not read has no amount: its own balance step is what it is, but it is
      // still worth a look when the balance moved at all.
      const moved = change === null && observation.balancePiasters !== previous.balance + carried;
      if (moved || (change !== null && observation.balancePiasters !== expected)) {
        const wanted = change === null ? previous.balance + carried : expected;
        breaks.push({
          operation: observation.transactionId,
          kind: observation.kind,
          after: previous.operation,
          expectedPiasters: wanted,
          actualPiasters: observation.balancePiasters,
          diffPiasters: observation.balancePiasters - wanted,
          seenAt: observation.seenAt,
          at: observation.at,
        });
      }
    }
    previous = { operation: observation.transactionId, balance: observation.balancePiasters };
    carried = 0;
  }
  return breaks;
}

/** "12.50" for 1250, "-3.00" for -300. */
export function formatPounds(piasters: number): string {
  return (piasters / 100).toFixed(2);
}
