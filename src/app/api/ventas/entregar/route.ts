import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getHeaderMap, indexToColumnLetter, batchUpdateCells } from '@/lib/sheets';

const VENTAS_LAST_COL = 'R';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden marcar como entregado' }, { status: 403 });
  }

  let body: { rowIndex?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const rowIndex = Number(body.rowIndex);
  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    return NextResponse.json({ error: 'rowIndex inválido' }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;
    const headerMap = await getHeaderMap(spreadsheetId, 'VENTAS', VENTAS_LAST_COL);

    const idx = headerMap.get('STATUS');
    if (idx === undefined) {
      return NextResponse.json({ error: 'Columna STATUS no encontrada en VENTAS' }, { status: 500 });
    }

    await batchUpdateCells(spreadsheetId, [
      { range: `VENTAS!${indexToColumnLetter(idx)}${rowIndex}`, value: 'Entregado' },
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error PATCH /api/ventas/entregar:', error);
    const msg = error?.message ?? 'Error al actualizar VENTAS';
    if (String(msg).includes('403') || String(msg).includes('PERMISSION')) {
      return NextResponse.json(
        { error: 'Sin permisos de escritura en Google Sheets.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
