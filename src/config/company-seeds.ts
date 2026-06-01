import type { CompanySeed } from "../types.ts";

// Curated seed list for ATS directory discovery.
// Probed via probeAts() against Greenhouse, Lever, Ashby, Workable, SmartRecruiters.
// Excludes all names already in COMPANY_WATCHLIST (companies.ts).
export const COMPANY_SEEDS: CompanySeed[] = [
  // ─── US Fintech ────────────────────────────────────────────────────
  { name: "Plaid", industry: "fintech", region: "us" },
  { name: "Brex", industry: "fintech", region: "us" },
  { name: "Chime", industry: "fintech", region: "us" },
  { name: "Robinhood", industry: "fintech", region: "us" },
  { name: "Marqeta", industry: "fintech", region: "us" },
  { name: "Affirm", industry: "fintech", region: "us" },
  { name: "Mercury", industry: "fintech", region: "us" },
  { name: "Gusto", industry: "fintech", region: "us" },
  { name: "Rippling", industry: "fintech", region: "us" },
  { name: "Blend", industry: "fintech", region: "us" },
  { name: "Stytch", industry: "fintech", region: "us" },

  // ─── EU Fintech ────────────────────────────────────────────────────
  { name: "Revolut", industry: "fintech", region: "eu" },
  { name: "Monzo", industry: "fintech", region: "eu" },
  { name: "N26", industry: "fintech", region: "eu" },
  { name: "Klarna", industry: "fintech", region: "eu" },
  { name: "GoCardless", industry: "fintech", region: "eu" },
  { name: "Paysafe", industry: "fintech", region: "eu" },
  { name: "TrueLayer", industry: "fintech", region: "eu" },
  { name: "Sumeria", industry: "fintech", region: "eu" },

  // ─── SEA Fintech ───────────────────────────────────────────────────
  { name: "Payfazz", industry: "fintech", region: "sea" },
  { name: "Flip", industry: "fintech", region: "sea" },
  { name: "Cermati", industry: "fintech", region: "sea" },
  { name: "Modalku", industry: "fintech", region: "sea" },
  { name: "LinkAja", industry: "fintech", region: "sea" },

  // ─── US SaaS ───────────────────────────────────────────────────────
  { name: "PagerDuty", industry: "saas", region: "us" },
  { name: "Okta", industry: "saas", region: "us" },
  { name: "Fastly", industry: "saas", region: "us" },
  { name: "Intercom", industry: "saas", region: "us" },
  { name: "Zendesk", industry: "saas", region: "us" },
  { name: "Mixpanel", industry: "saas", region: "us" },
  { name: "Amplitude", industry: "saas", region: "us" },
  { name: "Loom", industry: "saas", region: "us" },
  { name: "Coda", industry: "saas", region: "us" },
  { name: "Airtable", industry: "saas", region: "us" },
  { name: "Monday.com", industry: "saas", region: "us" },

  // ─── EU SaaS ───────────────────────────────────────────────────────
  { name: "Personio", industry: "saas", region: "eu" },
  { name: "GetResponse", industry: "saas", region: "eu" },
  { name: "Paddle", industry: "saas", region: "eu" },
  { name: "Pleo", industry: "saas", region: "eu" },
  { name: "Mews", industry: "saas", region: "eu" },

  // ─── SEA SaaS ──────────────────────────────────────────────────────
  { name: "HashMicro", industry: "saas", region: "sea" },
  { name: "Mekari", industry: "saas", region: "sea" },
  { name: "Sleekr", industry: "saas", region: "sea" },
  { name: "Privy", industry: "saas", region: "sea" },

  // ─── US Devtools ───────────────────────────────────────────────────
  { name: "Datadog", industry: "devtools", region: "us" },
  { name: "Sentry", industry: "devtools", region: "us" },
  { name: "HashiCorp", industry: "devtools", region: "us" },
  { name: "Netlify", industry: "devtools", region: "us" },
  { name: "Supabase", industry: "devtools", region: "us" },
  { name: "Retool", industry: "devtools", region: "us" },
  { name: "PlanetScale", industry: "devtools", region: "us" },
  { name: "Neon", industry: "devtools", region: "us" },
  { name: "Render", industry: "devtools", region: "us" },
  { name: "Temporal", industry: "devtools", region: "us" },
  { name: "Clerk", industry: "devtools", region: "us" },
  { name: "Turso", industry: "devtools", region: "us" },

  // ─── EU Devtools ───────────────────────────────────────────────────
  { name: "JetBrains", industry: "devtools", region: "eu" },
  { name: "Grafana Labs", industry: "devtools", region: "eu" },
  { name: "Elastic", industry: "devtools", region: "eu" },
  { name: "PostHog", industry: "devtools", region: "eu" },

  // ─── US AI / ML ────────────────────────────────────────────────────
  { name: "Scale AI", industry: "ai", region: "us" },
  { name: "Cohere", industry: "ai", region: "us" },
  { name: "Wandb", industry: "ai", region: "us" },
  { name: "Runway", industry: "ai", region: "us" },
  { name: "Deepgram", industry: "ai", region: "us" },
  { name: "Hugging Face", industry: "ai", region: "us" },
  { name: "Together AI", industry: "ai", region: "us" },

  // ─── EU AI / ML ────────────────────────────────────────────────────
  { name: "Mistral", industry: "ai", region: "eu" },

  // ─── SEA Ecommerce / Logistics ─────────────────────────────────────
  { name: "Bukalapak", industry: "ecommerce", region: "sea" },
  { name: "Ninja Van", industry: "logistics", region: "sea" },
  { name: "Kopi Kenangan", industry: "foodtech", region: "sea" },
  { name: "GoTo", industry: "logistics", region: "sea" },
  { name: "Lazada", industry: "ecommerce", region: "sea" },

  // ─── US Healthtech ─────────────────────────────────────────────────
  { name: "Noom", industry: "healthtech", region: "us" },
  { name: "Oscar Health", industry: "healthtech", region: "us" },
  { name: "Ro Health", industry: "healthtech", region: "us" },
  { name: "Spring Health", industry: "healthtech", region: "us" },

  // ─── US Edtech ─────────────────────────────────────────────────────
  { name: "Duolingo", industry: "edtech", region: "us" },
  { name: "Coursera", industry: "edtech", region: "us" },
  { name: "Kahoot", industry: "edtech", region: "eu" },

  // ─── US Media / Social ─────────────────────────────────────────────
  { name: "Discord", industry: "media", region: "us" },
  { name: "Pinterest", industry: "media", region: "us" },
  { name: "Patreon", industry: "media", region: "us" },
];
