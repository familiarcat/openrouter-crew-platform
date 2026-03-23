
import { execFile } from 'child_process';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, encoding: 'utf8' }, (error, stdout, stderr) => {
      // Ensure code is a number. ExecException code can be string or number.
      const exitCode = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
      resolve({ code: exitCode, stdout: stdout?.toString() || '', stderr: stderr?.toString() || '' });
    });
  });
}

export async function POST(req: NextRequest) {
  const authKey = process.env.CREW_OBS_KEY || process.env.CREW_KEY || '';
  const provided = req.headers.get('x-crew-key') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!authKey || provided !== authKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => ({})) as unknown;
  const body = (typeof rawBody === 'object' && rawBody !== null) ? rawBody as Record<string, unknown> : {};

  const url: string = String(body.url || '').trim();
  const framesInput = body.frames;
  const frames = (typeof framesInput === 'number' && Number.isFinite(framesInput)) ? framesInput : undefined;

  if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  if (!/youtube\.com|youtu\.be/.test(url)) {
    return NextResponse.json({ error: 'only youtube supported' }, { status: 400 });
  }

  const repoRoot = path.resolve(process.cwd(), '../../..');
  const enrichScript = path.join(repoRoot, 'scripts', 'enrich-youtube-to-rag.js');

  // 1) Enrich & Save directly to Supabase
  const enrichArgs = [enrichScript, url];
  if (typeof frames === 'number') enrichArgs.push(`--frames=${frames}`);
  const e1 = await run('node', enrichArgs, repoRoot);
  if (e1.code !== 0) {
    return NextResponse.json({ error: 'enrich_failed', details: e1.stderr || e1.stdout }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Ingested to Supabase', details: e1.stdout });
}
