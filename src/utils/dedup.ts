import type { Job } from "../types.ts";

/**
 * Creates an MD5 hash from the normalized combination of company, title, and URL.
 * Format: lowercase(company) | lowercase(title) | lowercase(url_without_trailing_slash)
 */
export function computeHash(company: string, title: string, url: string): string {
  const normalizedUrl = url.replaceAll(/\/+$/g, "").toLowerCase();
  const input = `${company.toLowerCase()}|${title.toLowerCase()}|${normalizedUrl}`;

  const hasher = new Bun.CryptoHasher("md5");
  hasher.update(input);
  return hasher.digest("hex");
}

/**
 * Filters out jobs whose hash already exists in `existingHashes`, and also
 * deduplicates within the batch itself (first occurrence wins).
 */
export function deduplicateJobs(newJobs: Job[], existingHashes: Set<string>): Job[] {
  const seen = new Set<string>(existingHashes);
  const unique: Job[] = [];

  for (const job of newJobs) {
    const hash = computeHash(job.company, job.title, job.url);
    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(job);
    }
  }

  return unique;
}

/**
 * Takes sheet rows (where company is index 2, title is index 1, url is index 4)
 * and returns a Set of MD5 hashes.
 */
export function computeHashesFromRows(rows: string[][]): Set<string> {
  const hashes = new Set<string>();

  for (const row of rows) {
    const title = row[1] ?? "";
    const company = row[2] ?? "";
    const url = row[4] ?? "";
    hashes.add(computeHash(company, title, url));
  }

  return hashes;
}
