import { describe, expect, test } from "bun:test";
import type { Job } from "../types.ts";
import { computeHash, computeHashesFromRows, deduplicateJobs } from "../utils/dedup.ts";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    dateFound: "2026-02-24",
    title: "Software Engineer",
    company: "Acme Corp",
    location: "Remote",
    url: "https://acme.com/jobs/123",
    salary: "$120k",
    description: "Build things",
    requiredSkills: "TypeScript",
    experienceLevel: "Mid",
    companySize: "50-200",
    source: "Remotive",
    status: "New",
    notes: "",
    ...overrides,
  };
}

describe("computeHash", () => {
  test("produces a consistent hex hash", () => {
    const hash1 = computeHash("Acme Corp", "Software Engineer", "https://acme.com/jobs/123");
    const hash2 = computeHash("Acme Corp", "Software Engineer", "https://acme.com/jobs/123");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{32}$/);
  });

  test("is case-insensitive", () => {
    const hash1 = computeHash("Acme Corp", "Software Engineer", "https://acme.com/jobs/123");
    const hash2 = computeHash("acme corp", "software engineer", "https://ACME.com/JOBS/123");
    expect(hash1).toBe(hash2);
  });

  test("normalizes trailing slashes on URLs", () => {
    const hashNoSlash = computeHash("Acme", "Dev", "https://acme.com/jobs/1");
    const hashOneSlash = computeHash("Acme", "Dev", "https://acme.com/jobs/1/");
    const hashMultiSlash = computeHash("Acme", "Dev", "https://acme.com/jobs/1///");
    expect(hashNoSlash).toBe(hashOneSlash);
    expect(hashNoSlash).toBe(hashMultiSlash);
  });

  test("produces different hashes for different inputs", () => {
    const hash1 = computeHash("Acme", "Dev", "https://acme.com/1");
    const hash2 = computeHash("Acme", "Dev", "https://acme.com/2");
    expect(hash1).not.toBe(hash2);
  });
});

describe("deduplicateJobs", () => {
  test("removes duplicates that exist in existingHashes", () => {
    const existingJob = makeJob();
    const existingHash = computeHash(existingJob.company, existingJob.title, existingJob.url);
    const existingHashes = new Set([existingHash]);

    const newJobs = [
      existingJob,
      makeJob({ title: "Backend Engineer", url: "https://acme.com/jobs/456" }),
    ];

    const result = deduplicateJobs(newJobs, existingHashes);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.title).toBe("Backend Engineer");
  });

  test("removes duplicates within the same batch (first occurrence wins)", () => {
    const job1 = makeJob({ notes: "first" });
    const job2 = makeJob({ notes: "second" }); // same company/title/url, different notes

    const result = deduplicateJobs([job1, job2], new Set());
    expect(result).toHaveLength(1);
    expect(result.at(0)?.notes).toBe("first");
  });

  test("returns all jobs when there are no duplicates", () => {
    const jobs = [
      makeJob({ title: "Frontend Engineer", url: "https://acme.com/fe" }),
      makeJob({ title: "Backend Engineer", url: "https://acme.com/be" }),
      makeJob({ title: "DevOps Engineer", url: "https://acme.com/devops" }),
    ];

    const result = deduplicateJobs(jobs, new Set());
    expect(result).toHaveLength(3);
  });

  test("returns empty array when all jobs are duplicates", () => {
    const job = makeJob();
    const hash = computeHash(job.company, job.title, job.url);

    const result = deduplicateJobs([job], new Set([hash]));
    expect(result).toHaveLength(0);
  });
});

describe("computeHashesFromRows", () => {
  test("correctly computes hashes from row arrays", () => {
    const rows = [
      [
        "2026-02-24",
        "Software Engineer",
        "Acme Corp",
        "Remote",
        "https://acme.com/jobs/123",
        "$120k",
      ],
      ["2026-02-24", "Backend Engineer", "Beta Inc", "NYC", "https://beta.com/jobs/456", "$130k"],
    ];

    const hashes = computeHashesFromRows(rows);
    expect(hashes.size).toBe(2);

    // Verify the hashes match what computeHash would produce directly
    const expectedHash1 = computeHash(
      "Acme Corp",
      "Software Engineer",
      "https://acme.com/jobs/123",
    );
    const expectedHash2 = computeHash("Beta Inc", "Backend Engineer", "https://beta.com/jobs/456");
    expect(hashes.has(expectedHash1)).toBe(true);
    expect(hashes.has(expectedHash2)).toBe(true);
  });

  test("handles rows with missing columns gracefully", () => {
    const rows = [
      ["2026-02-24", "Engineer"], // missing company (index 2) and url (index 4)
    ];

    // Should not throw; missing columns default to ""
    const hashes = computeHashesFromRows(rows);
    expect(hashes.size).toBe(1);

    const expectedHash = computeHash("", "Engineer", "");
    expect(hashes.has(expectedHash)).toBe(true);
  });

  test("returns an empty set for empty input", () => {
    const hashes = computeHashesFromRows([]);
    expect(hashes.size).toBe(0);
  });

  test("deduplicates identical rows", () => {
    const row = ["2026-02-24", "Dev", "Acme", "Remote", "https://acme.com/1", "$100k"];
    const hashes = computeHashesFromRows([row, row]);
    expect(hashes.size).toBe(1);
  });
});
