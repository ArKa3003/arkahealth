import { describe, expect, it } from "vitest";

import { truncateExcerptWords } from "@/lib/retrieval/excerpt";

describe("truncateExcerptWords", () => {
  it("truncates to 300 words with ellipsis", () => {
    const words = Array.from({ length: 350 }, (_, i) => `word${i}`);
    const input = words.join(" ");
    const out = truncateExcerptWords(input);
    const outWords = out.replace(/…$/, "").trim().split(/\s+/);
    expect(outWords.length).toBe(300);
    expect(out.endsWith("…")).toBe(true);
  });

  it("returns short text unchanged", () => {
    expect(truncateExcerptWords("short excerpt")).toBe("short excerpt");
  });
});
