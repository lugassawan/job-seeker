import type { CrawlResult } from "../types.ts";
import { BaseCrawler } from "./base.ts";

const API_URL = "https://careers.blibli.com/ext/api";

interface BlibliJob {
  jobCode: string;
  jobName: string;
  companyCode: string;
  companyName: string;
  employmentType: string;
  location: string;
  department: string;
  experience: string;
  jobSummary: string;
  postingStatus: boolean;
  recruitmentStatus: string;
}

interface BlibliJobDetail {
  jobCode: string;
  jobName: string;
  postingDate: string;
  applyJobLink: string;
  jobSummary: string;
  companyName: string;
  location: string;
  department: string;
}

interface BlibliApiResponse<T> {
  responseObject: T;
  status: { code: number; desc: string };
}

export class BlibliCrawler extends BaseCrawler {
  source = "Blibli" as const;
  name = "Blibli";

  async crawl(): Promise<CrawlResult> {
    const jobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    try {
      const response = await fetch(`${API_URL}/job/search`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": this.userAgent,
        },
        body: "{}",
      });

      if (!response.ok) {
        throw new Error(`Blibli API responded with status ${response.status}`);
      }

      const { responseObject: data } = (await response.json()) as BlibliApiResponse<BlibliJob[]>;

      // Filter for engineering department before fetching details
      const engineeringJobs = data.filter((job) => this.isEngineeringDepartment(job.department));

      for (const item of engineeringJobs) {
        try {
          const detail = await this.fetchDetail(item.jobCode);

          const slug = item.jobName.toLowerCase().replaceAll(/\s+/g, "-");
          const rawDescription = this.stripHtml(detail.jobSummary || item.jobSummary);

          const enriched = this.enrichJob({
            dateFound: this.todayISO(),
            title: item.jobName,
            company: item.companyName || "Blibli",
            location: item.location || "Jakarta, Indonesia",
            url: `https://careers.blibli.com/job-detail/${slug}?job=${item.jobCode}`,
            salary: "",
            description: this.truncateDescription(rawDescription),
            source: "Blibli",
            rawDescription,
          });

          jobs.push(enriched);
        } catch {
          // Skip individual job detail failures
        }
      }

      this.log(
        `Found ${jobs.length} jobs (${engineeringJobs.length} engineering out of ${data.length} total)`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Blibli crawl failed: ${message}`);
      this.log(`Error: ${message}`);
    }

    return { source: "Blibli", jobs, errors };
  }

  private async fetchDetail(jobCode: string): Promise<BlibliJobDetail> {
    const response = await fetch(`${API_URL}/job/${jobCode}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Blibli detail API responded with status ${response.status}`);
    }

    const { responseObject } = (await response.json()) as BlibliApiResponse<BlibliJobDetail>;
    return responseObject;
  }
}
