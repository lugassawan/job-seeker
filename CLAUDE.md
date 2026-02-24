# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun start             # run the crawler
bun test              # run all tests
bun test src/__tests__/filter.test.ts  # run a single test file
bun run typecheck     # tsc --noEmit
bun run lint          # biome lint
bun run check         # biome check (lint + format)
bun run check:fix     # auto-fix lint and format issues
```

## Architecture

Job crawler that runs on a schedule (GitHub Actions, every 6h). Crawls Software/Backend/Fullstack engineer jobs accessible from Indonesia (remote, hybrid, and on-site) from eight sources, normalizes them into a `Job` type, filters/deduplicates, and appends to Google Sheets.

**Flow:** `src/index.ts` runs all crawlers via `Promise.allSettled` → `filterJobs()` → `deduplicateJobs()` → `sheets.appendJobs()`.

**Crawlers** inherit from `BaseCrawler` (`src/crawlers/base.ts`), which provides `enrichJob()` — the shared pipeline that extracts skills, infers experience level, and infers company size. Each crawler fetches from its API, filters for engineering + recent (24h), then calls `enrichJob()` on each result.

**Sources:**
- `RemoteOK` — remote jobs API (inherently remote-only)
- `Remotive` — remote software-dev jobs API (inherently remote-only)
- `CompanyDirectCrawler` — crawls Greenhouse, Lever, Ashby, Workable, and WordPress career pages for companies in `src/config/companies.ts`
- `JapanDev` — Algolia-backed search for engineering jobs on japan-dev.com
- `WeWorkRemotely` — RSS feed parser for programming jobs
- `TechInAsia` — REST API (`/api/2.0/job-postings`) for Indonesia engineering jobs (requires browser-like User-Agent + Referer)
- `Kalibrr` — REST API (`/kjs/job_board/search`) for Indonesia software roles
- `JSearch` — RapidAPI-based search (optional, requires `RAPIDAPI_KEY`)

**Filtering:** `src/utils/filter.ts` keeps only jobs matching Software/Backend/Fullstack keywords, excludes India, and requires posting within last 24h.

**Deduplication** uses MD5 hash of `company|title|url` (via `Bun.CryptoHasher`), compared against all existing Google Sheets rows.

**Keepalive:** `.github/workflows/keepalive.yml` prevents GitHub from auto-disabling the scheduled crawl workflow due to repo inactivity.

## Conventions

- **Runtime:** Bun, not Node. Bun auto-loads `.env`.
- **Only production dependency:** `googleapis`. Keep it minimal.
- **Biome** for linting and formatting (strict config). No ESLint/Prettier.
- **Pre-commit hook** (Husky) runs format check, lint, typecheck, and tests.
- **TypeScript strict mode** with `noUncheckedIndexedAccess: true` — use `.at()` with `??` fallback instead of `!` assertions for array access.
- `noNonNullAssertion` is enforced — restructure logic to narrow types instead of using `!`.
