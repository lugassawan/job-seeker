import type { CrawlResult, RemotiveResponse } from "../types.ts";
import { BaseCrawler } from "./base.ts";

export class RemotiveCrawler extends BaseCrawler {
  source = "Remotive" as const;
  name = "Remotive";

  async crawl(): Promise<CrawlResult> {
    const jobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    try {
      const response = await fetch(
        "https://remotive.com/api/remote-jobs?category=software-dev&limit=50",
      );

      if (!response.ok) {
        throw new Error(`Remotive API responded with status ${response.status}`);
      }

      const data = (await response.json()) as RemotiveResponse;

      const recentJobs = data.jobs.filter((job) => this.isWithinHours(job.publication_date, 24));

      for (const job of recentJobs) {
        const enriched = this.enrichJob({
          dateFound: this.todayISO(),
          title: job.title,
          company: job.company_name,
          location: job.candidate_required_location || "Remote",
          url: job.url,
          salary: job.salary || "",
          description: this.truncateDescription(job.description),
          source: "Remotive",
          rawDescription: this.stripHtml(job.description),
        });

        jobs.push(enriched);
      }

      this.log(`Found ${jobs.length} jobs`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Remotive crawl failed: ${message}`);
      this.log(`Error: ${message}`);
    }

    return { source: "Remotive", jobs, errors };
  }
}
