import { describe, expect, test } from "bun:test";
import { generateAtsSlugs, normalizeCompanyName } from "../utils/company-name.ts";

// ─── normalizeCompanyName ───────────────────────────────────────────

describe("normalizeCompanyName", () => {
  test.each([
    ["Stripe, Inc.", "stripe"],
    ["Stripe Inc", "stripe"],
    ["Stripe", "stripe"],
    ["Employment Hero Pty Ltd", "employment hero"],
    ["GitLab", "gitlab"],
    ["Modern Health", "modern health"],
    ["  Spaces  Corp.  ", "spaces"],
    ["Acme LLC", "acme"],
    ["Acme GmbH", "acme"],
    ["Acme Limited", "acme"],
    ["Acme Incorporated", "acme"],
    ["Acme Corporation", "acme"],
  ])("normalizes %s → %s", (input, expected) => {
    expect(normalizeCompanyName(input)).toBe(expected);
  });

  test("handles empty string", () => {
    expect(normalizeCompanyName("")).toBe("");
  });

  test("lowercases all characters", () => {
    expect(normalizeCompanyName("ACME CORP")).toBe("acme");
  });

  test("strips periods and commas", () => {
    expect(normalizeCompanyName("A.B.C., Inc.")).toBe("a b c");
  });
});

// ─── generateAtsSlugs ───────────────────────────────────────────────

describe("generateAtsSlugs", () => {
  test("generates hyphenated, concatenated, and first-word slugs", () => {
    const slugs = generateAtsSlugs("Employment Hero");
    expect(slugs).toContain("employment-hero");
    expect(slugs).toContain("employmenthero");
    expect(slugs).toContain("employment");
  });

  test("single-word name produces one slug", () => {
    const slugs = generateAtsSlugs("Stripe");
    expect(slugs).toEqual(["stripe"]);
  });

  test("strips suffixes before generating slugs", () => {
    const slugs = generateAtsSlugs("Acme Corp.");
    expect(slugs).toEqual(["acme"]);
  });

  test("handles multi-word name with suffix", () => {
    const slugs = generateAtsSlugs("Modern Health Inc.");
    expect(slugs).toContain("modern-health");
    expect(slugs).toContain("modernhealth");
    expect(slugs).toContain("modern");
  });
});
