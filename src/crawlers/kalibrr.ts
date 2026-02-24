import { SEARCH_QUERIES } from "../config/search.ts";
import type { CrawlResult } from "../types.ts";
import { BaseCrawler } from "./base.ts";

const API_URL = "https://www.kalibrr.com/kjs/job_board/search";

interface KalibrrJob {
  id: number;
  name: string;
  slug: string;
  company_name: string;
  company: { code: string; industry: string };
  function: string;
  description: string;
  qualifications: string;
  activation_date: string;
  created_at: string;
  google_location: {
    address_components: {
      city: string;
      country: string;
      region: string;
    };
  };
  is_work_from_home: boolean;
  is_hybrid: boolean;
  maximum_salary: number | null;
  base_salary: number | null;
  salary_currency: string | null;
  salary_interval: string | null;
  tenure: string;
  work_experience: number;
}

interface KalibrrResponse {
  count: number;
  jobs: KalibrrJob[];
}

export class KalibrrCrawler extends BaseCrawler {
  source = "Kalibrr" as const;
  name = "Kalibrr";

  async crawl(): Promise<CrawlResult> {
    const allJobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    for (const query of SEARCH_QUERIES) {
      try {
        const params = new URLSearchParams({
          limit: "50",
          offset: "0",
          keyword: query,
          country: "Indonesia",
        });

        const response = await fetch(`${API_URL}?${params.toString()}`, {
          headers: {
            Accept: "application/json",
            "User-Agent": "job-seeker-bot/1.0",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Kalibrr API responded with status ${response.status} for query "${query}"`,
          );
        }

        const data = (await response.json()) as KalibrrResponse;

        for (const item of data.jobs) {
          if (!this.isWithinHours(item.activation_date, 24)) {
            continue;
          }

          const location = this.buildLocation(item);
          const rawDescription = `${this.stripHtml(item.description)} ${this.stripHtml(item.qualifications)}`;

          const enriched = this.enrichJob({
            dateFound: this.todayISO(),
            title: item.name,
            company: item.company_name,
            location,
            url: `https://www.kalibrr.com/c/${item.company.code}/jobs/${item.id}/${item.slug}`,
            salary: this.formatSalary(
              item.base_salary,
              item.maximum_salary,
              item.salary_currency ?? "IDR",
              item.salary_interval?.toLowerCase(),
            ),
            description: this.truncateDescription(item.description),
            source: "Kalibrr",
            rawDescription,
          });

          allJobs.push(enriched);
        }

        this.log(`Query "${query}": found ${data.jobs.length} jobs (total: ${data.count})`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Kalibrr query "${query}" failed: ${message}`);
        this.log(`Error for query "${query}": ${message}`);
      }
    }

    this.log(`Total: ${allJobs.length} jobs from ${SEARCH_QUERIES.length} queries`);

    return { source: "Kalibrr", jobs: allJobs, errors };
  }

  private buildLocation(item: KalibrrJob): string {
    const loc = item.google_location?.address_components;
    const parts: string[] = [];
    if (loc?.city) parts.push(loc.city);
    if (loc?.country) parts.push(loc.country);
    const locationStr = parts.join(", ");

    if (item.is_work_from_home) {
      return locationStr ? `Remote - ${locationStr}` : "Remote";
    }
    if (item.is_hybrid) {
      return locationStr ? `Hybrid - ${locationStr}` : "Hybrid";
    }
    return locationStr || "Indonesia";
  }
}
