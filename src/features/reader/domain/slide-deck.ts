/**
 * The slide split the backend uses to build the PPTX
 * (arahin-backend internal/journey/render/deck.go), ported line for line so the
 * on-screen preview shows exactly the slides the download will contain.
 */
export type Slide = { id: string; title: string; bullets: string[] };

export const BULLETS_PER_SLIDE = 8;

const IMAGE_REF = /^!\[[^\]]*\]\([^)]*\)/;
const BULLET_MARKER = /^(\s*[-*+]|\s*\d+\.)\s+/;

const HORIZONTAL_RULE = /^(?:-{3,}|\*{3,}|_{3,})$/;
const TABLE_DIVIDER = /^\|?[\s:|-]+\|?$/;
const NUMBER_RUN = /^\d+(?:\s+\d+)+$/;
const LINK = /!?\[([^\]]*)\]\([^)]*\)/g;
const EMPHASIS = /\*\*|__|`/g;

/** Emphasis and code marks removed; links and inline images reduced to text. */
function stripInline(text: string): string {
  return text.replace(LINK, "$1").replace(EMPHASIS, "").trim();
}

function countLetters(text: string): number {
  return (text.match(/\p{L}/gu) ?? []).length;
}

function cleanHeading(line: string): string {
  return stripInline(line.replace(/^#+/, "").trim());
}

/**
 * One body line as slide text, or null for markdown structure: rules, table
 * dividers, page-number runs and symbol-only fragments. Tables become
 * "a — b". Mirrors `bulletText` in deck.go.
 */
export function bulletText(line: string): string | null {
  if (HORIZONTAL_RULE.test(line) || NUMBER_RUN.test(line)) return null;
  let text = line;
  if (text.startsWith("|")) {
    if (TABLE_DIVIDER.test(text)) return null;
    text = text
      .replace(/^\|+|\|+$/g, "")
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean)
      .join(" — ");
  }
  text = text.replace(/^>/, "").trim();
  text = stripInline(text.replace(BULLET_MARKER, ""));
  return countLetters(text) < 2 ? null : text;
}

function splitLongSlide(slide: Omit<Slide, "id">): Omit<Slide, "id">[] {
  if (slide.bullets.length <= BULLETS_PER_SLIDE) return [slide];
  const out: Omit<Slide, "id">[] = [];
  for (
    let start = 0;
    start < slide.bullets.length;
    start += BULLETS_PER_SLIDE
  ) {
    out.push({
      title: start > 0 ? `${slide.title} (lanjutan)` : slide.title,
      bullets: slide.bullets.slice(start, start + BULLETS_PER_SLIDE),
    });
  }
  return out;
}

export function buildDeck(title: string, markdown: string): Slide[] {
  const slides: Omit<Slide, "id">[] = [];
  let current: Omit<Slide, "id"> | null = null;

  const flush = () => {
    if (!current || (current.title === "" && current.bullets.length === 0)) {
      return;
    }
    slides.push(...splitLongSlide(current));
    current = null;
  };

  for (const raw of (markdown ?? "").split("\n")) {
    const line = raw.trim();
    if (line === "") continue;
    if (line.startsWith("#")) {
      flush();
      current = { title: cleanHeading(line), bullets: [] };
    } else if (IMAGE_REF.test(line)) {
    } else {
      const bullet = bulletText(line);
      if (bullet === null) continue;
      current ??= { title, bullets: [] };
      current.bullets.push(bullet);
    }
  }
  flush();

  const deck = slides.length ? slides : [{ title, bullets: [] }];
  return deck.map((slide, index) => ({ ...slide, id: `slide-${index}` }));
}

/** Reading time at ~200 words a minute, never less than one minute. */
export function deckMinutes(slides: Slide[]): number {
  const words = slides
    .flatMap((slide) => [slide.title, ...slide.bullets])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
