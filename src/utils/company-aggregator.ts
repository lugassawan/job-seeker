import type { DiscoveredCompany, Job } from "../types.ts";
import { normalizeCompanyName } from "./company-name.ts";

interface CompanyAccumulator {
  displayName: string;
  sources: Set<string>;
  roleCount: number;
  locations: Set<string>;
  sizes: Map<string, number>;
  remoteCount: number;
  sampleUrl: string;
}

function mostFrequent(counts: Map<string, number>): string {
  let best = "";
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function inferRemoteFriendly(remoteCount: number, totalCount: number): string {
  if (totalCount === 0) return "No";
  const ratio = remoteCount / totalCount;
  if (ratio >= 0.5) return "Yes";
  if (remoteCount > 0) return "Likely";
  return "No";
}

export function aggregateCompanies(jobs: Job[]): DiscoveredCompany[] {
  const groups = new Map<string, CompanyAccumulator>();

  for (const job of jobs) {
    if (!job.company || job.company.trim() === "") continue;

    const key = normalizeCompanyName(job.company);
    if (key === "") continue;

    let acc = groups.get(key);
    if (!acc) {
      acc = {
        displayName: job.company,
        sources: new Set(),
        roleCount: 0,
        locations: new Set(),
        sizes: new Map(),
        remoteCount: 0,
        sampleUrl: job.url,
      };
      groups.set(key, acc);
    }

    acc.sources.add(job.source);
    acc.roleCount++;

    if (job.location) {
      acc.locations.add(job.location);
    }

    if (job.companySize) {
      acc.sizes.set(job.companySize, (acc.sizes.get(job.companySize) ?? 0) + 1);
    }

    if (job.location?.toLowerCase().includes("remote")) {
      acc.remoteCount++;
    }
  }

  const today = new Date().toISOString().split("T").at(0) ?? "";

  const results: DiscoveredCompany[] = [];
  for (const acc of groups.values()) {
    results.push({
      name: acc.displayName,
      sources: [...acc.sources].join(", "),
      roleCount: acc.roleCount,
      locations: [...acc.locations].join(", "),
      size: mostFrequent(acc.sizes),
      remoteFriendly: inferRemoteFriendly(acc.remoteCount, acc.roleCount),
      atsPlatform: "Unknown",
      atsToken: "",
      sampleUrl: acc.sampleUrl,
      discoveredDate: today,
    });
  }

  return results;
}
