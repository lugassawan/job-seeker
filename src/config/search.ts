// Search queries for JSearch API — rotated across runs to stay within rate limits
export const SEARCH_QUERIES = [
  "remote software engineer",
  "remote frontend developer",
  "remote backend engineer",
  "remote fullstack developer",
];

// Countries/locations to exclude from results
export const EXCLUDED_LOCATIONS = ["Indonesia", "India"];

// Software engineering keywords for relevance filtering
// (used by filter.ts, defined here for easy customization)
export const ENGINEERING_KEYWORDS = [
  "software",
  "engineer",
  "developer",
  "frontend",
  "front-end",
  "backend",
  "back-end",
  "fullstack",
  "full-stack",
  "devops",
  "sre",
  "site reliability",
  "platform engineer",
  "infrastructure",
  "cloud engineer",
  "data engineer",
  "machine learning",
  "ml engineer",
  "ai engineer",
  "mobile developer",
  "ios developer",
  "android developer",
  "web developer",
  "systems engineer",
  "security engineer",
  "qa engineer",
  "test engineer",
  "automation engineer",
];

// How many hours back to look for new jobs (safety margin for 6h cron)
export const RECENCY_HOURS = 24;
