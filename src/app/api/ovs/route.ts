import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

const normalizarBodega = (val: string): string => {
  const v = val.toUpperCase().trim();
  if (v.includes('PROVA GDL') || v.includes('PORVA GDL') || v.includes('BODEGA PROVA GDL')) return 'PROVA GDL';
  if (v.includes('CICE CDMX') || v.includes('CICE MX') || v.includes('BODEGA CICE')) return 'CICE CDMX';
  if (v.includes('PROVA CDMX') || v.includes('BODEGA PROVA MX')) return 'PROVA CDMX';
  if (v.includes('LOGISTORAGE') || v.includes('APARTADO LS')) return 'LOGISTORAGE GDL';
  if (v.includes('TRANSITO') || v.includes('TRÁNSITO')) return 'EN TRÁNSITO';
  if (v.includes('OFICINA GDL') || v.includes('OFICINA GUADALAJARA')) return 'OFICINA GDL';
  if (v.includes('SIN STOCK') || v.includes('FALTA COMPRAR') || v.includes('COMPRAR')) return 'SIN STOCK';
  if (v.includes('CANCELAD')) return 'CANCELADO';
  if (v === '' || v === '-') return 'Sin asignar';
  return 'Otros';
};

export async function GET() {
  try {
    const rows = await getSheetData(
      process.env.NUEVO_MADRE_ID!,
      'VENTAS!A1:R6000'
    );

    if (rows.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    // KPIs
    const totalOVs = new Set(data.map(r => r.NUM_OV)).size;
    const totalUnidades = data.reduce((sum, r) => sum + (parseInt(r.CANTIDAD) || 0), 0);

    const sinStock = data
      .filter(r => normalizarBodega(r.BODEGA || '') === 'SIN STOCK')
      .reduce((sum, r) => sum + (parseInt(r.CANTIDAD) || 0), 0);

    const enTransito = data
      .filter(r => normalizarBodega(r.BODEGA || '') === 'EN TRÁNSITO')
      .reduce((sum, r) => sum + (parseInt(r.CANTIDAD) || 0), 0);

    // Gráfico por Bodega — normalizado
    const porBodegaMap = data.reduce((acc, r) => {
      const bodega = normalizarBodega(r.BODEGA || '');
      acc[bodega] = (acc[bodega] || 0) + (parseInt(r.CANTIDAD) || 0);
      return acc;
    }, {} as Record<string, number>);

    const porBodega = Object.entries(porBodegaMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Gráfico por Status — agrupar menores en "Otros"
    const totalRegistros = data.length;
    const porStatusRaw = data.reduce((acc, r) => {
      const status = r.STATUS?.trim() || 'Sin status';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const porStatus = Object.entries(porStatusRaw)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [name, value]) => {
        const pct = value / totalRegistros;
        if (pct >= 0.01) {
          acc.push({ name, value });
        } else {
          const otros = acc.find(x => x.name === 'Otros');
          if (otros) otros.value += value;
          else acc.push({ name: 'Otros', value });
        }
        return acc;
      }, [] as { name: string; value: number }[]);

    return NextResponse.json({
      data,
      stats: {
        totalOVs,
        totalUnidades,
        sinStock,
        enTransito,
        porBodega,
        porStatus,
      }
    });

  } catch (error) {
    console.error('Error fetching OVs:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}