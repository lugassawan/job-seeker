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

## Development

```bash
bun test              # run tests
bun run typecheck     # tsc --noEmit
bun run lint          # biome lint
bun run check         # biome check (lint + format)
```

Pre-commit hook runs format, lint, typecheck, and tests.

## GitHub Secrets

Set these in the repository for the crawl workflow:

`GOOGLE_SERVICE_ACCOUNT_KEY` | `GOOGLE_SHEET_ID` | `GOOGLE_SHEET_NAME` | `OPENWEBNINJA_API_KEY`
