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

Job crawler that runs on a schedule (GitHub Actions, every 6h). Crawls remote software engineering jobs from four sources, normalizes them into a `Job` type, filters/deduplicates, and appends to Google Sheets.

**Flow:** `src/index.ts` runs all crawlers via `Promise.allSettled` → `filterJobs()` → `deduplicateJobs()` → `sheets.appendJobs()`.

**Crawlers** inherit from `BaseCrawler` (`src/crawlers/base.ts`), which provides `enrichJob()` — the shared pipeline that extracts skills, infers experience level, and infers company size. Each crawler fetches from its API, filters for remote + engineering + recent (24h), then calls `enrichJob()` on each result.

**Deduplication** uses MD5 hash of `company|title|url` (via `Bun.CryptoHasher`), compared against all existing Google Sheets rows.

## Conventions

- **Runtime:** Bun, not Node. Bun auto-loads `.env`.
- **Only production dependency:** `googleapis`. Keep it minimal.
- **Biome** for linting and formatting (strict config). No ESLint/Prettier.
- **Pre-commit hook** (Husky) runs format check, lint, typecheck, and tests.
- **TypeScript strict mode** with `noUncheckedIndexedAccess: true` — use `.at()` with `??` fallback instead of `!` assertions for array access.
- `noNonNullAssertion` is enforced — restructure logic to narrow types instead of using `!`.
