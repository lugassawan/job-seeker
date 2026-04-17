// ─── Core Domain Types ───────────────────────────────────────────────

export interface Job {
  dateFound: string;
  title: string;
  company: string;
  location: string;
  url: string;
  salary: string;
  description: string;
  requiredSkills: string;
  experienceLevel: string;
  companySize: string;
  source: JobSource;
  status: string;
  notes: string;
}

export type JobSource =
  | "JSearch"
  | "RemoteOK"
  | "Remotive"
  | "Greenhouse"
  | "Lever"
  | "Ashby"
  | "JapanDev"
  | "Workable"
  | "WordPress"
  | "WeWorkRemotely"
  | "TechInAsia"
  | "Kalibrr"
  | "SmartRecruiters"
  | "Teamtailor"
  | "Blibli"
  | "BankNeo"
  | "BambooHR";

export interface CrawlResult {
  source: JobSource;
  jobs: Job[];
  errors: string[];
}

// ─── JSearch API Types ───────────────────────────────────────────────

export interface JSearchResponse {
  status: string;
  data: JSearchJob[];
}

export interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string | null;
  job_apply_link: string;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_required_skills: string[] | null;
  job_required_experience: {
    no_experience_required: boolean;
    required_experience_in_months: number | null;
  } | null;
  employer_company_type: string | null;
}

// ─── RemoteOK API Types ─────────────────────────────────────────────

export interface RemoteOKJob {
  id: string;
  epoch: number;
  date: string;
  company: string;
  position: string;
  tags: string[];
  description: string;
  url: string;
  salary_min: number;
  salary_max: number;
  location: string;
}

// ─── Remotive API Types ──────────────────────────────────────────────

export interface RemotiveResponse {
  "job-count": number;
  jobs: RemotiveJob[];
}

export interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  candidate_required_location: string;
  description: string;
  publication_date: string;
  salary: string;
  job_type: string;
  tags: string[];
  company_logo_url: string;
}

// ─── Greenhouse API Types ────────────────────────────────────────────

export interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  content: string;
  updated_at: string;
  absolute_url: string;
  departments: { name: string }[];
}

// ─── Lever API Types ─────────────────────────────────────────────────

export interface LeverJob {
  id: string;
  text: string;
  categories: {
    commitment: string;
    department: string;
    location: string;
    team: string;
    allLocations: string[];
  };
  description: string;
  descriptionPlain: string;
  hostedUrl: string;
  createdAt: number;
  lists: { text: string; content: string }[];
}

// ─── Ashby API Types ─────────────────────────────────────────────────

export interface AshbyResponse {
  jobs: AshbyJob[];
}

export interface AshbyJob {
  id: string;
  title: string;
  departmentName: string;
  locationName: string;
  employmentType: string;
  descriptionHtml: string;
  publishedAt: string;
  jobUrl: string;
  compensationTierSummary: string | null;
  isRemote: boolean;
}

// ─── JapanDev (Algolia) API Types ───────────────────────────────────

export interface JapanDevHit {
  title: string;
  slug: string;
  company_name: string;
  company: { slug: string };
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  remote_level: string;
  seniority_level: string;
  published_at: string;
  skill_names: string[];
  application_url: string | null;
}

export interface JapanDevResponse {
  results: { hits: JapanDevHit[] }[];
}

// ─── Workable API Types ─────────────────────────────────────────────

export interface WorkableResponse {
  name: string;
  jobs: WorkableJob[];
}

export interface WorkableJob {
  title: string;
  shortcode: string;
  department: string | null;
  url: string;
  telecommuting: boolean;
  published_on: string;
  country: string;
  city: string;
  experience: string;
}

export interface WorkableJobDetail {
  title: string;
  shortcode: string;
  department: string[];
  description: string;
  requirements: string;
  benefits: string;
  location: { country: string; city: string };
  remote: boolean;
  published: string;
}

// ─── WordPress (WP Job Openings) API Types ──────────────────────────

export interface WordPressJob {
  id: number;
  date_gmt: string;
  modified_gmt: string;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
}

// ─── SmartRecruiters API Types ──────────────────────────────────────

export interface SmartRecruitersResponse {
  offset: number;
  limit: number;
  totalFound: number;
  content: SmartRecruitersJob[];
}

