import { COMPANY_WATCHLIST } from "./config/companies.ts";
import { COMPANY_SEEDS } from "./config/company-seeds.ts";
import type { BaseCrawler } from "./crawlers/base.ts";
import { JapanDevCrawler } from "./crawlers/japandev.ts";
import { JSearchCrawler } from "./crawlers/jsearch.ts";
import { KalibrrCrawler } from "./crawlers/kalibrr.ts";
import { RemoteOKCrawler } from "./crawlers/remoteok.ts";
import { RemotiveCrawler } from "./crawlers/remotive.ts";
import { TechInAsiaCrawler } from "./crawlers/techinasia.ts";
import { WeWorkRemotelyCrawler } from "./crawlers/weworkremotely.ts";
import { probeAts } from "./services/ats-prober.ts";
import { GoogleSheetsService } from "./services/google-sheets.ts";
import type { DiscoveredCompany, Job } from "./types.ts";
import { COMPANY_SHEET_HEADERS, discoveredCompanyToRow } from "./types.ts";
import { aggregateCompanies } from "./utils/company-aggregator.ts";
import { normalizeCompanyName } from "./utils/company-name.ts";
import {
  filterSeeds,
  parseSeedFilters,
  seedMatchToDiscoveredCompany,
} from "./utils/seed-discovery.ts";

const probeAtsFlag = process.argv.includes("--probe-ats") || process.argv.includes("--ats");
const directoryMode = process.argv.includes("--directory") || process.argv.includes("--seeds");

console.log("=== Company Discovery Starting ===");
console.log(`Time: ${new Date().toISOString()}`);
if (directoryMode) {
  console.log("Mode: ATS directory (seed probe)");
} else if (probeAtsFlag) {
  console.log("ATS probing enabled");
}

try {
  // 1. Initialize Google Sheets for "Companies" tab
  const sheets = GoogleSheetsService.fromEnv("Companies");
  await sheets.ensureSheet();
  await sheets.ensureCustomHeaders(COMPANY_SHEET_HEADERS);

  // 2. Build exclusion set from watchlist + existing Companies sheet rows
  const excludedNames = new Set<string>();

  for (const company of COMPANY_WATCHLIST) {
    excludedNames.add(normalizeCompanyName(company.name));
  }

  const existingRows = await sheets.getExistingRows();
  for (const row of existingRows) {
    const name = row.at(0);
    if (name) {
      excludedNames.add(normalizeCompanyName(name));
    }
  }
  console.log(`Excluded companies: ${excludedNames.size} (watchlist + existing)`);

  let newCompanies: DiscoveredCompany[];
  const allErrors: string[] = [];

  if (directoryMode) {
    // ── Directory mode: probe curated seed list ──────────────────────
    const filters = parseSeedFilters(process.argv);
    const candidates = filterSeeds(COMPANY_SEEDS, filters).filter(
      (seed) => !excludedNames.has(normalizeCompanyName(seed.name)),
    );
    console.log(`Seed candidates after filter + exclusion: ${candidates.length}`);

    const discoveredDate = new Date().toISOString().slice(0, 10);
    const matched: DiscoveredCompany[] = [];
    const probeErrors: string[] = [];
    let unmatched = 0;

    console.log("\nProbing ATS platforms...");
    for (const seed of candidates) {
      const match = await probeAts(seed.name, probeErrors);
      if (match) {
        matched.push(seedMatchToDiscoveredCompany(seed, match, discoveredDate));
        console.log(`  ✓ ${seed.name}: ${match.platform} (${match.token})`);
      } else {
        unmatched++;
      }
    }

    console.log(
      `\nMatched: ${matched.length}, Unmatched: ${unmatched}, Probe errors: ${probeErrors.length}`,
    );
    if (probeErrors.length > 0) {
      console.error(`\nProbe errors (network/timeout — may inflate unmatched count):`);
      for (const e of probeErrors) {
        console.error(`  - ${e}`);
      }
    }
    newCompanies = matched;
  } else {
    // ── Aggregator mode: crawl job boards ───────────────────────────
    const crawlers: BaseCrawler[] = [
      new RemoteOKCrawler(),
      new RemotiveCrawler(),
      new JapanDevCrawler(),
      new WeWorkRemotelyCrawler(),
      new TechInAsiaCrawler(),
      new KalibrrCrawler(),
    ];

    const jsearchApiKey = process.env.OPENWEBNINJA_API_KEY || process.env.RAPIDAPI_KEY;
    if (jsearchApiKey) {
      crawlers.push(new JSearchCrawler(jsearchApiKey));
    } else {
      console.log("OPENWEBNINJA_API_KEY not set — skipping JSearch crawler");
    }

    const results = await Promise.allSettled(crawlers.map((crawler) => crawler.crawl()));

    const allJobs: Job[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allJobs.push(...result.value.jobs);
        allErrors.push(...result.value.errors);
        console.log(
          `${result.value.source}: ${result.value.jobs.length} jobs, ${result.value.errors.length} errors`,
        );
      } else {
        allErrors.push(`Crawler failed: ${result.reason}`);
        console.error(`Crawler failed unexpectedly: ${result.reason}`);
      }
    }

    console.log(`\nTotal raw jobs collected: ${allJobs.length}`);

    const discovered = aggregateCompanies(allJobs);
    console.log(`Unique companies found: ${discovered.length}`);

    newCompanies = discovered.filter(
      (company) => !excludedNames.has(normalizeCompanyName(company.name)),
    );
    console.log(`New companies after exclusion: ${newCompanies.length}`);

    if (probeAtsFlag && newCompanies.length > 0) {
      console.log("\nProbing ATS platforms...");
      for (const company of newCompanies) {
        const match = await probeAts(company.name);
        if (match) {
          company.atsPlatform = match.platform;
          company.atsToken = match.token;
          console.log(`  ${company.name}: ${match.platform} (${match.token})`);
        }
      }
    }
  }

  // ── Shared: append, format, report ───────────────────────────────
  if (newCompanies.length > 0) {
    const rows = newCompanies.map(discoveredCompanyToRow);
    const appended = await sheets.appendRows(rows);
    console.log(`\nAppended ${appended} companies to Companies sheet`);
  } else {
    console.log("\nNo new companies to add");
  }

  await sheets.applyFormatting(
    COMPANY_SHEET_HEADERS.length,
    new Map([
      [3, 300], // Locations
      [8, 350], // Sample URL
    ]),
  );

  if (allErrors.length > 0) {
    console.log(`\nErrors (${allErrors.length}):`);
    for (const error of allErrors) {
      console.error(`  - ${error}`);
    }
  }

  console.log("\n=== Company Discovery Complete ===");
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
