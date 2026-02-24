import type { CrawlResult } from "../types.ts";
import { BaseCrawler } from "./base.ts";

const API_URL = "https://www.techinasia.com/api/2.0/job-postings";

interface TechInAsiaJob {
  id: string;
  title: string;
  published_at: string;
  salary_min: number;
  salary_max: number;
  is_salary_visible: boolean;
  is_remote: boolean;
  work_arrangement: string;
  description: string;
  period: string;
  currency: string;
  experience_min: number;
  experience_max: number;
  job_skills: { id: string; name: string }[];
  company: {
    id: string;
    name: string;
    pitch: string;
    employee_min_count: number | null;
    employee_max_count: number | null;
  };
  city: {
    name: string;
    country: { name: string; currency: { currency_code: string } };
  };
}

interface TechInAsiaResponse {
  data: TechInAsiaJob[];
  current_page: number;
  last_page: number;
  total: number;
}

export class TechInAsiaCrawler extends BaseCrawler {
  source = "TechInAsia" as const;
  name = "TechInAsia";

  async crawl(): Promise<CrawlResult> {
    const jobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    try {
      const params = new URLSearchParams({
        page: "1",
        per_page: "50",
        "country_name[]": "Indonesia",
        "job_category[]": "engineering",
      });

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "job-seeker-bot/1.0",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        throw new Error(`TechInAsia API responded with status ${response.status}`);
      }

      const data = (await response.json()) as TechInAsiaResponse;

      for (const item of data.data) {
        if (!this.isWithinHours(item.published_at, 24)) {
          continue;
        }

        const currency = item.city?.country?.currency?.currency_code ?? "IDR";
        const skills = item.job_skills.map((s) => s.name).join(", ");
        const location = this.buildLocation(item);

        const enriched = this.enrichJob({
          dateFound: this.todayISO(),
          title: item.title,
          company: item.company.name,
          location,
          url: `https://www.techinasia.com/jobs/${item.id}`,
          salary: this.formatSalary(
            item.salary_min,
            item.salary_max,
            currency,
            item.period?.toLowerCase(),
          ),
          description: this.truncateDescription(item.description),
          source: "TechInAsia",
          rawDescription: this.stripHtml(item.description),
        });

        if (skills) {
          enriched.requiredSkills = skills;
        }

        enriched.companySize = this.inferCompanySizeFromCount(
          item.company.employee_min_count,
          item.company.employee_max_count,
        );

        jobs.push(enriched);
      }

      this.log(`Found ${jobs.length} jobs (total available: ${data.total})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`TechInAsia crawl failed: ${message}`);
      this.log(`Error: ${message}`);
    }

    return { source: "TechInAsia", jobs, errors };
  }

  private buildLocation(item: TechInAsiaJob): string {
    const parts: string[] = [];
    if (item.city?.name) parts.push(item.city.name);
    if (item.city?.country?.name) parts.push(item.city.country.name);
    const locationStr = parts.join(", ");

    if (item.is_remote) {
      return locationStr ? `Remote - ${locationStr}` : "Remote";
    }
    if (item.work_arrangement === "hybrid") {
      return locationStr ? `Hybrid - ${locationStr}` : "Hybrid";
    }
    return locationStr || "Indonesia";
  }

  private inferCompanySizeFromCount(min: number | null, max: number | null): string {
    const count = max ?? min;
    if (count == null) return "";
    if (count <= 50) return "Startup";
    if (count <= 500) return "Mid-size";
    return "Enterprise";
  }
}
