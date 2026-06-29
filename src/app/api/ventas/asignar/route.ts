import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getHeaderMap, indexToColumnLetter, batchUpdateCells } from '@/lib/sheets';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden actualizar OVs' }, { status: 403 });
  }

  let body: { rowIndex?: unknown; status?: unknown; estado?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const rowIndex = Number(body.rowIndex);
  const status = String(body.status ?? '').trim();
  const estado = String(body.estado ?? '').trim();

  if (!Number.isInteger(rowIndex) || rowIndex < 2) {
    return NextResponse.json({ error: 'rowIndex inválido' }, { status: 400 });
  }
  if (!status || !estado) {
    return NextResponse.json({ error: 'status y estado son requeridos' }, { status: 400 });
  }

  const VALID_STATUSES = ['Apartado', 'Sin cobertura'];
  const VALID_ESTADOS = ['Apartado', 'Sin stock'];
  if (!VALID_STATUSES.includes(status) || !VALID_ESTADOS.includes(estado)) {
    return NextResponse.json({ error: 'Valores de status/estado no permitidos' }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;

    const headerMap = await getHeaderMap(spreadsheetId, 'VENTAS', 'R');

    const iSTATUS = headerMap.get('STATUS');
    const iESTADO = headerMap.get('ESTADO');

    if (iSTATUS === undefined || iESTADO === undefined) {
      return NextResponse.json({ error: 'Columnas STATUS / ESTADO no encontradas en VENTAS' }, { status: 500 });
    }

    const colStatus = indexToColumnLetter(iSTATUS);
    const colEstado = indexToColumnLetter(iESTADO);

    await batchUpdateCells(spreadsheetId, [
      { range: `VENTAS!${colStatus}${rowIndex}`, value: status },
      { range: `VENTAS!${colEstado}${rowIndex}`, value: estado },
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error PATCH /api/ventas/asignar:', error);
    const msg = error?.message ?? 'Error al actualizar VENTAS';
    if (String(msg).includes('403') || String(msg).includes('PERMISSION')) {
      return NextResponse.json(
        { error: 'Sin permisos de escritura. El token debe ser regenerado con scope spreadsheets (no readonly).' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
