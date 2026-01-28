import { NextResponse } from 'next/server';
import { appendFeedback, appendEvent } from '../../../lib/store';

export async function POST(req: Request) {
  const body = await req.json();
  const fb = { ...body, at: new Date().toISOString() };
  await appendFeedback(fb);
  await appendEvent({ type:'feedback', at: fb.at, helpful: fb.helpful });
  return NextResponse.json({ ok: true });
}
