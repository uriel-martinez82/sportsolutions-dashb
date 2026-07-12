import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSheetData, indexToColumnLetter, batchUpdateCells } from '@/lib/sheets';

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.');
  return Number(normalized) || 0;
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden marcar como entregado' }, { status: 403 });
  }

  let body: { sku?: unknown; numOC?: unknown; cantidad?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const sku = String(body.sku ?? '').trim();
  const numOC = String(body.numOC ?? '').trim();
  const cantidad = Number(body.cantidad);

  if (!sku || !numOC) {
    return NextResponse.json({ error: 'sku y numOC son requeridos' }, { status: 400 });
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return NextResponse.json({ error: 'cantidad debe ser > 0' }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;
    const rows = await getSheetData(spreadsheetId, 'COMPRAS!A1:V10000');
    if (!rows.length) {
      return NextResponse.json({ error: 'Hoja COMPRAS vacía' }, { status: 500 });
    }

    const headers = rows[0] as string[];
    const idx = (name: string) => headers.findIndex(h => h.trim() === name);

    const iSKU = idx('SKU');
    const iNUM_OC = idx('NUM_OC');
    const iAPARTADA = idx('CANTIDAD_APARTADA');

    if (iSKU < 0 || iNUM_OC < 0 || iAPARTADA < 0) {
      return NextResponse.json({ error: 'Estructura de hoja COMPRAS inesperada' }, { status: 500 });
    }

    const skuNorm = sku.toUpperCase();
    const rowArrayIndex = rows.slice(1).findIndex(row =>
      String(row[iSKU] ?? '').toUpperCase().trim() === skuNorm &&
      String(row[iNUM_OC] ?? '').trim() === numOC
    );

    if (rowArrayIndex === -1) {
      return NextResponse.json({ error: `No se encontró la OC ${numOC} para el SKU ${sku} en COMPRAS` }, { status: 404 });
    }

    const rowIndex = rowArrayIndex + 2;
    const currentApartada = toNumber(rows[rowArrayIndex + 1][iAPARTADA]);
    const newApartada = Math.max(0, currentApartada - cantidad);

    await batchUpdateCells(spreadsheetId, [
      { range: `COMPRAS!${indexToColumnLetter(iAPARTADA)}${rowIndex}`, value: newApartada },
    ]);

    return NextResponse.json({ success: true, newApartada });
  } catch (error: any) {
    console.error('Error PATCH /api/compras/entregar:', error);
    const msg = error?.message ?? 'Error al actualizar COMPRAS';
    if (String(msg).includes('403') || String(msg).includes('PERMISSION')) {
      return NextResponse.json(
        { error: 'Sin permisos de escritura en Google Sheets.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
