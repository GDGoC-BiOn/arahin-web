/**
 * Turns a lesson's `contentMarkdown` into the design's shape: a stack of
 * sections, each a heading plus its blocks, separated by hairlines.
 *
 * Written by hand rather than pulled from a markdown library because the
 * design needs the *section* structure, not a flat HTML stream — and because
 * a pure function is testable in this repo's node-only test setup. The
 * supported subset is deliberately small, and anything unrecognised falls
 * through as paragraph text: content is never silently dropped.
 *
 * Nothing here emits HTML, so the lesson text — which originates from a
 * user's uploaded document by way of an AI — can never inject markup.
 */
export type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "code"; text: string }
  | { kind: "image"; text: string; src: string };

export type TableCell = { id: string; tokens: InlineToken[] };
export type TableRow = { id: string; cells: TableCell[] };

/** A list entry plus any indented entries beneath it (one level deep). */
export type ListItem = { tokens: InlineToken[]; children: InlineToken[][] };

export type ContentBlock = { id: string } & (
  | { kind: "paragraph"; tokens: InlineToken[] }
  | { kind: "list"; ordered: boolean; items: ListItem[] }
  | { kind: "code"; text: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "quote"; tokens: InlineToken[] }
  | { kind: "rule" }
  | { kind: "table"; header: TableCell[]; rows: TableRow[] }
);

export type ContentSection = {
  id: string;
  /** null for content appearing before the first heading. */
  heading: string | null;
  blocks: ContentBlock[];
};

/**
 * Figures in lesson markdown point at `/v1/sources/{id}/images/{id}`, which
 * the backend serves only to a request carrying a bearer token — something an
 * `<img>` tag cannot do. Pointing them at this app's proxy instead is what
 * keeps them from all rendering broken.
 */
