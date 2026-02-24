import type { Job } from "../types.ts";

// ─── Keywords & Patterns ────────────────────────────────────────────

const RELEVANT_KEYWORDS: string[] = [
  "software engineer",
  "software developer",
  "backend",
  "back-end",
  "fullstack",
  "full-stack",
  "full stack",
];

/**
 * Matches "India" and its standalone ISO-alpha-2 code "IN".
 * The word-boundary anchors (\b) ensure "IN" only matches as a
 * standalone token — so "United" or "Florida" won't false-positive.
 */
const EXCLUDED_LOCATION_PATTERNS: RegExp[] = [/\bindia\b/i, /\bIN\b/];

// ─── Filter Functions ───────────────────────────────────────────────

/**
 * Returns `true` when the job title **or** required skills contain at
 * least one software-engineering keyword (case-insensitive).
 */
export function isRelevantJob(job: Job): boolean {
  const haystack = `${job.title} ${job.requiredSkills}`.toLowerCase();
  return RELEVANT_KEYWORDS.some((kw) => haystack.includes(kw));
}

/**
 * Returns `true` when the location string matches an excluded country
 * or its standalone country code.
 */
export function isExcludedLocation(location: string): boolean {
  return EXCLUDED_LOCATION_PATTERNS.some((pattern) => pattern.test(location));
}

/**
 * Returns `true` when `dateStr` falls within the last `hoursAgo` hours
 * (default 24). Accepts ISO-8601 strings and epoch-millisecond timestamps
 * (numeric strings).
 */
export function isRecentJob(dateStr: string, hoursAgo = 24): boolean {
  let date: Date;

  const asNumber = Number(dateStr);
  if (!Number.isNaN(asNumber) && dateStr.trim() !== "") {
    // Epoch seconds (10 digits) vs milliseconds (13 digits)
    date = new Date(asNumber < 1e12 ? asNumber * 1000 : asNumber);
  } else {
    date = new Date(dateStr);
  }

  if (Number.isNaN(date.getTime())) return false;

  const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
}

/**
 * Applies every filter in sequence:
 *  1. Keep only relevant engineering jobs
 *  2. Exclude unwanted locations
 *  3. Keep only recent postings
 */
export function filterJobs(jobs: Job[]): Job[] {
  return jobs.filter(
    (job) => isRelevantJob(job) && !isExcludedLocation(job.location) && isRecentJob(job.dateFound),
  );
}
