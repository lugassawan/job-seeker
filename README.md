# Job Seeker

Automated crawler that discovers remote software engineering positions and saves them to Google Sheets. Runs every 6 hours via GitHub Actions.

Sources: [RemoteOK](https://remoteok.com), [Remotive](https://remotive.com), [JSearch/RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch), and company career pages (Greenhouse, Lever, Ashby).

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
| `RAPIDAPI_KEY` | No | RapidAPI key for JSearch; skipped if not set |

## Development

```bash
bun test              # 107 tests
bun run typecheck     # tsc --noEmit
bun run lint          # biome lint
bun run check         # biome check (lint + format)
```

Pre-commit hook runs format, lint, typecheck, and tests.

## GitHub Secrets

Set these in the repository for the crawl workflow:

`GOOGLE_SERVICE_ACCOUNT_KEY` | `GOOGLE_SHEET_ID` | `GOOGLE_SHEET_NAME` | `RAPIDAPI_KEY`
