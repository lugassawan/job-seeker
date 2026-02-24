import type { CrawlResult, JapanDevHit, JapanDevResponse } from "../types.ts";
import { BaseCrawler } from "./base.ts";

const ALGOLIA_APP_ID = "8S3J8C7YSA";
const ALGOLIA_API_KEY = "9ebc037e3e423ff4aa80a065944a2b5b";
const ALGOLIA_INDEX = "Job_production";
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`;

export class JapanDevCrawler extends BaseCrawler {
  source = "JapanDev" as const;
  name = "JapanDev";

  async crawl(): Promise<CrawlResult> {
    const jobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    try {
      const body = JSON.stringify({
        requests: [
          {
            indexName: ALGOLIA_INDEX,
            params: [
              "hitsPerPage=100",
              `facetFilters=${JSON.stringify([
                "remote_level:remote_level_full_worldwide",
                "job_type_names:Engineering",
              ])}`,
            ].join("&"),
          },
        ],
      });

      const response = await fetch(ALGOLIA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Algolia-API-Key": ALGOLIA_API_KEY,
          "X-Algolia-Application-Id": ALGOLIA_APP_ID,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`JapanDev Algolia API responded with status ${response.status}`);
      }

      const data = (await response.json()) as JapanDevResponse;
      const hits = data.results.at(0)?.hits ?? [];

      const recentHits = hits.filter((hit) => this.isWithinHours(hit.published_at, 24));

      for (const hit of recentHits) {
        const enriched = this.enrichJob({
          dateFound: this.todayISO(),
          title: hit.title,
          company: hit.company_name,
          location: hit.location || "Remote",
          url: this.buildJobUrl(hit),
          salary: this.formatSalary(hit.salary_min, hit.salary_max, "JPY", "year"),
          description: hit.skill_names.join(", "),
          source: "JapanDev",
          rawDescription: hit.skill_names.join(", "),
        });

        // Override with JapanDev's own seniority and skills data
        const job = {
          ...enriched,
          requiredSkills: hit.skill_names.join(", "),
          experienceLevel: this.mapSeniorityLevel(hit.seniority_level),
        };

        jobs.push(job);
      }

      this.log(`Found ${jobs.length} jobs`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`JapanDev crawl failed: ${message}`);
      this.log(`Error: ${message}`);
    }

    return { source: "JapanDev", jobs, errors };
  }

  private buildJobUrl(hit: JapanDevHit): string {
    if (hit.application_url) {
      return hit.application_url;
    }
    return `https://japan-dev.com/jobs/${hit.company.slug}/${hit.slug}`;
  }

  private mapSeniorityLevel(level: string): string {
    const normalized = level.toLowerCase();
    if (normalized.includes("senior") || normalized.includes("lead")) {
      return "Senior";
    }
    if (normalized.includes("mid")) {
      return "Mid";
    }
    if (
      normalized.includes("junior") ||
      normalized.includes("entry") ||
      normalized.includes("intern")
    ) {
      return "Entry";
    }
    return "Mid";
  }
}
