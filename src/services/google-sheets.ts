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

  private async getSheetId(): Promise<number> {
    const res = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: "sheets.properties",
    });

    const sheet = res.data.sheets?.find((s) => s.properties?.title === this.sheetName);
    return sheet?.properties?.sheetId ?? 0;
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

  async applyFormatting(): Promise<void> {
    const sheetId = await this.getSheetId();
    const descriptionColumnIndex = SHEET_HEADERS.indexOf("Description");

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: false, foregroundColor: { red: 0, green: 0, blue: 0 } },
                  backgroundColor: { red: 1, green: 1, blue: 1 },
                  verticalAlignment: "MIDDLE",
                  wrapStrategy: "WRAP",
                },
              },
              fields:
                "userEnteredFormat(textFormat,backgroundColor,verticalAlignment,wrapStrategy)",
            },
          },
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: SHEET_HEADERS.length,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  backgroundColor: { red: 0.2, green: 0.46, blue: 0.85 },
                  horizontalAlignment: "CENTER",
                  verticalAlignment: "MIDDLE",
                  wrapStrategy: "WRAP",
                },
              },
              fields:
                "userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy)",
            },
          },
          {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: descriptionColumnIndex,
                endIndex: descriptionColumnIndex + 1,
              },
              properties: { pixelSize: 400 },
              fields: "pixelSize",
            },
          },
        ],
      },
    });
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
