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

Job crawler that runs on a schedule (GitHub Actions, every 6h). Crawls Software/Backend/Fullstack engineer jobs accessible from Indonesia (remote, hybrid, and on-site), normalizes them into a `Job` type, filters/deduplicates, and appends to Google Sheets.

**Flow:** `src/index.ts` runs all crawlers via `Promise.allSettled` → `filterJobs()` → `deduplicateJobs()` → `sheets.appendJobs()`.

**Crawlers** inherit from `BaseCrawler` (`src/crawlers/base.ts`), which provides shared utilities:
- `enrichJob()` — pipeline that extracts skills, infers experience level and company size
- `isEngineeringDepartment()` — centralized department keyword matching (used by CompanyDirect, Blibli)
- `stripHtml()`, `truncateDescription()`, `formatSalary()`, `isWithinHours()`

**Sources (11 crawlers):**
- `RemoteOK` — remote jobs API (inherently remote-only)
- `Remotive` — remote software-dev jobs API (inherently remote-only)
- `CompanyDirectCrawler` — crawls Greenhouse, Lever, Ashby, Workable, WordPress, SmartRecruiters, and Teamtailor career pages for companies in `src/config/companies.ts`
- `JapanDev` — Algolia-backed search for engineering jobs on japan-dev.com
- `WeWorkRemotely` — RSS feed parser for programming jobs
- `TechInAsia` — REST API (`/api/2.0/job-postings`) for Indonesia engineering jobs (requires browser-like User-Agent + Referer)
- `Kalibrr` — REST API (`/kjs/job_board/search`) for Indonesia software roles
- `Blibli` — Blibli careers API (`careers.blibli.com/ext/api`), response wrapped in `{ responseObject, status }` envelope
- `BankNeo` — Bank Neo Commerce careers API (`www-cms.bankneo.co.id/api/job-vacancy`)
- `JSearch` — OpenWeb Ninja job search API (optional, requires `OPENWEBNINJA_API_KEY`)

**Filtering** (`src/utils/filter.ts`): three-stage pipeline — relevance (Software/Backend/Fullstack keywords, excludes QA/Quality Assurance titles) → location (excludes India) → recency (24h based on `dateFound`).

**`skipDateFilter`:** `CompanyConfig` supports `skipDateFilter?: boolean` to bypass the 24h posting-date check for companies with unreliable or missing dates. Blibli and BankNeo always skip the date filter. For CompanyDirectCrawler companies, set it per-company in `src/config/companies.ts`.

**Deduplication** (`src/utils/dedup.ts`): MD5 hash of normalized `company|title|url` (lowercase, trailing slashes stripped) via `Bun.CryptoHasher`, compared against all existing Google Sheets rows.

**Skills extraction** (`src/utils/skills.ts`): ~100 regex patterns across categories (languages, frontend, backend, cloud/infra, data, ML/AI) applied to job descriptions.

**Keepalive:** `.github/workflows/keepalive.yml` prevents GitHub from auto-disabling the scheduled crawl workflow due to repo inactivity.

**CI:** `.github/workflows/ci.yml` runs format, lint, typecheck, and tests on push/PR to main.

## Adding a New Crawler

1. Create `src/crawlers/<name>.ts` extending `BaseCrawler`
2. Implement `crawl()` returning `{ source, jobs, errors }`
3. Call `this.enrichJob()` on each result to extract skills/level/size
4. Add source name to `JobSource` union in `src/types.ts`
5. Instantiate in `src/index.ts`

**Adding a company to CompanyDirectCrawler:** add an entry to `src/config/companies.ts` with `{ name, platform, token, size?, skipDateFilter? }`. Supported platforms: `greenhouse`, `lever`, `ashby`, `workable`, `wordpress`, `smartrecruiters`, `teamtailor`.

## Conventions

- **Runtime:** Bun, not Node. Bun auto-loads `.env`.
- **Only production dependency:** `googleapis`. Keep it minimal.
- **Biome** for linting and formatting (strict config, line width 100). No ESLint/Prettier.
- **Pre-commit hook** (Husky) runs format check, lint, typecheck, and tests.
- **TypeScript strict mode** with `noUncheckedIndexedAccess: true` — use `.at()` with `??` fallback instead of `!` assertions for array access.
- `noNonNullAssertion` is enforced — restructure logic to narrow types instead of using `!`.
- **Biome strict rules** to be aware of: `noForEach` (use `for...of`), `noExplicitAny`, `useImportType`/`useExportType`, `noParameterAssign`, `noBarrelFile`, `useAwait` (async functions must await).
