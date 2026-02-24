import type { CrawlResult } from "../types.ts";
import { BaseCrawler } from "./base.ts";

const API_URL = "https://www-cms.bankneo.co.id/api/job-vacancy";

interface BankNeoResponse {
  message: string;
  code: number;
  datas: BankNeoJob[];
}

interface BankNeoJob {
  id: string;
  title: string;
  slug: string;
  position: string;
  location: string;
  type: string;
  created_at: string;
}

export class BankNeoCrawler extends BaseCrawler {
  source = "BankNeo" as const;
  name = "BankNeo";

  async crawl(): Promise<CrawlResult> {
    const jobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    try {
      const response = await fetch(`${API_URL}?limit=100`, {
        headers: {
          lang: "en",
          "User-Agent": this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`BankNeo API responded with status ${response.status}`);
      }

      const data = (await response.json()) as BankNeoResponse;

      for (const item of data.datas) {
        const enriched = this.enrichJob({
          dateFound: this.todayISO(),
          title: item.title,
          company: "Bank Neo Commerce",
          location: item.location || "Jakarta, Indonesia",
          url: `https://www.bankneocommerce.co.id/en/careers/${item.slug}`,
          salary: "",
          description: item.title,
          source: "BankNeo",
          rawDescription: item.title,
        });

        jobs.push(enriched);
      }

      this.log(`Found ${jobs.length} jobs (${data.datas.length} total)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`BankNeo crawl failed: ${message}`);
      this.log(`Error: ${message}`);
    }

    return { source: "BankNeo", jobs, errors };
  }
}
