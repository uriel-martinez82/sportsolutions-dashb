import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

function toObjects(rows: any[][], withRowIndex = false): Record<string, string>[] {
  if (!rows.length) return [];

  const headers = rows[0];

  return rows.slice(1).map((row, arrayIndex) => {
    const obj: Record<string, string> = {};
    headers.forEach((header: string, i: number) => {
      obj[header] = row[i] || '';
    });
    // _rowIndex se agrega como número; el cast es intencional para serializar como JSON correctamente
    if (withRowIndex) (obj as Record<string, string | number>)._rowIndex = arrayIndex + 2;
    return obj;
  });
}

function toNumber(value: string) {
  if (!value) return 0;

  const normalized = String(value)
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');

  return Number(normalized) || 0;
}

export async function GET() {
  try {
    const spreadsheetId = process.env.NUEVO_MADRE_ID!;

    const [comprasRows, ventasRows] = await Promise.all([
      getSheetData(spreadsheetId, 'COMPRAS!A1:V10000'),
      getSheetData(spreadsheetId, 'VENTAS!A1:R10000'),
    ]);

    const compras = toObjects(comprasRows).filter(r => String(r.NUM_OC ?? '').trim() && String(r.SKU ?? '').trim());
    // Solo requerir NUM_OV — filas sin SKU deben mostrarse en la tabla de OVs
    const ventas = toObjects(ventasRows, true).filter(r => String(r.NUM_OV ?? '').trim());

    const ovsPendientes = ventas.filter(v => {
      const status = (v.STATUS || '').toUpperCase().trim();
      return status !== 'ENTREGADO' && status !== 'CANCELADO';
    });

    const totalComprado = compras.reduce(
      (sum, r) => sum + toNumber(r.CANTIDAD_COMPRADA),
      0
    );

    const totalDisponible = compras.reduce(
      (sum, r) => sum + toNumber(r.CANTIDAD_DISPONIBLE),
      0
    );

    const totalApartado = compras.reduce(
      (sum, r) => sum + toNumber(r.CANTIDAD_APARTADA),
      0
    );

    const inventarioMap = new Map<string, any>();

    for (const r of compras) {
      const key = [
        r.SKU || '',
        r.DESCRIPCION || '',
        r.MARCA || '',
        r.LINEA_PRODUCTO || '',
        r.ALMACEN || '',
      ].join('|');

      if (!inventarioMap.has(key)) {
        inventarioMap.set(key, {
          SKU: r.SKU || '',
          DESCRIPCION: r.DESCRIPCION || '',
          FABRICANTE: r.FABRICANTE || '',
          NOMBRE_PROVEEDOR: r.NOMBRE_PROVEEDOR || '',
          MARCA: r.MARCA || '',
          LINEA_PRODUCTO: r.LINEA_PRODUCTO || '',
          ALMACEN: r.ALMACEN || '',
          CANTIDAD_COMPRADA: 0,
          CANTIDAD_DISPONIBLE: 0,
          CANTIDAD_APARTADA: 0,
          OCS: [],
        });
      }

      const item = inventarioMap.get(key);

      item.CANTIDAD_COMPRADA += toNumber(r.CANTIDAD_COMPRADA);
      item.CANTIDAD_DISPONIBLE += toNumber(r.CANTIDAD_DISPONIBLE);
      item.CANTIDAD_APARTADA += toNumber(r.CANTIDAD_APARTADA);

      item.OCS.push({
        NUM_OC: r.NUM_OC || '',
        CANTIDAD_COMPRADA: toNumber(r.CANTIDAD_COMPRADA),
        CANTIDAD_DISPONIBLE: toNumber(r.CANTIDAD_DISPONIBLE),
        CANTIDAD_APARTADA: toNumber(r.CANTIDAD_APARTADA),
        PRECIO_UNITARIO: r.PRECIO_UNITARIO || '',
        PRECIO_FOB: r.PRECIO_FOB || '',
        MONEDA: r.MONEDA || '',
        FECHA_OC: r.FECHA_OC || '',
        FECHA_EMBARQUE: r.FECHA_EMBARQUE || '',
        FECHA_LLEGADA_BODEGA: r.FECHA_LLEGADA_BODEGA || '',
        ESTADO: r.ESTADO || '',
        ALMACEN: r.ALMACEN || '',
        OBSERVACIONES: r.OBSERVACIONES || '',
      });
    }

    const inventario = Array.from(inventarioMap.values()).sort(
      (a, b) => b.CANTIDAD_DISPONIBLE - a.CANTIDAD_DISPONIBLE
    );

    return NextResponse.json({
      compras,
      ventas,
      ovsPendientes,
      inventario,
      overview: {
        totalComprado,
        totalDisponible,
        totalApartado,
        totalOVsPendientes: new Set(ovsPendientes.map(v => v.NUM_OV)).size,
        totalSKUs: new Set(compras.map(c => c.SKU).filter(Boolean)).size,
        totalOCs: new Set(compras.map(c => c.NUM_OC).filter(Boolean)).size,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}