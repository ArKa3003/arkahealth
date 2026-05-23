import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RADIOPAEDIA_MIN_INTERVAL_MS,
  resetRadiopaediaRateLimiterForTests,
} from "@/lib/retrieval/rate-limit";
import { searchRadiopaedia } from "@/lib/retrieval/radiopaedia-client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  resetRadiopaediaRateLimiterForTests();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  resetRadiopaediaRateLimiterForTests();
});

function mockRadiopaediaJson(articles: unknown[]): void {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ articles }),
  });
}

describe("searchRadiopaedia rate limiting", () => {
  it("waits at least 3 seconds between upstream requests", async () => {
    mockRadiopaediaJson([
      { id: 1, title: "Lumbar disc", summary: "Disc pathology.", slug: "lumbar-disc" },
    ]);

    const first = searchRadiopaedia("lumbar");
    await vi.runAllTimersAsync();
    await first;

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const secondPromise = searchRadiopaedia("spine");
    await vi.advanceTimersByTimeAsync(RADIOPAEDIA_MIN_INTERVAL_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync();
    await secondPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns upstream_rate_limited on HTTP 429 without throwing", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });

    const resultPromise = searchRadiopaedia("knee MRI");
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe("upstream_rate_limited");
  });

  it("tags every hit with CC-BY-NC-SA-3.0 licensing", async () => {
    mockRadiopaediaJson([
      { id: 42, title: "ACL tear", summary: "Knee injury.", slug: "acl-tear" },
    ]);

    const resultPromise = searchRadiopaedia("ACL");
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.error).toBeNull();
    expect(result.data?.[0]?.licensing).toBe("CC-BY-NC-SA-3.0");
    expect(result.data?.[0]?.url).toContain("radiopaedia.org");
  });
});
