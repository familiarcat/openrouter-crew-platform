import { readdir, readFile } from 'fs/promises';
import path from 'path';
import type { Doc } from './tfidf';

export async function loadDocs(): Promise<Doc[]> {
  const docs: Doc[] = [];
  const contentDir = path.join(process.cwd(), 'content');
  const files = await readdir(contentDir);
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const text = await readFile(path.join(contentDir, f), 'utf-8');
    docs.push({ id: f, text, source: `content/${f}` });
  }

  // user notes (optional)
  const notesPath = path.join(process.cwd(), 'data', 'user_notes.json');
  try {
    const raw = await readFile(notesPath, 'utf-8');
    const notes = JSON.parse(raw) as { id: string; text: string }[];
    for (const n of notes) docs.push({ id: n.id, text: n.text, source: 'user_notes' });
  } catch { /* ignore */ }

  return docs;
}
