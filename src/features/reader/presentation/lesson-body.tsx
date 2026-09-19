"use client";

import type {
  ContentBlock,
  ContentSection,
  InlineToken,
} from "../domain/lesson-content";

/**
 * Sections stack inside one card, divided by hairlines, exactly as the design
 * lays them out. Nothing here renders HTML from the markdown — every token is
 * text React escapes — because the content comes from a user's uploaded
 * document by way of an AI.
 */
export function LessonBody({ sections }: { sections: ContentSection[] }) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-[20px] border border-[#cbd5e1] bg-[#f1f5f9] p-4">
      {sections.map((section, index) => (
        <div key={section.id} className="flex w-full flex-col gap-5">
          {index > 0 ? <span className="h-px w-full bg-[#cbd5e1]" /> : null}
          <section className="flex w-full flex-col gap-2">
            {section.heading ? (
              <h2 className="text-sm leading-[1.25] font-bold break-words text-[#0f172a]">
                {section.heading}
              </h2>
            ) : null}
            {section.blocks.map((block) => (
              <Block key={block.id} block={block} />
            ))}
          </section>
        </div>
      ))}
    </div>
  );
}

const TEXT = "text-xs leading-[1.25] break-words text-[#64748b]";

function Block({ block }: { block: ContentBlock }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <p className={TEXT}>
          <Inline tokens={block.tokens} />
        </p>
      );
    case "quote":
      return (
        <blockquote
          className={`${TEXT} border-l-2 border-primary-300 pl-3 italic`}
        >
          <Inline tokens={block.tokens} />
        </blockquote>
      );
    case "rule":
      return (
        <hr className="border-0 border-t border-dashed border-[#cbd5e1]" />
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          className={`${TEXT} flex list-outside flex-col gap-1 pl-4 ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item) => (
            <li key={`${block.id}-${itemKey(item.tokens)}`}>
              <Inline tokens={item.tokens} />
              {item.children.length ? (
                <ul className="mt-1 flex list-outside list-[circle] flex-col gap-1 pl-4">
                  {item.children.map((child) => (
                    <li key={itemKey(child)}>
                      <Inline tokens={child} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ListTag>
      );
    }
    case "table":
      return (
        // Wide tables scroll inside their own box; the page never pans.
        <div className="w-full overflow-x-auto rounded-xl border border-[#cbd5e1] bg-white">
          <table className="w-full border-collapse text-left text-[11px] leading-[1.3] text-[#475569]">
            <thead>
              <tr>
                {block.header.map((cell) => (
                  <th
                    key={cell.id}
                    className="border-b border-[#cbd5e1] bg-[#f8fafc] px-2.5 py-2 font-bold whitespace-nowrap text-[#0f172a]"
                  >
                    <Inline tokens={cell.tokens} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#e2e8f0] last:border-0"
                >
                  {row.cells.map((cell) => (
                    <td
                      key={cell.id}
                      className="px-2.5 py-2 align-top break-words"
                    >
                      <Inline tokens={cell.tokens} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "code":
      return (
        <pre className="overflow-x-auto rounded-xl bg-white p-3 text-[11px] leading-[1.4] text-[#0f172a]">
          <code>{block.text}</code>
        </pre>
      );
    case "image":
      return <Figure src={block.src} alt={block.alt} />;
  }
}

function Figure({ src, alt }: { src: string; alt: string }) {
  return (
    // Routed through the app's proxy so the bearer token can be attached;
    // a bare <img> to the backend would 401.
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="my-1 block h-auto max-w-full rounded-xl bg-white"
    />
  );
}

/** Parsed content never reorders, so content itself is a stable identity. */
function itemKey(tokens: InlineToken[]): string {
  return tokens
    .map((t) => t.text)
    .join("")
    .slice(0, 40);
}

function Inline({ tokens }: { tokens: InlineToken[] }) {
  return (
    <>
      {tokens.map((token, position) => {
        const key = `${token.kind}:${position}:${token.text.slice(0, 12)}`;
        if (token.kind === "image") {
          return <Figure key={key} src={token.src} alt={token.text} />;
        }
        if (token.kind === "bold") {
          return (
            <strong key={key} className="font-bold text-[#0f172a]">
              {token.text}
            </strong>
          );
        }
        if (token.kind === "code") {
          return (
            <code
              key={key}
              className="rounded bg-white px-1 text-[11px] break-all"
            >
              {token.text}
            </code>
          );
        }
        return <span key={key}>{token.text}</span>;
      })}
    </>
  );
}
