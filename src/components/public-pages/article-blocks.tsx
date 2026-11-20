import { Mixed } from "@/components/public-pages/mixed-text";
import type { ArticleBlock } from "@/lib/public-pages/types";

/** The written explanation of a rule: headings, paragraphs, lists and small tables, in Arabic with the English kept left to right. */
export function ArticleBlocks({ blocks }: { blocks: readonly ArticleBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "h2":
            return (
              <h2 key={index} dir="rtl" className="mt-9 mb-3 text-xl leading-snug font-semibold">
                <Mixed text={block.text} />
              </h2>
            );
          case "p":
            return (
              <p key={index} dir="rtl" className="mb-3 leading-8">
                <Mixed text={block.text} />
              </p>
            );
          case "list":
            return (
              <ul key={index} dir="rtl" className="mb-3 list-disc space-y-2 ps-6 leading-8">
                {block.items.map((item) => (
                  <li key={item}>
                    <Mixed text={item} />
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div
                key={index}
                className="border-border bg-card mb-3 overflow-x-auto rounded-xl border"
                dir="rtl"
              >
                <table className="w-full text-start text-[15px]">
                  <thead>
                    <tr className="bg-muted/60">
                      {block.head.map((cell) => (
                        <th key={cell} className="px-4 py-2.5 text-start font-semibold">
                          <Mixed text={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-border border-t">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2.5 align-top">
                            <Mixed text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
}
