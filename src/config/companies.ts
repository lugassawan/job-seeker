import type { CompanyConfig } from "../types.ts";

// Company watchlist for direct career page crawling
// platform: "greenhouse" | "lever" | "ashby"
// token: the company's board token/slug used in their API URL
export const COMPANY_WATCHLIST: CompanyConfig[] = [
  // Greenhouse companies
  { name: "GitLab", platform: "greenhouse", token: "gitlab", size: "Enterprise" },
  { name: "Cloudflare", platform: "greenhouse", token: "cloudflare", size: "Enterprise" },
  { name: "Figma", platform: "greenhouse", token: "figma", size: "Mid-size" },
  { name: "Notion", platform: "greenhouse", token: "notion", size: "Mid-size" },
  { name: "Ramp", platform: "greenhouse", token: "ramp", size: "Mid-size" },
  { name: "Netflix", platform: "greenhouse", token: "netflix", size: "Enterprise" },

  // Lever companies
  { name: "Stripe", platform: "lever", token: "stripe", size: "Enterprise" },
  { name: "Vercel", platform: "lever", token: "vercel", size: "Startup" },

  // Ashby companies
  { name: "Linear", platform: "ashby", token: "linear", size: "Startup" },
];
