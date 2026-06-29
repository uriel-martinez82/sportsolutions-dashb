import { google } from 'googleapis';

function buildAuthClient() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
  oAuth2Client.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return oAuth2Client;
}

export async function getAuthClient() {
  return buildAuthClient();
}

export async function getSheetData(spreadsheetId: string, range: string) {
  const auth = buildAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

/** Convierte índice 0-based a letra de columna (0=A, 25=Z, 26=AA…) */
export function indexToColumnLetter(index: number): string {
  let letter = '';
  let n = index;
  do {
    letter = String.fromCharCode(65 + (n % 26)) + letter;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letter;
}

/**
 * Escribe múltiples celdas en una sola llamada batch.
 * Requiere que token.json haya sido generado con scope
 * https://www.googleapis.com/auth/spreadsheets (no readonly).
 */
export async function batchUpdateCells(
  spreadsheetId: string,
  updates: { range: string; value: string | number }[]
) {
  const auth = buildAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updates.map(u => ({
        range: u.range,
        values: [[u.value]],
      })),
    },
  });
}

/** Agrega una fila al final de la hoja. */
export async function appendRow(
  spreadsheetId: string,
  sheet: string,
  values: (string | number)[]
) {
  const auth = buildAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheet}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

/** Lee la fila de encabezados de una hoja y devuelve un mapa nombre→índice. */
export async function getHeaderMap(
  spreadsheetId: string,
  sheet: string,
  lastCol: string
): Promise<Map<string, number>> {
  const rows = await getSheetData(spreadsheetId, `${sheet}!A1:${lastCol}1`);
  const headers: string[] = (rows[0] as string[]) ?? [];
  const map = new Map<string, number>();
  headers.forEach((h, i) => { if (h) map.set(h.trim(), i); });
  return map;
}