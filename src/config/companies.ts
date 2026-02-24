import type { CompanyConfig } from "../types.ts";

// Company watchlist for direct career page crawling
// platform: "greenhouse" | "lever" | "ashby"
// token: the company's board token/slug used in their API URL
export const COMPANY_WATCHLIST: CompanyConfig[] = [
  // Greenhouse companies
  { name: "GitLab", platform: "greenhouse", token: "gitlab", size: "Enterprise" },
  { name: "Cloudflare", platform: "greenhouse", token: "cloudflare", size: "Enterprise" },
  { name: "Figma", platform: "greenhouse", token: "figma", size: "Mid-size" },
  { name: "Stripe", platform: "greenhouse", token: "stripe", size: "Enterprise" },
  { name: "Vercel", platform: "greenhouse", token: "vercel", size: "Startup" },

  // Lever companies
  { name: "Netflix", platform: "lever", token: "netflix", size: "Enterprise" },

  // Ashby companies
  { name: "Notion", platform: "ashby", token: "notion", size: "Mid-size" },
  { name: "Ramp", platform: "ashby", token: "ramp", size: "Mid-size" },
  { name: "Linear", platform: "ashby", token: "linear", size: "Startup" },
];
