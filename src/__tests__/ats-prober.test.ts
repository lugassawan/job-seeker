import { afterEach, describe, expect, mock, test } from "bun:test";
import { probeAts } from "../services/ats-prober.ts";

describe("probeAts", () => {
  afterEach(() => {
    mock.restore();
  });

  test("returns null and collects errors when all fetches throw (network failure)", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new TypeError("fetch failed")),
    ) as unknown as typeof fetch;

    const errors: string[] = [];
    const result = await probeAts("Acme", errors);

    expect(result).toBeNull();
    // At least one error pushed per slug × platform that errored
    expect(errors.length).toBeGreaterThan(0);
    // Each error string names the company and a platform/slug pair
    expect(errors[0]).toContain("Acme");
  });

  test("returns match when first platform responds successfully", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({ jobs: [{ id: 1 }] }), { status: 200 })),
    ) as unknown as typeof fetch;

    const errors: string[] = [];
    const result = await probeAts("Stripe", errors);

    expect(result).not.toBeNull();
    expect(result?.platform).toBe("greenhouse");
    expect(errors).toHaveLength(0);
  });

  test("does not push to errors array when no errors array is passed", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new TypeError("fetch failed")),
    ) as unknown as typeof fetch;

    // Should not throw even without errors array
    const result = await probeAts("Ghost");
    expect(result).toBeNull();
  });
});
