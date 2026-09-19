import { describe, expect, it } from "vitest";
import {
  type ContentSection,
  parseInline,
  parseLessonContent,
  rewriteImageUrl,
  sectionPlainText,
} from "@/features/reader/domain/lesson-content";

const allText = (sections: ContentSection[]) =>
  sections
    .map((s) => `${s.heading ?? ""} ${sectionPlainText(s)}`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

describe("parseLessonContent", () => {
  it("splits on headings into sections", () => {
    const out = parseLessonContent(
      "## Penjelasan\nEnkripsi adalah proses.\n\n## Tujuan\nMelindungi data.",
    );
    expect(out.map((s) => s.heading)).toEqual(["Penjelasan", "Tujuan"]);
    expect(out[0]?.blocks).toHaveLength(1);
  });

  it("keeps content that appears before any heading", () => {
    const out = parseLessonContent("Kalimat pembuka.\n\n## Bab 1\nIsi.");
    expect(out[0]?.heading).toBeNull();
    expect(allText(out)).toContain("Kalimat pembuka.");
  });

  it("joins wrapped lines into one paragraph", () => {
    const out = parseLessonContent("baris satu\nbaris dua\n\nparagraf lain");
    expect(out[0]?.blocks).toHaveLength(2);
    expect(allText(out)).toContain("baris satu baris dua");
  });

  it("groups bullets into one list", () => {
    const out = parseLessonContent("## L\n- satu\n- dua\n- tiga");
    const block = out[0]?.blocks[0];
    expect(block?.kind).toBe("list");
    if (block?.kind === "list") {
      expect(block.ordered).toBe(false);
      expect(block.items).toHaveLength(3);
    }
  });

  it("separates ordered from unordered lists", () => {
    const out = parseLessonContent("## L\n- a\n1. b");
    expect(out[0]?.blocks.map((b) => b.kind)).toEqual(["list", "list"]);
  });

  it("keeps fenced code verbatim, including markdown-looking lines", () => {
    const out = parseLessonContent(
      "## C\n```\n# not a heading\n- not a list\n```",
    );
    const block = out[0]?.blocks[0];
    expect(block?.kind).toBe("code");
    if (block?.kind === "code") {
      expect(block.text).toContain("# not a heading");
      expect(block.text).toContain("- not a list");
    }
    // The fence must not have started a new section.
    expect(out).toHaveLength(1);
  });

  it("surfaces an unterminated fence rather than swallowing it", () => {
    const out = parseLessonContent("## C\n```\nmasih terbuka");
    expect(allText(out)).toContain("masih terbuka");
  });

  it("extracts images and points them at the authenticated proxy", () => {
    const out = parseLessonContent(
      "## Gambar\n![Diagram](/v1/sources/abc/images/p6_1)",
    );
    const block = out[0]?.blocks[0];
    expect(block?.kind).toBe("image");
    if (block?.kind === "image") {
      expect(block.src).toBe("/api/sources/abc/images/p6_1");
      expect(block.alt).toBe("Diagram");
    }
  });

  it("never drops content, whatever the input looks like", () => {
    // The guarantee that matters: unknown syntax degrades to text.
    const md = [
      "# Judul",
      "> kutipan yang tidak didukung",
      "| tabel | aneh |",
      "teks biasa",
      "- item",
    ].join("\n");
    const text = allText(parseLessonContent(md));
    for (const fragment of [
      "Judul",
      "kutipan",
      "tabel",
      "teks biasa",
      "item",
    ]) {
      expect(text).toContain(fragment);
    }
  });

  it("handles empty and whitespace input without throwing", () => {
    expect(parseLessonContent("")).toEqual([]);
    expect(parseLessonContent("   \n\n  ")).toEqual([]);
  });

  it("normalises CRLF line endings", () => {
    const out = parseLessonContent("## A\r\nisi\r\n");
    expect(out[0]?.heading).toBe("A");
    expect(allText(out)).toContain("isi");
  });
});

describe("parseInline", () => {
  it("marks bold and code without keeping the markers", () => {
    expect(parseInline("ini **tebal** dan `kode` ya")).toEqual([
      { kind: "text", text: "ini " },
      { kind: "bold", text: "tebal" },
      { kind: "text", text: " dan " },
      { kind: "code", text: "kode" },
      { kind: "text", text: " ya" },
    ]);
  });

  it("leaves plain text as one token", () => {
    expect(parseInline("tanpa format")).toEqual([
      { kind: "text", text: "tanpa format" },
    ]);
  });

  it("leaves unmatched markers alone rather than eating them", () => {
    expect(parseInline("**belum ditutup")).toEqual([
      { kind: "text", text: "**belum ditutup" },
    ]);
  });
});

describe("rewriteImageUrl", () => {
  it("only rewrites the backend's own source images", () => {
    expect(rewriteImageUrl("/v1/sources/a/images/b")).toBe(
      "/api/sources/a/images/b",
    );
    expect(rewriteImageUrl("https://cdn.example.com/x.png")).toBe(
      "https://cdn.example.com/x.png",
    );
  });
});

describe("markdown the AI actually writes", () => {
  it("keeps ordered numbering across nested bullets and blank lines", () => {
    const out = parseLessonContent(
      "## L\n1. satu\n   - detail a\n   - detail b\n\n2. dua\n3. tiga",
    );
    const blocks = out[0]?.blocks ?? [];
    expect(blocks).toHaveLength(1);
    const list = blocks[0];
    if (list?.kind !== "list") throw new Error("expected a list");
    expect(list.ordered).toBe(true);
    expect(list.items).toHaveLength(3);
    expect(list.items[0]?.children).toHaveLength(2);
  });

  it("parses tables and skips the divider row", () => {
    const out = parseLessonContent(
      "| Istilah | Arti |\n| --- | :---: |\n| **Enkripsi** | acak data |\n| Hash | satu arah |",
    );
    const table = out[0]?.blocks[0];
    if (table?.kind !== "table") throw new Error("expected a table");
    expect(table.header).toHaveLength(2);
    expect(table.rows).toHaveLength(2);
    expect(table.rows[0]?.cells[0]?.tokens[0]).toEqual({
      kind: "bold",
      text: "Enkripsi",
    });
  });

  it("renders rules and quotes as their own blocks", () => {
    const out = parseLessonContent("teks\n\n---\n\n> kutipan satu\n> dua");
    expect(out[0]?.blocks.map((b) => b.kind)).toEqual([
      "paragraph",
      "rule",
      "quote",
    ]);
    expect(allText(out)).toContain("kutipan satu dua");
    expect(allText(out)).not.toContain(">");
  });

  it("finds images inside a sentence and rewrites their url", () => {
    const tokens = parseInline(
      "Lihat ![diagram](/v1/sources/a/images/b) di atas",
    );
    expect(tokens.map((t) => t.kind)).toEqual(["text", "image", "text"]);
    const image = tokens[1];
    if (image?.kind !== "image") throw new Error("expected image");
    expect(image.src).toBe("/api/sources/a/images/b");
  });

  it("renders links as their text only", () => {
    expect(parseInline("baca [dokumen ini](https://x.y) ya")).toEqual([
      { kind: "text", text: "baca dokumen ini ya" },
    ]);
  });
});
