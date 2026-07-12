import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getHeaderMap, indexToColumnLetter, batchUpdateCells, appendRow } from '@/lib/sheets';

const VENTAS_LAST_COL = 'R';

const VALID_STATUSES = ['Apartado', 'Sin cobertura', 'Pendiente'];
const VALID_ESTADOS = ['Apartado', 'Sin stock'];

// Campos que pueden actualizarse parcialmente en una fila existente de VENTAS.
const UPDATABLE_FIELDS: { body: string; column: string }[] = [
  { body: 'numOC', column: 'NUM_OC' },
  { body: 'cantidad', column: 'CANTIDAD' },
  { body: 'status', column: 'STATUS' },
  { body: 'estado', column: 'ESTADO' },
  { body: 'almacen', column: 'ALMACEN' },
];

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden asignar inventario' }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const {
    ovRowIndex,
    numOV,
    numOC,
    sku,
    cantidad,
    isFirstOC,
    status,
    estado,
    descripcion,
    fabricante,
    marca,
    lineaProducto,
    nombreProveedor,
    cliente,
    almacen,
    fechaEntrega,
    moneda,
  } = body;

  if (!Number.isInteger(Number(ovRowIndex)) || Number(ovRowIndex) < 2) {
    return NextResponse.json({ error: 'ovRowIndex inválido' }, { status: 400 });
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Valor de status no permitido' }, { status: 400 });
  }
  if (estado !== undefined && !VALID_ESTADOS.includes(estado)) {
    return NextResponse.json({ error: 'Valor de estado no permitido' }, { status: 400 });
  }
  // Al agregar una fila nueva para una OC adicional, numOC y cantidad son obligatorios.
  if (!isFirstOC && (!numOC || Number(cantidad) <= 0)) {
    return NextResponse.json({ error: 'numOC y cantidad son requeridos' }, { status: 400 });
  }

  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;
    const headerMap = await getHeaderMap(spreadsheetId, 'VENTAS', VENTAS_LAST_COL);

    const colOf = (name: string): string => {
      const idx = headerMap.get(name);
      if (idx === undefined) throw new Error(`Columna ${name} no encontrada en VENTAS`);
      return indexToColumnLetter(idx);
    };

    if (isFirstOC) {
      // Actualización parcial de la fila original: solo los campos presentes en el body.
      const bodyValues: Record<string, string | number | undefined> = {
        numOC, cantidad, status, estado, almacen,
      };
      const updates = UPDATABLE_FIELDS
        .filter(f => bodyValues[f.body] !== undefined)
        .map(f => ({
          range: `VENTAS!${colOf(f.column)}${ovRowIndex}`,
          value: f.body === 'cantidad' ? Number(bodyValues[f.body]) : bodyValues[f.body]!,
        }));

      if (updates.length === 0) {
        return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
      }

      await batchUpdateCells(spreadsheetId, updates);
    } else {
      // Agregar fila nueva para esta OC adicional
      const maxIdx = Math.max(...Array.from(headerMap.values()));
      const row: (string | number)[] = new Array(maxIdx + 1).fill('');

      const set = (name: string, value: string | number) => {
        const idx = headerMap.get(name);
        if (idx !== undefined) row[idx] = value;
      };

      set('NUM_OV', numOV ?? '');
      set('NUM_OC', numOC ?? '');
      set('SKU', sku ?? '');
      set('DESCRIPCION', descripcion ?? '');
      set('FABRICANTE', fabricante ?? '');
      set('MARCA', marca ?? '');
      set('LINEA_PRODUCTO', lineaProducto ?? '');
      set('NOMBRE_PROVEEDOR', nombreProveedor ?? '');
      set('CLIENTE', cliente ?? '');
      set('CANTIDAD', Number(cantidad));
      set('ALMACEN', almacen ?? '');
      set('FECHA_ENTREGA_CLIENTE', fechaEntrega ?? '');
      set('STATUS', status);
      set('ESTADO', estado);
      set('MONEDA', moneda ?? '');

      await appendRow(spreadsheetId, 'VENTAS', row);
    }

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
