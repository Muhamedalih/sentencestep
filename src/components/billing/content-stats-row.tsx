/**
 * "What Premium opens": a few real figures about the size of the library,
 * shown above the plan card so a visitor sees what they would get before they
 * see a price. Every figure arrives already rounded down and formatted (see
 * content-stats.ts); a figure too small to be worth quoting is simply absent.
 */
export function ContentStatsRow({
  heading,
  items,
}: {
  heading: string;
  items: { value: string; label: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-lg" aria-label={heading}>
      <h2 className="text-muted-foreground mb-2.5 text-center text-xs font-semibold tracking-wide uppercase">
        {heading}
      </h2>
      <ul className="border-border bg-card divide-border flex divide-x rounded-2xl border shadow-sm rtl:divide-x-reverse">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2 py-3.5 text-center"
          >
            <span
              dir="ltr"
              className="text-primary text-2xl leading-none font-semibold tabular-nums"
            >
              {item.value}
            </span>
            <span className="text-muted-foreground text-[11px] leading-snug" dir="auto">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
