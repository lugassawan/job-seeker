import type { CompanyConfig } from "../types.ts";

// Company watchlist for direct career page crawling
// platform: "greenhouse" | "lever" | "ashby" | "workable" | "wordpress" | "smartrecruiters" | "teamtailor" | "bamboohr"
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
  {
    name: "Xendit",
    platform: "greenhouse",
    token: "xendit",
    size: "Mid-size",
    maxJobAgeHours: 0,
  },
  { name: "Agoda", platform: "greenhouse", token: "agoda", size: "Enterprise" },
  { name: "Twilio", platform: "greenhouse", token: "twilio", size: "Enterprise" },
  { name: "Remote", platform: "greenhouse", token: "remotecom", size: "Enterprise" },
  { name: "Imply", platform: "greenhouse", token: "imply", size: "Startup" },

  // Lever companies
  { name: "Netflix", platform: "lever", token: "netflix", size: "Enterprise" },
  { name: "Jobgether", platform: "lever", token: "jobgether" },
  { name: "Kraken", platform: "lever", token: "kraken", size: "Enterprise" },
  { name: "Medium", platform: "lever", token: "medium", size: "Mid-size" },
  { name: "Skillshare", platform: "lever", token: "skillshare", size: "Mid-size" },
  { name: "Tiket", platform: "lever", token: "tiket", size: "Mid-size", maxJobAgeHours: 0 },
  { name: "Xsolla", platform: "lever", token: "xsolla", size: "Mid-size" },

  // Ashby companies
  { name: "Notion", platform: "ashby", token: "notion", size: "Mid-size" },
  { name: "Ramp", platform: "ashby", token: "ramp", size: "Mid-size" },
  { name: "Linear", platform: "ashby", token: "linear", size: "Startup" },
  { name: "Deel", platform: "ashby", token: "Deel", size: "Enterprise" },
  { name: "Pave", platform: "ashby", token: "PaveBank", size: "Startup" },
  { name: "Bespoke Labs", platform: "ashby", token: "bespokelabs", size: "Startup" },
  { name: "Snowflake", platform: "ashby", token: "snowflake", size: "Enterprise" },
  { name: "Perplexity AI", platform: "ashby", token: "perplexity", size: "Startup" },
  { name: "Lavendo", platform: "ashby", token: "lavendo", size: "Startup" },

  // Workable companies
  {
    name: "Employment Hero",
    platform: "workable",
    token: "employment-hero",
    size: "Mid-size",
    maxJobAgeHours: 0,
  },
  { name: "Ajaib", platform: "workable", token: "ajaib", size: "Mid-size", maxJobAgeHours: 0 },
  {
    name: "Stockbit",
    platform: "teamtailor",
    token: "careers.stockbit.com",
    size: "Mid-size",
    maxJobAgeHours: 0,
  },
  {
    name: "Traveloka",
    platform: "workable",
    token: "traveloka",
    size: "Enterprise",
    maxJobAgeHours: 0,
  },
  {
    name: "Dana",
    platform: "workable",
    token: "dana-indonesia",
    size: "Mid-size",
    maxJobAgeHours: 0,
  },
  {
    name: "Halodoc",
    platform: "workable",
    token: "halodoc",
    size: "Mid-size",
    maxJobAgeHours: 0,
  },
  {
    name: "Kredivo",
    platform: "workable",
    token: "finaccel",
    size: "Mid-size",
    maxJobAgeHours: 0,
  },
  {
    name: "Mitrais",
    platform: "workable",
    token: "mitrais",
    size: "Mid-size",
    maxJobAgeHours: 0,
  },
  {
    name: "TabSquare",
    platform: "workable",
    token: "tabsquare",
    size: "Mid-size",
    maxJobAgeHours: 0,
  },

  // SmartRecruiters companies
  { name: "Grab", platform: "smartrecruiters", token: "Grab", size: "Enterprise" },
  { name: "Wise", platform: "smartrecruiters", token: "Wise", size: "Enterprise" },
  { name: "Kata.ai", platform: "smartrecruiters", token: "Kataai", size: "Startup" },
  { name: "Carousell", platform: "smartrecruiters", token: "CarousellGroup", size: "Mid-size" },

  // WordPress (WP Job Openings) companies
  {
    name: "Bookipi",
    platform: "wordpress",
    token: "bookipi.com",
    size: "Startup",
    maxJobAgeHours: 0,
  },

  // BambooHR companies (list endpoint has no publish date, so the crawler always skips the age filter)
  { name: "Shippit", platform: "bamboohr", token: "shippit", size: "Mid-size" },
];
