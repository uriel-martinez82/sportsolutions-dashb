import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSheetData, getHeaderMap, indexToColumnLetter, batchUpdateCells } from '@/lib/sheets';

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const normalized = String(value).trim().replace(/\./g, '').replace(',', '.');
  return Number(normalized) || 0;
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden asignar inventario' }, { status: 403 });
  }

  let body: { rowIndex?: unknown; cantidadAsignar?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const rowIndex = Number(body.rowIndex);
  const cantidadAsignar = Number(body.cantidadAsignar);

  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    return NextResponse.json({ error: 'rowIndex inválido' }, { status: 400 });
  }
  if (!Number.isFinite(cantidadAsignar) || cantidadAsignar <= 0) {
    return NextResponse.json({ error: 'cantidadAsignar debe ser > 0' }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;

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

    // Validación server-side: no asignar más de lo disponible
    if (cantidadAsignar > currentDisponible) {
      return NextResponse.json(
        { error: `Stock insuficiente: disponible=${currentDisponible}, solicitado=${cantidadAsignar}` },
        { status: 409 }
      );
    }

    const newDisponible = currentDisponible - cantidadAsignar;
    const newApartada = currentApartada + cantidadAsignar;

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
