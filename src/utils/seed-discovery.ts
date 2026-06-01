import type { CompanyPlatform, CompanySeed, DiscoveredCompany } from "../types.ts";

export interface SeedFilters {
  industries: string[];
  regions: string[];
}

export function parseSeedFilters(argv: string[]): SeedFilters {
  const industries: string[] = [];
  const regions: string[] = [];

  for (const arg of argv) {
    if (arg.startsWith("--industry=")) {
      const value = arg.slice("--industry=".length);
      industries.push(
        ...value
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      );
    } else if (arg.startsWith("--region=")) {
      const value = arg.slice("--region=".length);
      regions.push(
        ...value
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      );
    }
  }

  return { industries, regions };
}

export function filterSeeds(seeds: CompanySeed[], filters: SeedFilters): CompanySeed[] {
  return seeds.filter((seed) => {
    const industryMatch =
      filters.industries.length === 0 ||
      filters.industries.some((i) => i.toLowerCase() === seed.industry.toLowerCase());
    const regionMatch =
      filters.regions.length === 0 ||
      filters.regions.some((r) => r.toLowerCase() === seed.region.toLowerCase());
    return industryMatch && regionMatch;
  });
}

export function buildBoardUrl(platform: CompanyPlatform, token: string): string {
  switch (platform) {
    case "greenhouse":
      return `https://boards.greenhouse.io/${token}`;
    case "lever":
      return `https://jobs.lever.co/${token}`;
    case "ashby":
      return `https://jobs.ashbyhq.com/${token}`;
    case "workable":
      return `https://apply.workable.com/${token}/`;
    case "smartrecruiters":
      return `https://jobs.smartrecruiters.com/${token}`;
    default:
      return "";
  }
}

export function seedMatchToDiscoveredCompany(
  seed: CompanySeed,
  match: { platform: CompanyPlatform; token: string },
  discoveredDate: string,
): DiscoveredCompany {
  return {
    name: seed.name,
    sources: "ATS Directory",
    roleCount: 0,
    locations: seed.region,
    size: "",
    remoteFriendly: "Unknown",
    atsPlatform: match.platform,
    atsToken: match.token,
    sampleUrl: buildBoardUrl(match.platform, match.token),
    discoveredDate,
  };
}
