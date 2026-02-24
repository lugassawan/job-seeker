import type { CrawlResult, RemoteOKJob } from "../types.ts";
import { BaseCrawler } from "./base.ts";

export class RemoteOKCrawler extends BaseCrawler {
  source = "RemoteOK" as const;
  name = "RemoteOK";

  async crawl(): Promise<CrawlResult> {
    const jobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    try {
      const response = await fetch("https://remoteok.com/api", {
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`RemoteOK API responded with status ${response.status}`);
      }

      const data = (await response.json()) as [unknown, ...RemoteOKJob[]];

      // First element is a legal notice object — skip it
      const listings = data.slice(1) as RemoteOKJob[];

      const recentListings = listings.filter((job) => this.isWithinHours(job.date, 24));

      for (const job of recentListings) {
        const enriched = this.enrichJob({
          dateFound: this.todayISO(),
          title: job.position,
          company: job.company,
          location: job.location || "Remote",
          url: job.url.startsWith("http") ? job.url : `https://remoteok.com${job.url}`,
          salary: this.formatSalary(job.salary_min, job.salary_max, "USD", "year"),
          description: this.truncateDescription(job.description),
          source: "RemoteOK",
          rawDescription: this.stripHtml(job.description),
        });

        jobs.push(enriched);
      }

      this.log(`Found ${jobs.length} jobs`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`RemoteOK crawl failed: ${message}`);
      this.log(`Error: ${message}`);
    }

    return { source: "RemoteOK", jobs, errors };
  }
}
