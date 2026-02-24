import type { CrawlResult } from "../types.ts";
import { BaseCrawler } from "./base.ts";

const RSS_URL = "https://weworkremotely.com/categories/remote-programming-jobs.rss";

export class WeWorkRemotelyCrawler extends BaseCrawler {
  source = "WeWorkRemotely" as const;
  name = "WeWorkRemotely";

  async crawl(): Promise<CrawlResult> {
    const jobs: CrawlResult["jobs"] = [];
    const errors: string[] = [];

    try {
      const response = await fetch(RSS_URL, {
        headers: { "User-Agent": this.userAgent },
      });

      if (!response.ok) {
        throw new Error(`WeWorkRemotely RSS responded with status ${response.status}`);
      }

      const xml = await response.text();
      const items = this.parseItems(xml);

      for (const item of items) {
        if (!this.isWithinHours(item.pubDate, this.maxJobAgeHours)) {
          continue;
        }

        const { company, title } = this.splitTitle(item.title);
        const description = this.stripHtml(item.description);

        const enriched = this.enrichJob({
          dateFound: this.todayISO(),
          title,
          company,
          location: "Remote",
          url: item.link,
          salary: "",
          description: this.truncateDescription(description),
          source: "WeWorkRemotely",
          rawDescription: description,
        });

        jobs.push(enriched);
      }

      this.log(`Found ${jobs.length} jobs`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`WeWorkRemotely crawl failed: ${message}`);
      this.log(`Error: ${message}`);
    }

    return { source: "WeWorkRemotely", jobs, errors };
  }

  private parseItems(
    xml: string,
  ): { title: string; link: string; pubDate: string; description: string }[] {
    const items: { title: string; link: string; pubDate: string; description: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;

    let match = itemRegex.exec(xml);
    while (match) {
      const block = match[1] ?? "";
      const title = this.extractTag(block, "title");
      const link = this.extractTag(block, "link");
      const pubDate = this.extractTag(block, "pubDate");
      const description = this.extractTag(block, "description");

      if (title && link && pubDate) {
        items.push({ title, link, pubDate, description });
      }

      match = itemRegex.exec(xml);
    }

    return items;
  }

  private extractTag(xml: string, tag: string): string {
    // Handle both regular tags and CDATA sections
    const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`);
    const match = regex.exec(xml);
    return (match?.at(1) ?? "").trim();
  }

  private splitTitle(rawTitle: string): { company: string; title: string } {
    const colonIndex = rawTitle.indexOf(":");
    if (colonIndex === -1) {
      return { company: "", title: rawTitle.trim() };
    }
    return {
      company: rawTitle.slice(0, colonIndex).trim(),
      title: rawTitle.slice(colonIndex + 1).trim(),
    };
  }
}
