import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '');
}

export async function loadMarkdown(name: string) {
  const safe = sanitize(name);
  const p = path.join(process.cwd(), 'content', safe);
  const md = await readFile(p, 'utf-8');
  const html = await marked.parse(md);
  return { md, html };
}

export async function loadMarkdownSafe(name: string) {
  const safe = sanitize(name);
  const contentDir = path.join(process.cwd(), 'content');
  let available: string[] = [];
  try {
    available = (await readdir(contentDir)).filter(f => f.endsWith('.md'));
  } catch { /* ignore */ }

  try {
    const { md, html } = await loadMarkdown(safe);
    return { ok: true, md, html, available };
  } catch (e: any) {
    const msg = (e && e.message) ? e.message : String(e);
    const html = await marked.parse(`# Document not found\n\nWe couldn't load **${safe}**.`);
    return { ok: false, md: '', html, error: msg, available };
  }
}
