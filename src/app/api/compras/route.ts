import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSheetData } from '@/lib/sheets';

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.');
  return Number(normalized) || 0;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku')?.trim();

  if (!sku) {
    return NextResponse.json({ error: 'Parámetro SKU requerido' }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;
    const rows = await getSheetData(spreadsheetId, 'COMPRAS!A1:V10000');

    if (!rows.length) return NextResponse.json([]);

    const headers = rows[0] as string[];

    // Índices de columnas por nombre (dinámico, no hardcodeado)
    const idx = (name: string) => headers.findIndex(h => h.trim() === name);

    const iSKU = idx('SKU');
    const iNUM_OC = idx('NUM_OC');
    const iALMACEN = idx('ALMACEN');
    const iDISPONIBLE = idx('CANTIDAD_DISPONIBLE');
    const iAPARTADA = idx('CANTIDAD_APARTADA');
    const iPRECIO = idx('PRECIO_UNITARIO');
    const iMONEDA = idx('MONEDA');

    if (iSKU < 0 || iDISPONIBLE < 0 || iAPARTADA < 0) {
      return NextResponse.json({ error: 'Estructura de hoja COMPRAS inesperada' }, { status: 500 });
    }

    const skuNorm = sku.toUpperCase().trim();

    const result = rows.slice(1)
      .map((row, arrayIndex) => ({
        rowIndexInSheet: arrayIndex + 2,
        SKU: String(row[iSKU] ?? '').toUpperCase().trim(),
        NUM_OC: String(row[iNUM_OC] ?? ''),
        ALMACEN: String(row[iALMACEN] ?? ''),
        CANTIDAD_DISPONIBLE: toNumber(row[iDISPONIBLE]),
        CANTIDAD_APARTADA: toNumber(row[iAPARTADA]),
        PRECIO_UNITARIO: String(row[iPRECIO] ?? ''),
        MONEDA: String(row[iMONEDA] ?? ''),
      }))
      .filter(r => r.SKU === skuNorm && r.CANTIDAD_DISPONIBLE > 0);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error GET /api/compras:', error);
    return NextResponse.json({ error: 'Error al obtener stock de COMPRAS' }, { status: 500 });
  }
}
