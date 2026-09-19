import { describe, expect, it } from "vitest";
import {
  BULLETS_PER_SLIDE,
  buildDeck,
  deckMinutes,
} from "@/features/reader/domain/slide-deck";

describe("buildDeck (mirrors backend deck.go)", () => {
  it("starts a slide per heading and strips list markers", () => {
    const deck = buildDeck(
      "Judul",
      "# Satu\n- alfa\n1. beta\n\n## **Dua**\nteks",
    );
    expect(deck.map((s) => [s.title, s.bullets])).toEqual([
      ["Satu", ["alfa", "beta"]],
      ["Dua", ["teks"]],
    ]);
  });

  it("puts body before the first heading under the lesson title", () => {
    expect(buildDeck("Judul", "pembuka\n# H\nx")[0]).toMatchObject({
      title: "Judul",
      bullets: ["pembuka"],
    });
  });

  it("skips image lines", () => {
    expect(buildDeck("J", "# H\n![](img.png)\nteks")[0]?.bullets).toEqual([
      "teks",
    ]);
  });

  it("continues long slides under (lanjutan)", () => {
    const body = Array.from(
      { length: BULLETS_PER_SLIDE + 3 },
      (_, i) => `- poin ${i}`,
    );
    const deck = buildDeck("J", `# Panjang\n${body.join("\n")}`);
    expect(deck.map((s) => s.title)).toEqual(["Panjang", "Panjang (lanjutan)"]);
    expect(deck[1]?.bullets).toHaveLength(3);
  });

  it("always yields at least a title slide", () => {
    expect(buildDeck("Kosong", "")).toEqual([
      { id: "slide-0", title: "Kosong", bullets: [] },
    ]);
  });

  it("estimates at least one minute", () => {
    expect(deckMinutes(buildDeck("J", ""))).toBe(1);
  });
});

describe("buildDeck strips markdown syntax (mirrors backend PR #10)", () => {
  it("matches the backend's cleaned bullets", () => {
    const md = [
      "# **Keamanan** Data",
      "| Istilah | Arti |",
      "| --- | :---: |",
      "| **Enkripsi** | mengacak data |",
      "---",
      "> Kutipan penting.",
      "- Lihat [dokumen](https://x.y) dan `kode`",
      "\\\\",
      "| 1",
      "6 7 8 9 10",
      "1. __Langkah__ satu",
    ].join("\n");
    const [slide] = buildDeck("Judul", md);
    expect(slide?.title).toBe("Keamanan Data");
    expect(slide?.bullets).toEqual([
      "Istilah — Arti",
      "Enkripsi — mengacak data",
      "Kutipan penting.",
      "Lihat dokumen dan kode",
      "Langkah satu",
    ]);
  });
});