export function rewriteImageUrl(src: string): string {
  return src.replace(/^\/v1\/sources\//, "/api/sources/");
}

/** The reader's header, named after what the lesson was generated from. */
export function readerTitle(sourceType: string | null): string {
  const type = (sourceType ?? "").toLowerCase();
  if (type === "pdf") return "Materi PDF";
  if (type === "image" || type.startsWith("image/")) return "Materi Gambar";
  if (type === "ppt" || type === "pptx") return "Materi PPT";
  return "Materi";
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^(\s*)[-*+]\s+(.*)$/;
const ORDERED = /^(\s*)\d+[.)]\s+(.*)$/;
const IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/;
const FENCE = /^```/;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/;
const QUOTE = /^>\s?(.*)$/;
const TABLE_ROW = /^\|.*\|$/;
const TABLE_DIVIDER = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parseLessonContent(markdown: string): ContentSection[] {
  const lines = (markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const sections: ContentSection[] = [];
  let current: ContentSection = { id: "s0", heading: null, blocks: [] };
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: ListItem[] } | null = null;
  let fence: string[] | null = null;
  let table: string[][] | null = null;

  /** Blocks carry their own identity so the renderer never keys on an index. */
  const blockId = () => `${current.id}-b${current.blocks.length}`;

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) {
      current.blocks.push({
        id: blockId(),
        kind: "paragraph",
        tokens: parseInline(text),
      });
    }
    paragraph = [];
  };
  const flushQuote = () => {
    const text = quote.join(" ").trim();
    if (text) {
      current.blocks.push({
        id: blockId(),
        kind: "quote",
        tokens: parseInline(text),
      });
    }
    quote = [];
  };
  const flushList = () => {
    if (list?.items.length) {
      current.blocks.push({
        id: blockId(),
        kind: "list",
        ordered: list.ordered,
        items: list.items,
      });
    }
    list = null;
  };
  const flushTable = () => {
    if (table?.length) {
      const id = blockId();
      const toCells = (row: string[], rowId: string): TableCell[] =>
        row.map((text, column) => ({
          id: `${rowId}-c${column}`,
          tokens: parseInline(text),
        }));
      const [header = [], ...rows] = table;
      current.blocks.push({
        id,
        kind: "table",
        header: toCells(header, `${id}-h`),
        rows: rows.map((row, index) => ({
          id: `${id}-r${index}`,
          cells: toCells(row, `${id}-r${index}`),
        })),
      });
    }
    table = null;
  };
  const flushOpen = () => {
    flushParagraph();
    flushQuote();
    flushList();
    flushTable();
  };
  const flushSection = () => {
    flushOpen();
    if (current.heading !== null || current.blocks.length)
      sections.push(current);
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (fence !== null) {
      if (FENCE.test(trimmed)) {
        current.blocks.push({
          id: blockId(),
          kind: "code",
          text: fence.join("\n"),
        });
        fence = null;
      } else {
        fence.push(raw);
      }
      continue;
    }

    if (FENCE.test(trimmed)) {
      flushOpen();
      fence = [];
      continue;
    }

    const heading = HEADING.exec(trimmed);
    if (heading) {
      flushSection();
      current = {
        id: `s${sections.length + 1}`,
        heading: heading[2]?.trim() ?? "",
        blocks: [],
      };
      continue;
    }

    if (!trimmed) {
      // A blank line ends a paragraph or quote, but a list survives it: AI
      // output often spaces list items apart, and splitting there would
      // restart ordered numbering at 1.
      flushParagraph();
      flushQuote();
      flushTable();
      continue;
    }

    if (TABLE_ROW.test(trimmed)) {
      flushParagraph();
      flushQuote();
      flushList();
      if (TABLE_DIVIDER.test(trimmed)) continue;
      table ??= [];
      table.push(splitRow(trimmed));
      continue;
    }
    flushTable();

    if (RULE.test(trimmed)) {
      flushOpen();
      current.blocks.push({ id: blockId(), kind: "rule" });
      continue;
    }

    const quoted = QUOTE.exec(trimmed);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1] ?? "");
      continue;
    }
    flushQuote();

    const image = IMAGE.exec(trimmed);
    if (image) {
      flushOpen();
      current.blocks.push({
        id: blockId(),
        kind: "image",
        alt: image[1] ?? "",
        src: rewriteImageUrl(image[2] ?? ""),
      });
      continue;
    }

    const bullet = BULLET.exec(line);
    const ordered = ORDERED.exec(line);
    const match = bullet ?? ordered;
    if (match) {
      flushParagraph();
      const indent = (match[1] ?? "").replace(/\t/g, "  ").length;
      const tokens = parseInline((match[2] ?? "").trim());
      const last = list?.items.at(-1);
      if (indent >= 2 && list && last) {
        // Nested under the previous item, whatever its own marker — so a
        // bulleted sub-point never breaks the parent's numbering.
        last.children.push(tokens);
        continue;
      }
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push({ tokens, children: [] });
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  // An unterminated fence still has to surface its text.
  if (fence?.length) {
    current.blocks.push({
      id: blockId(),
      kind: "code",
      text: fence.join("\n"),
    });
  }
  flushSection();
  return sections;
}

const INLINE =
  /(!\[[^\]]*\]\([^)\s]+\)|\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  const pushText = (value: string) => {
    if (!value) return;
    const previous = tokens.at(-1);
    if (previous?.kind === "text") previous.text += value;
    else tokens.push({ kind: "text", text: value });
  };
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    pushText(text.slice(last, index));
    const piece = match[0];
    if (piece.startsWith("![")) {
      const [, alt = "", src = ""] =
        /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(piece) ?? [];
      tokens.push({ kind: "image", text: alt, src: rewriteImageUrl(src) });
    } else if (piece.startsWith("[")) {
      // Links render as their text: the lesson never navigates away, and an
      // AI-written URL is not something to make clickable.
      pushText(/^\[([^\]]+)\]/.exec(piece)?.[1] ?? piece);
    } else if (piece.startsWith("**")) {
      tokens.push({ kind: "bold", text: piece.slice(2, -2) });
    } else {
      tokens.push({ kind: "code", text: piece.slice(1, -1) });
    }
    last = index + piece.length;
  }
  pushText(text.slice(last));
  return tokens.length ? tokens : [{ kind: "text", text }];
}

/** Plain text of a section, used for reading-time and screen readers. */
export function sectionPlainText(section: ContentSection): string {
  const parts: string[] = [];
  for (const block of section.blocks) {
    if (block.kind === "paragraph" || block.kind === "quote") {
      parts.push(tokensToText(block.tokens));
    }
    if (block.kind === "list") {
      for (const item of block.items) {
        parts.push(tokensToText(item.tokens));
        for (const child of item.children) parts.push(tokensToText(child));
      }
    }
    if (block.kind === "table") {
      for (const cell of block.header) parts.push(tokensToText(cell.tokens));
      for (const row of block.rows) {
        for (const cell of row.cells) parts.push(tokensToText(cell.tokens));
      }
    }
    if (block.kind === "code") parts.push(block.text);
  }
  return parts.join(" ");
}

function tokensToText(tokens: InlineToken[]): string {
  return tokens
    .filter((t) => t.kind !== "image")
    .map((t) => t.text)
    .join("");
}
