import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function readJSON(file: string) {
  try { return JSON.parse(await readFile(file, 'utf-8')); } catch { return []; }
}
async function writeJSON(file: string, data: any) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(req: Request) {
  const { title, text } = await req.json();
  const file = path.join(process.cwd(), 'data', 'user_notes.json');
  const arr = await readJSON(file);
  const note = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title, text, at: new Date().toISOString() };
  arr.push(note);
  await writeJSON(file, arr);
  return NextResponse.json({ ok: true, note });
}
