import type { CompanyConfig } from "../types.ts";

// Company watchlist for direct career page crawling
// platform: "greenhouse" | "lever" | "ashby" | "workable" | "wordpress"
// token: the company's board token/slug used in their API URL
export const COMPANY_WATCHLIST: CompanyConfig[] = [
  // Greenhouse companies
  { name: "GitLab", platform: "greenhouse", token: "gitlab", size: "Enterprise" },
  { name: "Cloudflare", platform: "greenhouse", token: "cloudflare", size: "Enterprise" },
  { name: "Figma", platform: "greenhouse", token: "figma", size: "Mid-size" },
  { name: "Stripe", platform: "greenhouse", token: "stripe", size: "Enterprise" },
  { name: "Vercel", platform: "greenhouse", token: "vercel", size: "Startup" },
  { name: "Speechify", platform: "greenhouse", token: "speechify", size: "Mid-size" },
  { name: "CircleCI", platform: "greenhouse", token: "circleci", size: "Mid-size" },
  { name: "Consensys", platform: "greenhouse", token: "consensys", size: "Mid-size" },
  { name: "Modern Health", platform: "greenhouse", token: "modernhealth", size: "Mid-size" },
  { name: "ReCharge", platform: "greenhouse", token: "recharge", size: "Mid-size" },

  // Lever companies
  { name: "Netflix", platform: "lever", token: "netflix", size: "Enterprise" },
  { name: "Jobgether", platform: "lever", token: "jobgether" },
  { name: "Kraken", platform: "lever", token: "kraken", size: "Enterprise" },
  { name: "Medium", platform: "lever", token: "medium", size: "Mid-size" },
  { name: "Skillshare", platform: "lever", token: "skillshare", size: "Mid-size" },

  // Ashby companies
  { name: "Notion", platform: "ashby", token: "notion", size: "Mid-size" },
  { name: "Ramp", platform: "ashby", token: "ramp", size: "Mid-size" },
  { name: "Linear", platform: "ashby", token: "linear", size: "Startup" },
  { name: "Deel", platform: "ashby", token: "Deel", size: "Enterprise" },

  // Workable companies
  { name: "Employment Hero", platform: "workable", token: "employment-hero", size: "Mid-size" },

  // WordPress (WP Job Openings) companies
  { name: "Bookipi", platform: "wordpress", token: "bookipi.com", size: "Startup" },
];
