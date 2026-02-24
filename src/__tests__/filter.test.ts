import { describe, expect, test } from "bun:test";
import type { Job } from "../types.ts";
import { filterJobs, isExcludedLocation, isRecentJob, isRelevantJob } from "../utils/filter.ts";

// ─── Helper ─────────────────────────────────────────────────────────

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

// ─── isRelevantJob ──────────────────────────────────────────────────

describe("isRelevantJob", () => {
  test.each([
    "Software Engineer",
    "Senior Software Engineer",
    "Software Developer",
    "Backend Engineer",
    "Senior Backend Developer",
    "Back-End Developer",
    "Fullstack Developer",
    "Full-Stack Engineer",
    "Senior Full Stack Developer",
  ])("matches engineering title: %s", (title) => {
    expect(isRelevantJob(makeJob({ title }))).toBe(true);
  });

  test("matches when keyword appears in requiredSkills", () => {
    const job = makeJob({
      title: "Associate I",
      requiredSkills: "Software Engineer, TypeScript, Node.js",
    });
    expect(isRelevantJob(job)).toBe(true);
  });

  test("matching is case-insensitive", () => {
    expect(isRelevantJob(makeJob({ title: "SOFTWARE ENGINEER" }))).toBe(true);
    expect(isRelevantJob(makeJob({ title: "software engineer" }))).toBe(true);
    expect(isRelevantJob(makeJob({ title: "sOfTwArE eNgInEeR" }))).toBe(true);
  });

  test.each([
    "Marketing Manager",
    "Sales Representative",
    "HR Coordinator",
    "Financial Analyst",
    "Product Manager",
    "Recruiter",
    "Office Administrator",
    "Accountant",
    "Frontend Engineer",
    "DevOps Engineer",
    "ML Engineer",
    "Mobile Developer",
    "Data Engineer",
    "Security Engineer",
    "QA Engineer",
    "iOS Developer",
    "Android Engineer",
  ])("rejects non-matching title: %s", (title) => {
    expect(isRelevantJob(makeJob({ title, requiredSkills: "" }))).toBe(false);
  });
});

// ─── isExcludedLocation ─────────────────────────────────────────────

describe("isExcludedLocation", () => {
  test.each([
    "india",
    "India",
    "Remote - India",
    "Bangalore, India",
  ])("excludes location: %s", (location) => {
    expect(isExcludedLocation(location)).toBe(true);
  });

  test("excludes standalone country code IN", () => {
    expect(isExcludedLocation("IN")).toBe(true);
    expect(isExcludedLocation("Remote - IN")).toBe(true);
  });

  test.each([
    "Remote",
    "US",
    "UK",
    "Remote - Worldwide",
    "San Francisco, CA",
    "London, UK",
    "Berlin, Germany",
    "New York, US",
    "Jakarta, Indonesia",
    "Indonesia",
    "Remote - ID",
  ])("allows location: %s", (location) => {
    expect(isExcludedLocation(location)).toBe(false);
  });

  test("does not false-positive on substrings containing IN", () => {
    expect(isExcludedLocation("Florida")).toBe(false);
    expect(isExcludedLocation("Madrid")).toBe(false);
  });
});

// ─── isRecentJob ────────────────────────────────────────────────────

describe("isRecentJob", () => {
  test("returns true for a date within the last 24 hours", () => {
    const recent = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
    expect(isRecentJob(recent)).toBe(true);
  });

  test("returns true for right now", () => {
    expect(isRecentJob(new Date().toISOString())).toBe(true);
  });

  test("returns false for a date older than 24 hours", () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48 hours ago
    expect(isRecentJob(old)).toBe(false);
  });

  test("respects custom hoursAgo parameter", () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    expect(isRecentJob(fiveHoursAgo, 6)).toBe(true);
    expect(isRecentJob(fiveHoursAgo, 4)).toBe(false);
  });

  test("handles epoch timestamps in seconds", () => {
    const recentEpoch = Math.floor(Date.now() / 1000).toString(); // now, in seconds
    expect(isRecentJob(recentEpoch)).toBe(true);

    const oldEpoch = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000).toString();
    expect(isRecentJob(oldEpoch)).toBe(false);
  });

  test("handles epoch timestamps in milliseconds", () => {
    const recentEpoch = Date.now().toString();
    expect(isRecentJob(recentEpoch)).toBe(true);

    const oldEpoch = (Date.now() - 48 * 60 * 60 * 1000).toString();
    expect(isRecentJob(oldEpoch)).toBe(false);
  });

  test("returns false for invalid date strings", () => {
    expect(isRecentJob("not-a-date")).toBe(false);
    expect(isRecentJob("")).toBe(false);
  });
});

// ─── filterJobs ─────────────────────────────────────────────────────

describe("filterJobs", () => {
  test("keeps a job that is relevant, well-located, and recent", () => {
    const jobs = [makeJob()];
    expect(filterJobs(jobs)).toHaveLength(1);
  });

  test("removes a job with an irrelevant title", () => {
    const jobs = [makeJob({ title: "Marketing Manager", requiredSkills: "" })];
    expect(filterJobs(jobs)).toHaveLength(0);
  });

  test("removes a job in an excluded location", () => {
    const jobs = [makeJob({ location: "Bangalore, India" })];
    expect(filterJobs(jobs)).toHaveLength(0);
  });

  test("removes a job that is too old", () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const jobs = [makeJob({ dateFound: old })];
    expect(filterJobs(jobs)).toHaveLength(0);
  });

  test("applies all filters together on a mixed list", () => {
    const jobs = [
      makeJob({ title: "Software Engineer", location: "Remote" }), // pass
      makeJob({ title: "Sales Rep", requiredSkills: "" }), // fail: irrelevant
      makeJob({ location: "Bangalore, India" }), // fail: excluded location
      makeJob({
        dateFound: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      }), // fail: too old
      makeJob({
        title: "Backend Developer",
        location: "US",
      }), // pass
    ];
    const result = filterJobs(jobs);
    expect(result).toHaveLength(2);
    expect(result.at(0)?.title).toBe("Software Engineer");
    expect(result.at(1)?.title).toBe("Backend Developer");
  });

  test("returns empty array when given empty input", () => {
    expect(filterJobs([])).toHaveLength(0);
  });
});
