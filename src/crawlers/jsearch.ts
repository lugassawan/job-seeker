import { SEARCH_QUERIES } from "../config/search.ts";
import type { CrawlResult, JSearchJob, JSearchResponse } from "../types.ts";
import { BaseCrawler } from "./base.ts";

export class JSearchCrawler extends BaseCrawler {
  source = "JSearch" as const;
  name = "JSearch";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    super();
    if (!apiKey) {
      throw new Error("JSearch API key is required");
    }
    this.apiKey = apiKey;
  }

  async crawl(): Promise<CrawlResult> {
    const allJobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    for (const query of SEARCH_QUERIES) {
      try {
        const params = new URLSearchParams({
          query,
          date_posted: "today",
          num_pages: "1",
        });

        const response = await fetch(
          `https://api.openwebninja.com/jsearch/search?${params.toString()}`,
          {
            headers: {
              "x-api-key": this.apiKey,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `JSearch API responded with status ${response.status} for query "${query}"`,
          );
        }

        const json = (await response.json()) as JSearchResponse;

        const recentJobs = (json.data || []).filter((job) =>
          this.isWithinHours(job.job_posted_at_datetime_utc, this.maxJobAgeHours),
        );

        for (const job of recentJobs) {
          const location = this.buildLocation(job);

          const description = job.job_description ?? "";
          const enriched = this.enrichJob({
            dateFound: this.todayISO(),
            title: job.job_title,
            company: job.employer_name,
            location,
            url: job.job_apply_link,
            salary: this.formatSalary(
              job.job_min_salary,
              job.job_max_salary,
              job.job_salary_currency,
              job.job_salary_period,
            ),
            description: this.truncateDescription(description),
            source: "JSearch",
            rawDescription: description,
            employerType: job.employer_company_type,
          });

          allJobs.push(enriched);
        }

        this.log(`Query "${query}": found ${recentJobs.length} jobs`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`JSearch query "${query}" failed: ${message}`);
        this.log(`Error for query "${query}": ${message}`);
      }
    }

    this.log(`Total: ${allJobs.length} jobs from ${SEARCH_QUERIES.length} queries`);

    return { source: "JSearch", jobs: allJobs, errors };
  }

  private buildLocation(job: JSearchJob): string {
    const parts = [job.job_city, job.job_state, job.job_country].filter(
      (part) => part && part.trim() !== "",
    );

    const locationStr = parts.join(", ");

    if (job.job_is_remote) {
      return locationStr ? `Remote - ${locationStr}` : "Remote";
    }

    return locationStr || "Unknown";
  }
}
