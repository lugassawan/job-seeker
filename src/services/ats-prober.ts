import type { CompanyPlatform } from "../types.ts";
import { generateAtsSlugs } from "../utils/company-name.ts";

interface AtsMatch {
  platform: CompanyPlatform;
  token: string;
}

interface ProbeTarget {
  platform: CompanyPlatform;
  buildUrl: (slug: string) => string;
  validate: (data: unknown) => boolean;
}

const PROBE_TARGETS: ProbeTarget[] = [
  {
    platform: "greenhouse",
    buildUrl: (slug) => `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
    validate: (data) => {
      const d = data as { jobs?: unknown[] };
      return Array.isArray(d.jobs) && d.jobs.length > 0;
    },
  },
  {
    platform: "lever",
    buildUrl: (slug) => `https://api.lever.co/v0/postings/${slug}?mode=json`,
    validate: (data) => Array.isArray(data) && (data as unknown[]).length > 0,
  },
  {
    platform: "ashby",
    buildUrl: (slug) => `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    validate: (data) => {
      const d = data as { jobs?: unknown[] };
      return Array.isArray(d.jobs) && d.jobs.length > 0;
    },
  },
  {
    platform: "workable",
    buildUrl: (slug) => `https://apply.workable.com/api/v1/widget/accounts/${slug}`,
    validate: (data) => {
      const d = data as { jobs?: unknown[] };
      return Array.isArray(d.jobs) && d.jobs.length > 0;
    },
  },
  {
    platform: "smartrecruiters",
    buildUrl: (slug) => `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=1`,
    validate: (data) => {
      const d = data as { content?: unknown[] };
      return Array.isArray(d.content) && d.content.length > 0;
    },
  },
];

const PROBE_TIMEOUT_MS = 5000;
const PROBE_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryProbe(url: string, validate: (data: unknown) => boolean): Promise<boolean> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const data: unknown = await response.json();
    return validate(data);
  } catch {
    return false;
  }
}

export async function probeAts(companyName: string): Promise<AtsMatch | null> {
  const slugs = generateAtsSlugs(companyName);

  for (const target of PROBE_TARGETS) {
    for (const slug of slugs) {
      const url = target.buildUrl(slug);
      const matched = await tryProbe(url, target.validate);

      if (matched) {
        return { platform: target.platform, token: slug };
      }

      await sleep(PROBE_DELAY_MS);
    }
  }

  return null;
}
