/**
 * Reads EVERY row of a query, a page at a time.
 *
 * PostgREST answers at most 1,000 rows to one request and says nothing when it cuts: a read of a
 * table that has grown past 1,000 rows comes back looking complete with the rest missing (the same
 * trap that once unlinked 150 narrated clips, see scripts/insert-passages.ts). `readPage(from, to)`
 * must be the query WITH a stable `.order(...)` and `.range(from, to)`, so no row is skipped or
 * read twice between pages. A table under 1,000 rows still costs exactly one request.
 */

export const READ_PAGE_SIZE = 1000;

export async function readAllPages<T>(
  readPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize: number = READ_PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await readPage(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
