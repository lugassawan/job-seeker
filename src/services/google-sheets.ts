import { google, type sheets_v4 } from "googleapis";
import { type Job, jobToRow, SHEET_HEADERS } from "../types.ts";

export class GoogleSheetsService {
  private readonly sheets: sheets_v4.Sheets;
  private readonly spreadsheetId: string;
  private readonly sheetName: string;

  constructor(sheets: sheets_v4.Sheets, spreadsheetId: string, sheetName: string) {
    this.sheets = sheets;
    this.spreadsheetId = spreadsheetId;
    this.sheetName = sheetName;
  }

  static fromEnv(): GoogleSheetsService {
    const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!keyBase64) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set");
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error("GOOGLE_SHEET_ID env var is not set");
    }

    const sheetName = process.env.GOOGLE_SHEET_NAME || "Jobs";

    const keyJson = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));

    const auth = new google.auth.GoogleAuth({
      credentials: keyJson,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    return new GoogleSheetsService(sheets, spreadsheetId, sheetName);
  }

  private range(range?: string): string {
    return range ? `${this.sheetName}!${range}` : this.sheetName;
  }

  async ensureHeaders(): Promise<void> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.range("A1:M1"),
    });

    const firstRow = res.data.values?.[0];

    if (!firstRow || firstRow.length === 0) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: this.range("A1:M1"),
        valueInputOption: "RAW",
        requestBody: {
          values: [SHEET_HEADERS as unknown as string[]],
        },
      });
      console.log("Headers written to sheet");
    }
  }

  async getExistingRows(): Promise<string[][]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: this.range("A2:M"),
    });

    return (res.data.values as string[][] | undefined) ?? [];
  }

  async appendJobs(jobs: Job[]): Promise<number> {
    if (jobs.length === 0) return 0;

    const rows = jobs.map(jobToRow);

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: this.range("A:M"),
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: rows,
      },
    });

    return rows.length;
  }
}
