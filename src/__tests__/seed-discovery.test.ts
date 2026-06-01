import { describe, expect, test } from "bun:test";
import type { CompanySeed } from "../types.ts";
import {
  buildBoardUrl,
  filterSeeds,
  parseSeedFilters,
  seedMatchToDiscoveredCompany,
} from "../utils/seed-discovery.ts";

// ─── parseSeedFilters ───────────────────────────────────────────────

describe("parseSeedFilters", () => {
  test("no flags → empty arrays", () => {
    expect(parseSeedFilters([])).toEqual({ industries: [], regions: [] });
  });

  test("--industry=fintech → industries:[fintech], regions:[]", () => {
    expect(parseSeedFilters(["--industry=fintech"])).toEqual({
      industries: ["fintech"],
      regions: [],
    });
  });

  test("--region=sea → industries:[], regions:[sea]", () => {
    expect(parseSeedFilters(["--region=sea"])).toEqual({
      industries: [],
      regions: ["sea"],
    });
  });

  test("comma-separated multi-value industry", () => {
    expect(parseSeedFilters(["--industry=fintech,saas,devtools"])).toEqual({
      industries: ["fintech", "saas", "devtools"],
      regions: [],
    });
  });

  test("comma-separated multi-value region", () => {
    expect(parseSeedFilters(["--region=sea,eu"])).toEqual({
      industries: [],
      regions: ["sea", "eu"],
    });
  });

  test("case + whitespace normalization", () => {
    expect(parseSeedFilters(["--industry= FinTech , SaaS "])).toEqual({
      industries: ["fintech", "saas"],
      regions: [],
    });
  });

  test("both flags together", () => {
    expect(parseSeedFilters(["--industry=fintech", "--region=sea"])).toEqual({
      industries: ["fintech"],
      regions: ["sea"],
    });
  });

  test("ignores unrelated flags", () => {
    expect(parseSeedFilters(["--directory", "--probe-ats", "--region=us"])).toEqual({
      industries: [],
      regions: ["us"],
    });
  });
});

// ─── filterSeeds ────────────────────────────────────────────────────

const SEEDS: CompanySeed[] = [
  { name: "Stripe", industry: "fintech", region: "us" },
  { name: "Adyen", industry: "fintech", region: "eu" },
  { name: "Grab", industry: "fintech", region: "sea" },
  { name: "Linear", industry: "devtools", region: "us" },
  { name: "Vercel", industry: "devtools", region: "us" },
  { name: "Canva", industry: "saas", region: "sea" },
];

describe("filterSeeds", () => {
  test("no filters → all seeds returned", () => {
    expect(filterSeeds(SEEDS, { industries: [], regions: [] })).toHaveLength(6);
  });

  test("industry-only filter", () => {
    const result = filterSeeds(SEEDS, { industries: ["fintech"], regions: [] });
    expect(result.map((s) => s.name)).toEqual(["Stripe", "Adyen", "Grab"]);
  });

  test("region-only filter", () => {
    const result = filterSeeds(SEEDS, { industries: [], regions: ["us"] });
    expect(result.map((s) => s.name)).toEqual(["Stripe", "Linear", "Vercel"]);
  });

  test("combined AND filter (industry + region)", () => {
    const result = filterSeeds(SEEDS, { industries: ["fintech"], regions: ["sea"] });
    expect(result.map((s) => s.name)).toEqual(["Grab"]);
  });

  test("case-insensitive match", () => {
    const result = filterSeeds(SEEDS, { industries: ["FinTech"], regions: [] });
    expect(result.map((s) => s.name)).toEqual(["Stripe", "Adyen", "Grab"]);
  });

  test("unknown industry value → empty result", () => {
    expect(filterSeeds(SEEDS, { industries: ["blockchain"], regions: [] })).toHaveLength(0);
  });

  test("unknown region value → empty result", () => {
    expect(filterSeeds(SEEDS, { industries: [], regions: ["apac"] })).toHaveLength(0);
  });
});

// ─── buildBoardUrl ──────────────────────────────────────────────────

describe("buildBoardUrl", () => {
  test("greenhouse", () => {
    expect(buildBoardUrl("greenhouse", "stripe")).toBe("https://boards.greenhouse.io/stripe");
  });

  test("lever", () => {
    expect(buildBoardUrl("lever", "linear")).toBe("https://jobs.lever.co/linear");
  });

  test("ashby", () => {
    expect(buildBoardUrl("ashby", "notion")).toBe("https://jobs.ashbyhq.com/notion");
  });

  test("workable", () => {
    expect(buildBoardUrl("workable", "acme")).toBe("https://apply.workable.com/acme/");
  });

  test("smartrecruiters", () => {
    expect(buildBoardUrl("smartrecruiters", "grab")).toBe("https://jobs.smartrecruiters.com/grab");
  });

  test("unsupported platform (teamtailor/bamboohr/wordpress) throws", () => {
    // These three platforms require a domain, not a slug. probeAts never
    // returns them, so this branch is unreachable via seedMatchToDiscoveredCompany.
    // The throw ensures future callers get a clear error rather than a silent "".
    expect(() => buildBoardUrl("teamtailor", "foo")).toThrow(
      'buildBoardUrl: unsupported platform "teamtailor"',
    );
  });
});

// ─── seedMatchToDiscoveredCompany ───────────────────────────────────

describe("seedMatchToDiscoveredCompany", () => {
  const seed: CompanySeed = { name: "Stripe", industry: "fintech", region: "us" };
  const match = { platform: "greenhouse" as const, token: "stripe" };
  const date = "2026-06-01";

  test("correct field mapping", () => {
    const result = seedMatchToDiscoveredCompany(seed, match, date);
    expect(result.name).toBe("Stripe");
    expect(result.sources).toBe("ATS Directory");
    expect(result.roleCount).toBe(0);
    expect(result.locations).toBe("United States");
    expect(result.size).toBe("");
    expect(result.remoteFriendly).toBe("Unknown");
    expect(result.atsPlatform).toBe("greenhouse");
    expect(result.atsToken).toBe("stripe");
    expect(result.discoveredDate).toBe("2026-06-01");
  });

  test("sampleUrl populated via buildBoardUrl", () => {
    const result = seedMatchToDiscoveredCompany(seed, match, date);
    expect(result.sampleUrl).toBe("https://boards.greenhouse.io/stripe");
  });

  test("lever platform produces correct sampleUrl", () => {
    const result = seedMatchToDiscoveredCompany(
      { name: "Netflix", industry: "media", region: "us" },
      { platform: "lever", token: "netflix" },
      date,
    );
    expect(result.sampleUrl).toBe("https://jobs.lever.co/netflix");
  });
});
