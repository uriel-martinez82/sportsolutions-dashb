import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSheetData, getHeaderMap, indexToColumnLetter, batchUpdateCells } from '@/lib/sheets';

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.');
  return Number(normalized) || 0;
}

/** Ubica el rowIndex (1-based, con encabezado) de una fila de COMPRAS por SKU + NUM_OC. */
async function findRowIndexBySkuAndOC(spreadsheetId: string, sku: string, numOC: string): Promise<number | null> {
  const rows = await getSheetData(spreadsheetId, 'COMPRAS!A1:V10000');
  if (!rows.length) return null;

  const headers = rows[0] as string[];
  const idx = (name: string) => headers.findIndex(h => h.trim() === name);
  const iSKU = idx('SKU');
  const iNUM_OC = idx('NUM_OC');
  if (iSKU < 0 || iNUM_OC < 0) return null;

  const skuNorm = sku.toUpperCase().trim();
  const numOCNorm = numOC.trim();
  const arrayIndex = rows.slice(1).findIndex(row =>
    String(row[iSKU] ?? '').toUpperCase().trim() === skuNorm &&
    String(row[iNUM_OC] ?? '').trim() === numOCNorm
  );

  return arrayIndex === -1 ? null : arrayIndex + 2;
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden asignar inventario' }, { status: 403 });
  }

  let body: { rowIndex?: unknown; sku?: unknown; numOC?: unknown; cantidadAsignar?: unknown; revertir?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const cantidadAsignar = Number(body.cantidadAsignar);
  const revertir = body.revertir === true;

  if (!Number.isFinite(cantidadAsignar) || cantidadAsignar <= 0) {
    return NextResponse.json({ error: 'cantidadAsignar debe ser > 0' }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;

    // rowIndex explícito (flujo normal de asignación) o lookup por SKU+NUM_OC (reversión al cancelar)
    let rowIndex: number;
    if (body.rowIndex !== undefined) {
      rowIndex = Number(body.rowIndex);
      if (!Number.isInteger(rowIndex) || rowIndex < 2) {
        return NextResponse.json({ error: 'rowIndex inválido' }, { status: 400 });
      }
    } else {
      const sku = String(body.sku ?? '').trim();
      const numOC = String(body.numOC ?? '').trim();
      if (!sku || !numOC) {
        return NextResponse.json({ error: 'rowIndex o (sku + numOC) son requeridos' }, { status: 400 });
      }
      const found = await findRowIndexBySkuAndOC(spreadsheetId, sku, numOC);
      if (found === null) {
        return NextResponse.json({ error: `No se encontró la OC ${numOC} para el SKU ${sku} en COMPRAS` }, { status: 404 });
      }
      rowIndex = found;
    }

    // Encontrar índices de columnas dinámicamente
    const headerMap = await getHeaderMap(spreadsheetId, 'COMPRAS', 'V');

    const iDISPONIBLE = headerMap.get('CANTIDAD_DISPONIBLE');
    const iAPARTADA = headerMap.get('CANTIDAD_APARTADA');

    if (iDISPONIBLE === undefined || iAPARTADA === undefined) {
      return NextResponse.json({ error: 'Columnas CANTIDAD_DISPONIBLE / CANTIDAD_APARTADA no encontradas en COMPRAS' }, { status: 500 });
    }

    const colDisp = indexToColumnLetter(iDISPONIBLE);
    const colApart = indexToColumnLetter(iAPARTADA);

    // Leer valores actuales de esa fila
    const [dispRows, apartRows] = await Promise.all([
      getSheetData(spreadsheetId, `COMPRAS!${colDisp}${rowIndex}:${colDisp}${rowIndex}`),
      getSheetData(spreadsheetId, `COMPRAS!${colApart}${rowIndex}:${colApart}${rowIndex}`),
    ]);

    const currentDisponible = toNumber(dispRows[0]?.[0]);
    const currentApartada = toNumber(apartRows[0]?.[0]);

    let newDisponible: number;
    let newApartada: number;

    if (revertir) {
      // Reversión (cancelación): devolver a disponible, restar de apartada
      newDisponible = currentDisponible + cantidadAsignar;
      newApartada = Math.max(0, currentApartada - cantidadAsignar);
    } else {
      // Validación server-side: no asignar más de lo disponible
      if (cantidadAsignar > currentDisponible) {
        return NextResponse.json(
          { error: `Stock insuficiente: disponible=${currentDisponible}, solicitado=${cantidadAsignar}` },
          { status: 409 }
        );
      }
      newDisponible = currentDisponible - cantidadAsignar;
      newApartada = currentApartada + cantidadAsignar;
    }

    await batchUpdateCells(spreadsheetId, [
      { range: `COMPRAS!${colDisp}${rowIndex}`, value: newDisponible },
      { range: `COMPRAS!${colApart}${rowIndex}`, value: newApartada },
    ]);

    return NextResponse.json({ success: true, newDisponible, newApartada });
  } catch (error: any) {
    console.error('Error PATCH /api/compras/asignar:', error);
    const msg = error?.message ?? 'Error al actualizar COMPRAS';
    // Error de permisos de Google Sheets
    if (String(msg).includes('403') || String(msg).includes('PERMISSION')) {
      return NextResponse.json(
        { error: 'Sin permisos de escritura en Google Sheets. El token debe ser regenerado con scope spreadsheets (no readonly).' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
