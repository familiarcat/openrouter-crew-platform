import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: 'N8N_WEBHOOK_URL not set. Configure .env.local and re-run.' }, { status: 400 });
  }

  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sync_categories' }) });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: true, data: j });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
