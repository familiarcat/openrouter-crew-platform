import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function readJSON(file: string) {
  try {
    const t = await readFile(file, 'utf-8');
    return JSON.parse(t);
  } catch {
    return [];
  }
}

async function writeJSON(file: string, data: any) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

export async function appendEvent(evt: any) {
  const file = path.join(process.cwd(), 'data', 'events.json');
  const arr = await readJSON(file);
  arr.push(evt);
  await writeJSON(file, arr);
}

// Alias for appendEvent with structured format
export async function addEvent(event: { type: string; payload: Record<string, unknown> }) {
  await appendEvent({
    ...event,
    timestamp: new Date().toISOString(),
  });
}

export async function appendFeedback(fb: any) {
  const file = path.join(process.cwd(), 'data', 'feedback.json');
  const arr = await readJSON(file);
  arr.push(fb);
  await writeJSON(file, arr);
}
