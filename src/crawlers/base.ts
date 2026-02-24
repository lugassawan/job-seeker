import type { CrawlResult, Job, JobSource } from "../types.ts";
import { extractSkillsAsString } from "../utils/skills.ts";

export abstract class BaseCrawler {
  abstract source: JobSource;
  abstract name: string;

  abstract crawl(): Promise<CrawlResult>;

  protected stripHtml(html: string): string {
    return html
      .replaceAll(/<[^>]*>/g, "")
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&nbsp;", " ")
      .replaceAll(/\s+/g, " ")
      .trim();
  }

  protected truncateDescription(text: string, maxLength = 200): string {
    const stripped = this.stripHtml(text);
    if (stripped.length <= maxLength) {
      return stripped;
    }
    return `${stripped.slice(0, maxLength)}...`;
  }

  protected formatSalary(
    min?: number | null,
    max?: number | null,
    currency?: string | null,
    period?: string | null,
  ): string {
    const minVal = min != null && min !== 0 ? min : undefined;
    const maxVal = max != null && max !== 0 ? max : undefined;

    if (minVal === undefined && maxVal === undefined) {
      return "";
    }

    const currencyCode = currency || "USD";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    });

    const periodSuffix = period ? `/${period}` : "";

    if (minVal !== undefined && maxVal !== undefined) {
      return `${formatter.format(minVal)} - ${formatter.format(maxVal)}${periodSuffix}`;
    }

    const singleVal = minVal ?? maxVal;
    if (singleVal === undefined) {
      return "";
    }

    return `${formatter.format(singleVal)}${periodSuffix}`;
  }

  protected inferExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();

    if (/\b(lead|staff|principal|architect)\b/i.test(`${title} ${description}`)) {
      return "Lead";
    }

    if (/\b(senior)\b/.test(text) || /\bsr[.\s]/i.test(`${title} ${description}`)) {
      return "Senior";
    }

    if (
      /\b(mid|middle)\b/.test(text) ||
      /\bII\b/.test(`${title} ${description}`) ||
      /\b2\b/.test(text)
    ) {
      return "Mid";
    }

    if (
      /\b(junior|entry|associate|graduate)\b/.test(text) ||
      /\bjr[.\s]/i.test(`${title} ${description}`) ||
      /\bI\b/.test(`${title} ${description}`) ||
      /\b1\b/.test(text)
    ) {
      return "Entry";
    }

    return "Mid";
  }

  protected inferCompanySize(employerType?: string | null): string {
    if (!employerType) {
      return "";
    }

    const type = employerType.toLowerCase();

    if (type.includes("startup") || type.includes("small") || type.includes("early")) {
      return "Startup";
    }

    if (type.includes("mid") || type.includes("medium") || type.includes("growth")) {
      return "Mid-size";
    }

    if (
      type.includes("enterprise") ||
      type.includes("large") ||
      type.includes("corporation") ||
      type.includes("corporate") ||
      type.includes("fortune")
    ) {
      return "Enterprise";
    }

    return "";
  }

  protected enrichJob(
    partial: Omit<
      Job,
      "requiredSkills" | "experienceLevel" | "companySize" | "status" | "notes"
    > & { rawDescription?: string; employerType?: string | null },
  ): Job {
    const { rawDescription, employerType, ...jobFields } = partial;
    const textForAnalysis = rawDescription || jobFields.description;

    return {
      ...jobFields,
      requiredSkills: extractSkillsAsString(textForAnalysis),
      experienceLevel: this.inferExperienceLevel(jobFields.title, textForAnalysis),
      companySize: this.inferCompanySize(employerType),
      status: "New",
      notes: "",
    };
  }

  protected todayISO(): string {
    const [date] = new Date().toISOString().split("T");
    return date ?? "";
  }

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected isWithinHours(dateStr: string, hours = 24): boolean {
    const now = Date.now();
    let timestamp: number;

    const parsed = Number(dateStr);
    if (!Number.isNaN(parsed) && /^\d+$/.test(dateStr.trim())) {
      // Epoch timestamp: detect seconds vs milliseconds
      timestamp = parsed < 1e12 ? parsed * 1000 : parsed;
    } else {
      timestamp = new Date(dateStr).getTime();
    }

    if (Number.isNaN(timestamp)) {
      return false;
    }

    const diffMs = now - timestamp;
    return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
  }
}
