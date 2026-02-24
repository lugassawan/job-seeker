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

export type JobSource = "JSearch" | "RemoteOK" | "Remotive" | "Greenhouse" | "Lever" | "Ashby";

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
  job_description: string;
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
  epoch: string;
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

// ─── Company Config Types ────────────────────────────────────────────

export type CompanyPlatform = "greenhouse" | "lever" | "ashby";

export interface CompanyConfig {
  name: string;
  platform: CompanyPlatform;
  token: string;
  size?: string;
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
