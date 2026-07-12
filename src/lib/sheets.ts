import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export async function getSheets() {
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient as any });
}

export async function getSheetData(spreadsheetId: string, range: string) {
  const sheets = await getSheets();

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

/** Escribe múltiples celdas en una sola llamada batch. */
export async function batchUpdateCells(
  spreadsheetId: string,
  updates: { range: string; value: string | number }[]
) {
  const sheets = await getSheets();

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
  const sheets = await getSheets();
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
