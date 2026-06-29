import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSheetData } from '@/lib/sheets';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku')?.trim();
  const oc = searchParams.get('oc')?.trim() ?? '';

  if (!sku) {
    return NextResponse.json({ error: 'Parámetro SKU requerido' }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;
    const rows = await getSheetData(spreadsheetId, 'VENTAS!A1:R10000');

    if (!rows.length) return NextResponse.json([]);

    const headers = rows[0] as string[];
    const idx = (name: string) => headers.findIndex(h => h.trim() === name);

    const iSKU = idx('SKU');
    const iNUM_OV = idx('NUM_OV');
    const iNUM_OC = idx('NUM_OC');
    const iCLIENTE = idx('CLIENTE');
    const iCANTIDAD = idx('CANTIDAD');
    const iFECHA = idx('FECHA_ENTREGA_CLIENTE');
    const iSTATUS = idx('STATUS');

    if (iSKU < 0 || iNUM_OV < 0 || iSTATUS < 0) {
      return NextResponse.json({ error: 'Estructura de hoja VENTAS inesperada' }, { status: 500 });
    }

    const skuNorm = sku.toUpperCase().trim();
    const ocNorm = oc.toUpperCase().trim();

    const result = rows.slice(1)
      .filter(row => {
        const rowSku = String(row[iSKU] ?? '').toUpperCase().trim();
        const status = String(row[iSTATUS] ?? '').toUpperCase().trim();
        if (rowSku !== skuNorm || status !== 'APARTADO') return false;
        if (ocNorm && String(row[iNUM_OC] ?? '').toUpperCase().trim() !== ocNorm) return false;
        return true;
      })
      .map(row => ({
        NUM_OV: String(row[iNUM_OV] ?? ''),
        CLIENTE: String(row[iCLIENTE] ?? ''),
        CANTIDAD: String(row[iCANTIDAD] ?? ''),
        FECHA_ENTREGA_CLIENTE: String(row[iFECHA] ?? ''),
        STATUS: String(row[iSTATUS] ?? ''),
      }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error GET /api/ventas:', error);
    return NextResponse.json({ error: 'Error al obtener datos de VENTAS' }, { status: 500 });
  }
}
