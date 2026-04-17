import { COMPANY_WATCHLIST } from "../config/companies.ts";
import type {
  AshbyResponse,
  BambooHRDetailResponse,
  BambooHRJob,
  BambooHRJobDetail,
  BambooHRListResponse,
  CompanyConfig,
  CrawlResult,
  GreenhouseResponse,
  Job,
  JobSource,
  LeverJob,
  SmartRecruitersJob,
  SmartRecruitersJobDetail,
  SmartRecruitersResponse,
  TeamtailorDetailResponse,
  TeamtailorListResponse,
  WordPressJob,
  WorkableJob,
  WorkableJobDetail,
  WorkableResponse,
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

    const maxHours = company.maxJobAgeHours ?? this.maxJobAgeHours;
    const filtered = data.jobs.filter((job) => {
      const isEngineering = job.departments.some((dept) => this.isEngineeringDepartment(dept.name));
      const isRecent = maxHours === 0 || this.isWithinHours(job.updated_at, maxHours);
      return isEngineering && isRecent;
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

    const maxHours = company.maxJobAgeHours ?? this.maxJobAgeHours;
    const filtered = data.filter((job) => {
      const isEngineering =
        this.isEngineeringDepartment(job.categories.department || "") ||
        this.isEngineeringDepartment(job.categories.team || "");
      const isRecent = maxHours === 0 || this.isWithinHours(String(job.createdAt), maxHours);
      return isEngineering && isRecent;
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

    const maxHours = company.maxJobAgeHours ?? this.maxJobAgeHours;
    const filtered = data.jobs.filter((job) => {
      const isEngineering = this.isEngineeringDepartment(job.departmentName || "");
      const isRecent = maxHours === 0 || this.isWithinHours(job.publishedAt, maxHours);
      return isEngineering && isRecent;
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

    const maxHours = company.maxJobAgeHours ?? this.maxJobAgeHours;
    const filtered = unique.filter((job) => {
      const isEngineering = this.isEngineeringDepartment(job.department || "");
      const isRecent = maxHours === 0 || this.isWithinHours(job.published_on, maxHours);
      return isEngineering && isRecent;
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

    const maxHours = company.maxJobAgeHours ?? this.maxJobAgeHours;
    const filtered =
      maxHours === 0 ? data : data.filter((job) => this.isWithinHours(job.modified_gmt, maxHours));

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

  private async crawlSmartRecruiters(company: CompanyConfig): Promise<Job[]> {
    const response = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${company.token}/postings?limit=100`,
      { headers: { "User-Agent": this.userAgent } },
    );

    if (!response.ok) {
      throw new Error(
        `SmartRecruiters API responded with status ${response.status} for ${company.name}`,
      );
    }

    const data = (await response.json()) as SmartRecruitersResponse;

    const maxHours = company.maxJobAgeHours ?? this.maxJobAgeHours;
    const filtered = data.content.filter((job) => {
      const isEngineering = this.isEngineeringDepartment(job.function?.label || "");
      const isRecent = maxHours === 0 || this.isWithinHours(job.releasedDate, maxHours);
      return isEngineering && isRecent;
    });

    const jobs: Job[] = [];
    for (const job of filtered) {
      const detail = await this.fetchSmartRecruitersDetail(company.token, job.id);
      const rawDescription = this.buildSmartRecruitersDescription(detail);
      const location = this.buildSmartRecruitersLocation(job);

      const enriched = this.enrichJob({
        dateFound: this.todayISO(),
        title: job.name,
        company: company.name,
        location,
        url: detail.postingUrl || `https://jobs.smartrecruiters.com/${company.token}/${job.id}`,
        salary: this.formatSmartRecruitersCompensation(detail),
        description: this.truncateDescription(rawDescription),
        source: "SmartRecruiters",
        rawDescription,
        employerType: null,
      });

      if (job.experienceLevel?.label) {
        enriched.experienceLevel = this.mapSmartRecruitersExperience(job.experienceLevel.label);
      }
      enriched.companySize = company.size || "";
      jobs.push(enriched);
    }

    return jobs;
  }

  private async fetchSmartRecruitersDetail(
    token: string,
    jobId: string,
  ): Promise<SmartRecruitersJobDetail> {
    const response = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${token}/postings/${jobId}`,
      { headers: { "User-Agent": this.userAgent } },
    );

    if (!response.ok) {
      throw new Error(`SmartRecruiters detail API responded with status ${response.status}`);
    }

    return (await response.json()) as SmartRecruitersJobDetail;
  }

  private buildSmartRecruitersDescription(detail: SmartRecruitersJobDetail): string {
    const sections = detail.jobAd?.sections;
    if (!sections) return "";
    const parts = [
      sections.jobDescription?.text,
      sections.qualifications?.text,
      sections.additionalInformation?.text,
    ].filter(Boolean);
    return this.stripHtml(parts.join(" "));
  }

  private buildSmartRecruitersLocation(job: SmartRecruitersJob): string {
    const parts: string[] = [];
    if (job.location?.city) parts.push(job.location.city);
    if (job.location?.country) parts.push(job.location.country);
    const locationStr = parts.join(", ");

    if (job.location?.remote) {
      return locationStr ? `Remote - ${locationStr}` : "Remote";
    }
    if (job.location?.hybrid) {
      return locationStr ? `Hybrid - ${locationStr}` : "Hybrid";
    }
    return locationStr || "Remote";
  }

  private formatSmartRecruitersCompensation(detail: SmartRecruitersJobDetail): string {
    const comp = detail.compensation;
    if (!comp) return "";
    const period = comp.period?.toLowerCase().replace("ly", "") || "";
    return this.formatSalary(comp.min, comp.max, comp.currency, period);
  }

  private mapSmartRecruitersExperience(level: string): string {
    const lower = level.toLowerCase();
    if (lower.includes("director") || lower.includes("executive")) return "Lead";
    if (lower.includes("senior") || lower.includes("mid-senior")) return "Senior";
    if (lower.includes("mid")) return "Mid";
    if (lower.includes("entry") || lower.includes("intern") || lower.includes("associate"))
      return "Entry";
    return "Mid";
  }

  private async crawlTeamtailor(company: CompanyConfig): Promise<Job[]> {
    const baseUrl = `https://${company.token}/api/v2/jobs`;

    // Fetch first page to get total page count
    const firstPage = await this.fetchTeamtailorPage(baseUrl, 1);
    const pageCount = firstPage.meta["page-count"];

    // Fetch remaining pages concurrently
    const pagePromises: Promise<TeamtailorListResponse>[] = [];
    for (let page = 2; page <= pageCount; page++) {
      pagePromises.push(this.fetchTeamtailorPage(baseUrl, page));
    }
    const remainingPages = await Promise.all(pagePromises);

    const allJobs = [...firstPage.data, ...remainingPages.flatMap((p) => p.data)];

    const filtered = allJobs.filter((job) => this.isEngineeringDepartment(job.department));

    const jobs: Job[] = [];
    for (const job of filtered) {
      let description = "";
      let rawDescription = "";
      try {
        const detail = await this.fetchTeamtailorDetail(baseUrl, job.id);
        rawDescription = this.stripHtml(detail.description);
        description = this.truncateDescription(detail.description);
      } catch {
        description = job.title;
        rawDescription = job.title;
      }

      const location = [job.city, job.region].filter(Boolean).join(", ") || "Remote";

      const enriched = this.enrichJob({
        dateFound: this.todayISO(),
        title: job.title,
        company: company.name,
        location,
        url: `https://${company.token}/jobs/${job.id}`,
        salary: job.salary || "",
        description,
        source: "Teamtailor",
        rawDescription,
        employerType: null,
      });
      enriched.companySize = company.size || "";
      jobs.push(enriched);
    }

    return jobs;
  }

  private async fetchTeamtailorPage(
    baseUrl: string,
    page: number,
  ): Promise<TeamtailorListResponse> {
    const response = await fetch(`${baseUrl}?page=${page}`, {
      headers: { Accept: "application/json", "User-Agent": this.userAgent },
    });

    if (!response.ok) {
      throw new Error(`Teamtailor API responded with status ${response.status}`);
    }

    return (await response.json()) as TeamtailorListResponse;
  }

  private async fetchTeamtailorDetail(
    baseUrl: string,
    jobId: string,
  ): Promise<TeamtailorDetailResponse["data"]> {
    const response = await fetch(`${baseUrl}/${jobId}`, {
      headers: { Accept: "application/json", "User-Agent": this.userAgent },
    });

    if (!response.ok) {
      throw new Error(`Teamtailor detail API responded with status ${response.status}`);
    }

    const json = (await response.json()) as TeamtailorDetailResponse;
    return json.data;
  }

  private async crawlBambooHR(company: CompanyConfig): Promise<Job[]> {
    const response = await fetch(`https://${company.token}.bamboohr.com/careers/list`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`BambooHR API responded with status ${response.status} for ${company.name}`);
    }

    const data = (await response.json()) as BambooHRListResponse;

    // BambooHR list items carry no publish date, so the age filter is always skipped.
    const filtered = data.result.filter((job) =>
      this.isEngineeringDepartment(job.departmentLabel || ""),
    );

    const jobs: Job[] = [];
    for (const job of filtered) {
      let description = job.jobOpeningName;
      let rawDescription = job.jobOpeningName;
      let url = `https://${company.token}.bamboohr.com/careers/${job.id}`;

      try {
        const detail = await this.fetchBambooHRDetail(company.token, job.id);
        rawDescription = this.stripHtml(detail.description);
        description = this.truncateDescription(detail.description);
        if (detail.jobOpeningShareUrl) url = detail.jobOpeningShareUrl;
      } catch {
        // Fall back to title-only if detail fetch fails
      }

      const enriched = this.enrichJob({
        dateFound: this.todayISO(),
        title: job.jobOpeningName,
        company: company.name,
        location: this.buildBambooHRLocation(job),
        url,
        salary: "",
        description,
        source: "BambooHR",
        rawDescription,
        employerType: null,
      });
      enriched.companySize = company.size || "";
      jobs.push(enriched);
    }

    return jobs;
  }

  private async fetchBambooHRDetail(token: string, id: string): Promise<BambooHRJobDetail> {
    const response = await fetch(`https://${token}.bamboohr.com/careers/${id}/detail`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`BambooHR detail API responded with status ${response.status}`);
    }

    const json = (await response.json()) as BambooHRDetailResponse;
    return json.result.jobOpening;
  }

  private buildBambooHRLocation(job: BambooHRJob): string {
    const ats = job.atsLocation;
    if (ats?.country) {
      return [ats.city, ats.state ?? ats.province, ats.country].filter(Boolean).join(", ");
    }
    const parts = [job.location?.city, job.location?.state].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    return job.isRemote ? "Remote" : "";
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
          case "smartrecruiters":
            companyJobs = await this.crawlSmartRecruiters(company);
            break;
          case "teamtailor":
            companyJobs = await this.crawlTeamtailor(company);
            break;
          case "bamboohr":
            companyJobs = await this.crawlBambooHR(company);
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