export interface SmartRecruitersJob {
  id: string;
  name: string;
  releasedDate: string;
  location: {
    city: string;
    country: string;
    remote: boolean;
    hybrid: boolean;
  };
  function: { id: string; label: string };
  experienceLevel: { id: string; label: string };
  ref: string;
}

export interface SmartRecruitersJobDetail {
  id: string;
  name: string;
  postingUrl: string;
  applyUrl: string;
  compensation?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  jobAd: {
    sections: {
      companyDescription?: { text: string };
      jobDescription?: { text: string };
      qualifications?: { text: string };
      additionalInformation?: { text: string };
    };
  };
}

// ─── Teamtailor API Types ───────────────────────────────────────────

export interface TeamtailorJob {
  id: string;
  title: string;
  "employment-type": string;
  region: string;
  city: string;
  department: string;
  salary: string;
}

export interface TeamtailorJobDetail {
  id: string;
  title: string;
  "employment-type": string;
  region: string;
  city: string;
  department: string;
  description: string;
  salary: string;
}

export interface TeamtailorListResponse {
  data: TeamtailorJob[];
  meta: { "record-count": number; "page-count": number };
}

export interface TeamtailorDetailResponse {
  data: TeamtailorJobDetail;
}

// ─── BambooHR API Types ─────────────────────────────────────────────

export interface BambooHRJob {
  id: string;
  jobOpeningName: string;
  departmentId: string;
  departmentLabel: string;
  employmentStatusLabel: string;
  location: { city: string | null; state: string | null };
  atsLocation: {
    country: string | null;
    state: string | null;
    province: string | null;
    city: string | null;
  };
  isRemote: boolean | null;
  locationType: string;
}

export interface BambooHRListResponse {
  meta: { totalCount: number };
  result: BambooHRJob[];
}

export interface BambooHRJobDetail {
  jobOpeningShareUrl: string;
  jobOpeningName: string;
  departmentLabel: string;
  description: string;
}

export interface BambooHRDetailResponse {
  meta: Record<string, unknown>;
  result: { jobOpening: BambooHRJobDetail };
}

// ─── Company Config Types ────────────────────────────────────────────

export type CompanyPlatform =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workable"
  | "wordpress"
  | "smartrecruiters"
  | "teamtailor"
  | "bamboohr";

export interface CompanyConfig {
  name: string;
  platform: CompanyPlatform;
  token: string;
  size?: string;
  /** Max job age in hours. undefined = use crawler default (24h), 0 = skip date filter */
  maxJobAgeHours?: number;
}

// ─── Discovered Company Types ────────────────────────────────────────

export interface DiscoveredCompany {
  name: string;
  sources: string;
  roleCount: number;
  locations: string;
  size: string;
  remoteFriendly: string;
  atsPlatform: string;
  atsToken: string;
  sampleUrl: string;
  discoveredDate: string;
}

export const COMPANY_SHEET_HEADERS = [
  "Name",
  "Sources",
  "Role Count",
  "Locations",
  "Size",
  "Remote Friendly",
  "ATS Platform",
  "ATS Token",
  "Sample URL",
  "Discovered Date",
] as const;

export function discoveredCompanyToRow(company: DiscoveredCompany): string[] {
  return [
    company.name,
    company.sources,
    String(company.roleCount),
    company.locations,
    company.size,
    company.remoteFriendly,
    company.atsPlatform,
    company.atsToken,
    company.sampleUrl,
    company.discoveredDate,
  ];
}

// ─── Sheet Column Order ──────────────────────────────────────────────

export const SHEET_HEADERS = [
  "Date Found",
  "Job Title",
  "Company",
  "Location",
  "URL",
  "Salary",
  "Description",
  "Required Skills",
  "Experience Level",
  "Company Size",
  "Source",
  "Status",
  "Notes",
] as const;

export function jobToRow(job: Job): string[] {
  return [
    job.dateFound,
    job.title,
    job.company,
    job.location,
    job.url,
    job.salary,
    job.description,
    job.requiredSkills,
    job.experienceLevel,
    job.companySize,
    job.source,
    job.status,
    job.notes,
  ];
}

export function rowToJob(row: string[]): Partial<Job> {
  return {
    dateFound: row[0],
    title: row[1],
    company: row[2],
    location: row[3],
    url: row[4],
    salary: row[5],
    description: row[6],
    requiredSkills: row[7],
    experienceLevel: row[8],
    companySize: row[9],
    source: row[10] as JobSource,
    status: row[11],
    notes: row[12],
  };
}
