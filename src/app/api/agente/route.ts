import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Anthropic from '@anthropic-ai/sdk';
import { authOptions } from '@/lib/auth';
import { getSheetData } from '@/lib/sheets';
import { GET as getInventario } from '../inventario/route';
import { GET as getOvs } from '../ovs/route';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Sos el asistente de Sport Solutions México, un sistema de gestión de inventario de equipamiento deportivo. Tenés acceso a los datos en tiempo real del inventario, órdenes de venta y órdenes de compra. Respondé de forma concisa y útil. Usá los datos proporcionados para responder preguntas específicas sobre stock, OVs y OCs. Si no encontrás la información solicitada en los datos, decilo claramente.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    !!value &&
    typeof value === 'object' &&
    ((value as ChatMessage).role === 'user' || (value as ChatMessage).role === 'assistant') &&
    typeof (value as ChatMessage).content === 'string'
  );
}

/** Datos frescos de COMPRAS (mismas columnas que usa /api/compras, sin filtrar por SKU). */
async function getComprasContext(): Promise<Record<string, string>[]> {
  const spreadsheetId = process.env.NUEVO_MADRE_ID!;
  const rows = await getSheetData(spreadsheetId, 'COMPRAS!A1:V10000');
  if (!rows.length) return [];

  const headers = rows[0] as string[];
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = String(row[i] ?? ''); });
    return obj;
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const history: ChatMessage[] = Array.isArray(body.history) ? body.history.filter(isChatMessage) : [];

  if (!message) {
    return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no está configurada' }, { status: 500 });
  }

  try {
    const [inventarioRes, ovsRes, compras] = await Promise.all([
      getInventario(),
      getOvs(),
      getComprasContext(),
    ]);

    const inventarioJson = await inventarioRes.json();
    const ovsJson = await ovsRes.json();

    const contextBlock = [
      'DATOS ACTUALES DEL SISTEMA (JSON):',
      '',
      'INVENTARIO:',
      JSON.stringify(inventarioJson.data ?? []),
      '',
      'ORDENES DE VENTA (OVs):',
      JSON.stringify(ovsJson.data ?? []),
      '',
      'ORDENES DE COMPRA (OCs):',
      JSON.stringify(compras),
    ].join('\n');

    const anthropic = new Anthropic();

    const messages: Anthropic.MessageParam[] = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: `${contextBlock}\n\nPregunta del usuario: ${message}` },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const reply = textBlock && textBlock.type === 'text' ? textBlock.text : '';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error POST /api/agente:', error);
    return NextResponse.json({ error: error?.message ?? 'Error al consultar el asistente' }, { status: 500 });
  }
}
