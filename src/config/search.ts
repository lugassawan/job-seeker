// Search queries for JSearch API — rotated across runs to stay within rate limits
export const SEARCH_QUERIES = ["software engineer", "backend engineer", "fullstack developer"];

// Countries/locations to exclude from results
export const EXCLUDED_LOCATIONS = ["India"];

// Software engineering keywords for relevance filtering
// (used by filter.ts, defined here for easy customization)
export const ENGINEERING_KEYWORDS = [
  "software engineer",
  "software developer",
  "backend",
  "back-end",
  "fullstack",
  "full-stack",
  "full stack",
];

// How many hours back to look for new jobs (safety margin for 6h cron)
export const RECENCY_HOURS = 24;
