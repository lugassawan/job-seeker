import { COMPANY_WATCHLIST } from "./config/companies.ts";
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
import type { Job } from "./types.ts";
import { COMPANY_SHEET_HEADERS, discoveredCompanyToRow } from "./types.ts";
import { aggregateCompanies } from "./utils/company-aggregator.ts";
import { normalizeCompanyName } from "./utils/company-name.ts";

const probeAtsFlag = process.argv.includes("--probe-ats") || process.argv.includes("--ats");

console.log("=== Company Discovery Starting ===");
console.log(`Time: ${new Date().toISOString()}`);
if (probeAtsFlag) {
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

  // 3. Set up discovery crawlers (not CompanyDirect, Blibli, BankNeo)
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

  // 4. Run all crawlers concurrently
  const results = await Promise.allSettled(crawlers.map((crawler) => crawler.crawl()));

  const allJobs: Job[] = [];
  const allErrors: string[] = [];

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

  // 5. Aggregate companies from all jobs
  const discovered = aggregateCompanies(allJobs);
  console.log(`Unique companies found: ${discovered.length}`);

  // 6. Filter out known companies
  const newCompanies = discovered.filter(
    (company) => !excludedNames.has(normalizeCompanyName(company.name)),
  );
  console.log(`New companies after exclusion: ${newCompanies.length}`);

  // 7. Optionally probe ATS platforms
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

  // 8. Append to Companies sheet
  if (newCompanies.length > 0) {
    const rows = newCompanies.map(discoveredCompanyToRow);
    const appended = await sheets.appendRows(rows);
    console.log(`\nAppended ${appended} companies to Companies sheet`);
  } else {
    console.log("\nNo new companies to add");
  }

  // 9. Apply sheet formatting (matching Jobs sheet style)
  await sheets.applyFormatting(
    COMPANY_SHEET_HEADERS.length,
    new Map([
      [3, 300], // Locations
      [8, 350], // Sample URL
    ]),
  );

  // 10. Report errors
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
