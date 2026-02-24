import { describe, expect, test } from "bun:test";
import type { Job } from "../types.ts";
import { aggregateCompanies } from "../utils/company-aggregator.ts";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    dateFound: new Date().toISOString(),
    title: "Software Engineer",
    company: "TestCo",
    location: "Remote",
    url: "https://example.com/job",
    salary: "",
    description: "Build stuff",
    requiredSkills: "",
    experienceLevel: "",
    companySize: "",
    source: "RemoteOK",
    status: "New",
    notes: "",
    ...overrides,
  };
}

// ─── aggregateCompanies ─────────────────────────────────────────────

describe("aggregateCompanies", () => {
  test("groups jobs by normalized company name", () => {
    const jobs = [
      makeJob({ company: "Stripe, Inc.", source: "RemoteOK" }),
      makeJob({ company: "Stripe", source: "Remotive" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.roleCount).toBe(2);
  });

  test("tracks multiple sources", () => {
    const jobs = [
      makeJob({ company: "Acme", source: "RemoteOK" }),
      makeJob({ company: "Acme", source: "Remotive" }),
      makeJob({ company: "Acme", source: "RemoteOK" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.sources).toBe("RemoteOK, Remotive");
  });

  test("collects unique locations", () => {
    const jobs = [
      makeJob({ company: "Acme", location: "Remote" }),
      makeJob({ company: "Acme", location: "US" }),
      makeJob({ company: "Acme", location: "Remote" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.locations).toBe("Remote, US");
  });

  test("picks most frequent company size", () => {
    const jobs = [
      makeJob({ company: "Acme", companySize: "Startup" }),
      makeJob({ company: "Acme", companySize: "Mid-size" }),
      makeJob({ company: "Acme", companySize: "Mid-size" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.size).toBe("Mid-size");
  });

  test("remote friendly = Yes when >= 50% remote", () => {
    const jobs = [
      makeJob({ company: "Acme", location: "Remote" }),
      makeJob({ company: "Acme", location: "Remote - US" }),
      makeJob({ company: "Acme", location: "US" }),
      makeJob({ company: "Acme", location: "UK" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.remoteFriendly).toBe("Yes");
  });

  test("remote friendly = Likely when < 50% but > 0 remote", () => {
    const jobs = [
      makeJob({ company: "Acme", location: "Remote" }),
      makeJob({ company: "Acme", location: "US" }),
      makeJob({ company: "Acme", location: "UK" }),
      makeJob({ company: "Acme", location: "DE" }),
      makeJob({ company: "Acme", location: "JP" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.remoteFriendly).toBe("Likely");
  });

  test("remote friendly = No when no remote jobs", () => {
    const jobs = [
      makeJob({ company: "Acme", location: "US" }),
      makeJob({ company: "Acme", location: "UK" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.remoteFriendly).toBe("No");
  });

  test("filters out empty company names", () => {
    const jobs = [
      makeJob({ company: "" }),
      makeJob({ company: "  " }),
      makeJob({ company: "Valid Co" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.name).toBe("Valid Co");
  });

  test("returns empty array for empty input", () => {
    expect(aggregateCompanies([])).toHaveLength(0);
  });

  test("uses first seen company name as display name", () => {
    const jobs = [makeJob({ company: "Stripe, Inc." }), makeJob({ company: "stripe" })];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.name).toBe("Stripe, Inc.");
  });

  test("sets defaults for ATS fields", () => {
    const jobs = [makeJob({ company: "Acme" })];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.atsPlatform).toBe("Unknown");
    expect(result.at(0)?.atsToken).toBe("");
  });

  test("captures sample URL from first job", () => {
    const jobs = [
      makeJob({ company: "Acme", url: "https://example.com/first" }),
      makeJob({ company: "Acme", url: "https://example.com/second" }),
    ];
    const result = aggregateCompanies(jobs);
    expect(result.at(0)?.sampleUrl).toBe("https://example.com/first");
  });
});
