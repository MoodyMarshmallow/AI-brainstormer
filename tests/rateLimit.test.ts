import { beforeEach, describe, expect, it, vi } from "vitest";
import * as rateLimit from "@/lib/rateLimit";

describe("rate limiter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows first request", () => {
    const result = rateLimit.checkRateLimit("test");
    expect(result.allowed).toBe(true);
  });

  it("blocks after exceeding limit", () => {
    const spy = vi.spyOn(Date, "now");
    spy.mockReturnValue(0);
    const key = "heavy-user";
    for (let i = 0; i < 30; i += 1) {
      const result = rateLimit.checkRateLimit(key);
      expect(result.allowed).toBe(true);
    }
    const blocked = rateLimit.checkRateLimit(key);
    expect(blocked.allowed).toBe(false);
  });
});
