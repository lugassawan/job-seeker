import { COMPANY_WATCHLIST } from "../config/companies.ts";
import type {
  AshbyResponse,
  CompanyConfig,
  CrawlResult,
  GreenhouseResponse,
  Job,
  JobSource,
  LeverJob,
  WorkableJob,
  WorkableJobDetail,
  WorkableResponse,
  WordPressJob,
} from "../types.ts";
import { BaseCrawler } from "./base.ts";

export class CompanyDirectCrawler extends BaseCrawler {
  source: JobSource = "Greenhouse";
  name = "Company-Direct";
  private readonly companies: CompanyConfig[];

  constructor(companies?: CompanyConfig[]) {
    super();
    this.companies = companies ?? COMPANY_WATCHLIST;
  }

  private isEngineeringDepartment(department: string): boolean {
    const keywords = [
      "software",
      "engineering",
      "product",
      "technology",
      "development",
      "platform",
      "infrastructure",
      "developer",
      "technical",
    ];
    const lower = department.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword));
  }

  private async crawlGreenhouse(company: CompanyConfig): Promise<Job[]> {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${company.token}/jobs?content=true`,
    );

    if (!response.ok) {
      throw new Error(
        `Greenhouse API responded with status ${response.status} for ${company.name}`,
      );
    }

    const data = (await response.json()) as GreenhouseResponse;

    const filtered = data.jobs.filter((job) => {
      const isRemote = job.location.name.toLowerCase().includes("remote");
      const isEngineering = job.departments.some((dept) => this.isEngineeringDepartment(dept.name));
      const isRecent = this.isWithinHours(job.updated_at, 24);
      return isRemote && isEngineering && isRecent;
    });

    return filtered.map((job) => {
      const enriched = this.enrichJob({
        dateFound: this.todayISO(),
        title: job.title,
        company: company.name,
        location: job.location.name,
        url: job.absolute_url,
        salary: "",
        description: this.truncateDescription(job.content),
        source: "Greenhouse",
        rawDescription: this.stripHtml(job.content),
        employerType: null,
      });
      enriched.companySize = company.size || "";
      return enriched;
    });
  }

  private async crawlLever(company: CompanyConfig): Promise<Job[]> {
    const response = await fetch(`https://api.lever.co/v0/postings/${company.token}?mode=json`);

    if (!response.ok) {
      throw new Error(`Lever API responded with status ${response.status} for ${company.name}`);
    }

    const data = (await response.json()) as LeverJob[];

    const filtered = data.filter((job) => {
      const isRemote = job.categories.location.toLowerCase().includes("remote");
      const isEngineering =
        this.isEngineeringDepartment(job.categories.department || "") ||
        this.isEngineeringDepartment(job.categories.team || "");
      const isRecent = this.isWithinHours(String(job.createdAt), 24);
      return isRemote && isEngineering && isRecent;
    });

    return filtered.map((job) => {
      const enriched = this.enrichJob({
        dateFound: this.todayISO(),
        title: job.text,
        company: company.name,
        location: job.categories.location,
        url: job.hostedUrl,
        salary: "",
        description: this.truncateDescription(job.descriptionPlain),
        source: "Lever",
        rawDescription: job.descriptionPlain,
        employerType: null,
      });
      enriched.companySize = company.size || "";
      return enriched;
    });
  }

  private async crawlAshby(company: CompanyConfig): Promise<Job[]> {
    const response = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${company.token}?includeCompensation=true`,
    );

    if (!response.ok) {
      throw new Error(`Ashby API responded with status ${response.status} for ${company.name}`);
    }

    const data = (await response.json()) as AshbyResponse;

    const filtered = data.jobs.filter((job) => {
      const isRemote = job.isRemote === true;
      const isEngineering = this.isEngineeringDepartment(job.departmentName || "");
      const isRecent = this.isWithinHours(job.publishedAt, 24);
      return isRemote && isEngineering && isRecent;
    });

    return filtered.map((job) => {
      const enriched = this.enrichJob({
        dateFound: this.todayISO(),
        title: job.title,
        company: company.name,
        location: job.locationName || "Remote",
        url: job.jobUrl,
        salary: job.compensationTierSummary || "",
        description: this.truncateDescription(job.descriptionHtml),
        source: "Ashby",
        rawDescription: this.stripHtml(job.descriptionHtml),
        employerType: null,
      });
      enriched.companySize = company.size || "";
      return enriched;
    });
  }

  private async crawlWorkable(company: CompanyConfig): Promise<Job[]> {
    const response = await fetch(
      `https://apply.workable.com/api/v1/widget/accounts/${company.token}`,
    );

    if (!response.ok) {
      throw new Error(`Workable API responded with status ${response.status} for ${company.name}`);
    }

    const data = (await response.json()) as WorkableResponse;

    // Deduplicate by shortcode (same job listed for multiple locations)
    const seen = new Set<string>();
    const unique: WorkableJob[] = [];
    for (const job of data.jobs) {
      if (!seen.has(job.shortcode)) {
        seen.add(job.shortcode);
        unique.push(job);
      }
    }

    const filtered = unique.filter((job) => {
      const isRemote = job.telecommuting === true;
      const isEngineering = this.isEngineeringDepartment(job.department || "");
      const isRecent = this.isWithinHours(job.published_on, 24);
      return isRemote && isEngineering && isRecent;
    });

    // Fetch full descriptions from v2 detail endpoint
    const jobs: Job[] = [];
    for (const job of filtered) {
      let description = "";
      let rawDescription = "";
      try {
        const detail = await this.fetchWorkableDetail(company.token, job.shortcode);
        rawDescription = this.stripHtml(detail.description);
        description = this.truncateDescription(detail.description);
      } catch {
        // Fall back to title-only if detail fetch fails
        description = job.title;
        rawDescription = job.title;
      }

      const location = [job.city, job.country].filter(Boolean).join(", ") || "Remote";

      const enriched = this.enrichJob({
        dateFound: this.todayISO(),
        title: job.title,
        company: company.name,
        location,
        url: job.url,
        salary: "",
        description,
        source: "Workable",
        rawDescription,
        employerType: null,
      });

      // Use Workable's experience field if available
      if (job.experience) {
        enriched.experienceLevel = this.mapWorkableExperience(job.experience);
      }
      enriched.companySize = company.size || "";
      jobs.push(enriched);
    }

    return jobs;
  }

  private async fetchWorkableDetail(token: string, shortcode: string): Promise<WorkableJobDetail> {
    const response = await fetch(
      `https://apply.workable.com/api/v2/accounts/${token}/jobs/${shortcode}`,
    );

    if (!response.ok) {
      throw new Error(`Workable detail API responded with status ${response.status}`);
    }

    return (await response.json()) as WorkableJobDetail;
  }

  private mapWorkableExperience(experience: string): string {
    const lower = experience.toLowerCase();
    if (lower.includes("senior") || lower.includes("director") || lower.includes("executive")) {
      return "Senior";
    }
    if (lower.includes("mid")) {
      return "Mid";
    }
    if (lower.includes("entry") || lower.includes("intern") || lower.includes("associate")) {
      return "Entry";
    }
    return "Mid";
  }

  private async crawlWordPress(company: CompanyConfig): Promise<Job[]> {
    const response = await fetch(
      `https://${company.token}/wp-json/wp/v2/awsm_job_openings?per_page=100`,
    );

    if (!response.ok) {
      throw new Error(`WordPress API responded with status ${response.status} for ${company.name}`);
    }

    const data = (await response.json()) as WordPressJob[];

    const filtered = data.filter((job) => this.isWithinHours(job.modified_gmt, 24));

    return filtered.map((job) => {
      const rawContent = this.stripHtml(job.content.rendered);
      const title = this.stripHtml(job.title.rendered);

      const enriched = this.enrichJob({
        dateFound: this.todayISO(),
        title,
        company: company.name,
        location: this.extractWordPressLocation(rawContent),
        url: job.link,
        salary: "",
        description: this.truncateDescription(job.content.rendered),
        source: "WordPress",
        rawDescription: rawContent,
        employerType: null,
      });
      enriched.companySize = company.size || "";
      return enriched;
    });
  }

  private extractWordPressLocation(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes("remote")) {
      return "Remote";
    }
    return "";
  }

  async crawl(): Promise<CrawlResult> {
    const jobs: Job[] = [];
    const errors: string[] = [];

    for (const company of this.companies) {
      try {
        let companyJobs: Job[] = [];

        switch (company.platform) {
          case "greenhouse":
            companyJobs = await this.crawlGreenhouse(company);
            break;
          case "lever":
            companyJobs = await this.crawlLever(company);
            break;
          case "ashby":
            companyJobs = await this.crawlAshby(company);
            break;
          case "workable":
            companyJobs = await this.crawlWorkable(company);
            break;
          case "wordpress":
            companyJobs = await this.crawlWordPress(company);
            break;
        }

        this.log(`Found ${companyJobs.length} jobs from ${company.name}`);
        jobs.push(...companyJobs);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${company.name} crawl failed: ${message}`);
        this.log(`Error crawling ${company.name}: ${message}`);
      }
    }

    return { source: "Greenhouse", jobs, errors };
  }
}
