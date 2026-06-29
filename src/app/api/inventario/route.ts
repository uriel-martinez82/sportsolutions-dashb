import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

export async function GET() {
  try {
    const rows = await getSheetData(
      process.env.NUEVO_MADRE_ID!,
      'COMPRAS!A1:U6000'
    );

    if (rows.length === 0) {
      return NextResponse.json({ data: [], stats: {} });
    }

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    const totalDisponible = data.reduce((sum, r) => 
      sum + (parseInt(r.TOTAL_DISPONIBLE) || 0), 0);
    const totalTransito = data.reduce((sum, r) => 
      sum + (parseInt(r.EN_TRANSITO) || 0), 0);
    const totalSKUs = data.length;

    const porMarca = data.reduce((acc, r) => {
      const marca = r.MARCA || 'Sin marca';
      acc[marca] = (acc[marca] || 0) + (parseInt(r.TOTAL_DISPONIBLE) || 0);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      data,
      stats: {
        totalDisponible,
        totalTransito,
        totalSKUs,
        porMarca: Object.entries(porMarca)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
      }
    });

  } catch (error) {
    console.error('Error fetching inventario:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}