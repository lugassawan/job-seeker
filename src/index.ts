import { BankNeoCrawler } from "./crawlers/bankneo.ts";
import type { BaseCrawler } from "./crawlers/base.ts";
import { BlibliCrawler } from "./crawlers/blibli.ts";
import { CompanyDirectCrawler } from "./crawlers/company-direct.ts";
import { JapanDevCrawler } from "./crawlers/japandev.ts";
import { JSearchCrawler } from "./crawlers/jsearch.ts";
import { KalibrrCrawler } from "./crawlers/kalibrr.ts";
import { RemoteOKCrawler } from "./crawlers/remoteok.ts";
import { RemotiveCrawler } from "./crawlers/remotive.ts";
import { TechInAsiaCrawler } from "./crawlers/techinasia.ts";
import { WeWorkRemotelyCrawler } from "./crawlers/weworkremotely.ts";
import { GoogleSheetsService } from "./services/google-sheets.ts";
import type { CrawlResult } from "./types.ts";
import { computeHashesFromRows, deduplicateJobs } from "./utils/dedup.ts";
import { filterJobs } from "./utils/filter.ts";

console.log("=== Job Crawler Starting ===");
console.log(`Time: ${new Date().toISOString()}`);

try {
  // 1. Initialize Google Sheets
  const sheets = GoogleSheetsService.fromEnv();
  await sheets.ensureHeaders();

  // 2. Read existing rows to build dedup hash set
  const existingRows = await sheets.getExistingRows();
  const existingHashes = computeHashesFromRows(existingRows);
  console.log(`Existing jobs in sheet: ${existingRows.length}`);

  // 3. Set up crawlers
  const crawlers: BaseCrawler[] = [
    new RemoteOKCrawler(),
    new RemotiveCrawler(),
    new CompanyDirectCrawler(),
    new JapanDevCrawler(),
    new WeWorkRemotelyCrawler(),
    new TechInAsiaCrawler(),
    new KalibrrCrawler(),
    new BlibliCrawler(),
    new BankNeoCrawler(),
  ];

  // JSearch requires API key — only add if configured
  const jsearchApiKey = process.env.OPENWEBNINJA_API_KEY || process.env.RAPIDAPI_KEY;
  if (jsearchApiKey) {
    crawlers.push(new JSearchCrawler(jsearchApiKey));
  } else {
    console.log("OPENWEBNINJA_API_KEY not set — skipping JSearch crawler");
  }

  // 4. Run all crawlers concurrently
  const results = await Promise.allSettled(crawlers.map((crawler) => crawler.crawl()));

  // 5. Collect results and errors
  const allJobs: CrawlResult["jobs"] = [];
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

  // 6. Filter for relevance and location
  const filtered = filterJobs(allJobs);
  console.log(`After filtering: ${filtered.length} jobs`);

  // 7. Deduplicate against existing sheet data and within batch
  const unique = deduplicateJobs(filtered, existingHashes);
  console.log(`After deduplication: ${unique.length} new jobs`);

  // 8. Append to Google Sheets
  if (unique.length > 0) {
    const appended = await sheets.appendJobs(unique);
    console.log(`Appended ${appended} jobs to Google Sheets`);
  } else {
    console.log("No new jobs to add");
  }

  // 9. Apply sheet formatting (after append so data rows are reset)
  await sheets.applyFormatting();

  // 10. Report errors
  if (allErrors.length > 0) {
    console.log(`\nErrors (${allErrors.length}):`);
    for (const error of allErrors) {
      console.error(`  - ${error}`);
    }
  }

  console.log("\n=== Job Crawler Complete ===");
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
