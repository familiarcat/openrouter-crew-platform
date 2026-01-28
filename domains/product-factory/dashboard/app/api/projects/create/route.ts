import { NextResponse } from 'next/server';
import { appendEvent } from '../../../../lib/store';

export async function POST(req: Request) {
  const body = await req.json();
  const webhook = process.env.N8N_PROJECT_WEBHOOK_URL; // optional
  const payload = {
    action: 'create_project',
    category: body.category || null,
    name: body.name || 'New project',
    draft: body.draft || '',
    // Provide only non-secret inputs. n8n should pull secrets from its own vault/credentials.
  };

  await appendEvent({ type: 'project_create_requested', at: new Date().toISOString(), payload: { category: payload.category, name: payload.name } });

  if (!webhook) {
    // Local stub: acknowledge but do not create on filesystem.
    return NextResponse.json({ ok: true, queued: false, note: 'N8N_PROJECT_WEBHOOK_URL not set; logged event only.' });
  }

  try {
    const r = await fetch(webhook, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    await appendEvent({ type: 'project_create_webhook', at: new Date().toISOString(), status: r.status, response: j });
    return NextResponse.json({ ok: true, queued: true, response: j });
  } catch (e: any) {
    await appendEvent({ type: 'project_create_error', at: new Date().toISOString(), error: e?.message || String(e) });
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
