import { COMPANY_WATCHLIST } from "../config/companies.ts";
import type {
  AshbyResponse,
  CompanyConfig,
  CrawlResult,
  GreenhouseResponse,
  Job,
  JobSource,
  LeverJob,
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
