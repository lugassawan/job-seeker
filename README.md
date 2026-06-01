# Job Seeker

Automated crawler that discovers remote software engineering positions and saves them to Google Sheets. Runs every 6 hours via GitHub Actions.

Sources: [RemoteOK](https://remoteok.com), [Remotive](https://remotive.com), [JSearch](https://www.openwebninja.com/api/jsearch), [WeWorkRemotely](https://weworkremotely.com), [JapanDev](https://japan-dev.com), [TechInAsia](https://techinasia.com), [Kalibrr](https://kalibrr.com), [Blibli](https://careers.blibli.com), [Bank Neo](https://bankneocommerce.co.id), and company career pages (Greenhouse, Lever, Ashby, Workable, WordPress, SmartRecruiters).

## Setup

```bash
cp .env.example .env  # fill in values
bun install
bun start
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Yes | Base64-encoded service account JSON |
| `GOOGLE_SHEET_ID` | Yes | Spreadsheet ID from the URL |
| `GOOGLE_SHEET_NAME` | No | Sheet tab name (defaults to "Jobs") |
| `OPENWEBNINJA_API_KEY` | No | [OpenWeb Ninja](https://app.openwebninja.com) API key for JSearch; skipped if not set |
| `RAPIDAPI_KEY` | No | Alternative API key for JSearch; used only when `OPENWEBNINJA_API_KEY` is unset |

## Commands

### Run the crawler

```bash
bun start    # crawl all sources and append new jobs to Google Sheets
```

Takes no CLI flags; behavior is controlled entirely by env vars (see Setup).

### Discover companies

Crawls job boards (or a curated seed list) to find new companies and writes them to the `Companies` sheet tab.

```bash
bun run discover                                 # crawl job boards for new companies
bun run discover --probe-ats                     # ...and detect each company's ATS
bun run discover --directory --industry=fintech  # probe curated seeds filtered to fintech
```

| Flag | Effect |
|------|--------|
| `--probe-ats`, `--ats` | Probe each discovered company for its ATS platform/token |
| `--directory`, `--seeds` | Directory mode — probe the curated seed list (`src/config/company-seeds.ts`) instead of crawling job boards |
| `--industry=<a,b,c>` | Comma-separated industry filter (directory mode only) |
| `--region=<a,b,c>` | Comma-separated region filter (directory mode only) |

### Development scripts

```bash
bun test                   # run all tests
bun test <file>            # run a single test file
bun run typecheck          # tsc --noEmit
bun run lint               # biome lint
bun run lint:fix           # biome lint --write
bun run format             # biome format --write
bun run check              # biome check (lint + format)
bun run check:fix          # auto-fix lint and format issues
```

Pre-commit hook (Husky) runs format check, lint, typecheck, and tests automatically.

## GitHub Secrets

Set these in the repository for the crawl workflow:

`GOOGLE_SERVICE_ACCOUNT_KEY` | `GOOGLE_SHEET_ID` | `GOOGLE_SHEET_NAME` | `OPENWEBNINJA_API_KEY` | `RAPIDAPI_KEY`
