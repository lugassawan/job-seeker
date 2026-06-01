import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Anchored to repo root via process.cwd() — robust regardless of where this file lives.
const WORKFLOWS_DIR = join(process.cwd(), ".github/workflows");

function readWorkflowFiles(): Array<{ name: string; content: string }> {
  return readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => ({ name: f, content: readFileSync(join(WORKFLOWS_DIR, f), "utf-8") }));
}

describe("GitHub Actions workflows", () => {
  test("no workflow references the TOS-blocked gautamkrishnar/keepalive-workflow action", () => {
    const violations = readWorkflowFiles().filter(({ content }) =>
      content.includes("gautamkrishnar/keepalive-workflow"),
    );
    expect(violations.map((v) => v.name)).toEqual([]);
  });

  // Smoke-check: crawl.yml must add crawl-logs/ and commit with [skip ci] so GitHub does not
  // auto-disable the scheduled workflow after 60 days of repo inactivity.
  test("crawl.yml commits to crawl-logs with [skip ci] to keep repo active", () => {
    const crawl = readWorkflowFiles().find(({ name }) => name === "crawl.yml");
    expect(crawl).toBeDefined();
    expect(crawl?.content).toContain("crawl-logs/");
    expect(crawl?.content).toContain("[skip ci]");
  });
});
