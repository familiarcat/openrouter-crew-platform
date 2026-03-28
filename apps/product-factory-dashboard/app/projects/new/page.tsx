'use client';
import { useEffect, useMemo, useState } from 'react';
import { categories } from '../../../lib/categories';
import { templateForCategorySlug } from '../../../lib/projectTemplates';

function getParam(name: string) {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export default function NewProjectPage() {
  const [category, setCategory] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [draft, setDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = getParam('category') || '';
    setCategory(c);
  }, []);

  const tmpl = useMemo(() => templateForCategorySlug(category || undefined), [category]);

  useEffect(() => {
    setName(tmpl.title);
    const body = [
      `# ${tmpl.title}`,
      ``,
      `**Category:** ${category || 'none selected'}`,
      `**Summary:** ${tmpl.summary}`,
      ``,
      `## Sections`,
      ...tmpl.sections.map(s => `- ${s}`),
      ``,
      `## Notes`,
      `- `,
    ].join('\n');
    setDraft(body);
  }, [tmpl, category]);

  async function createProject() {
    setSaving(true);
    const res = await fetch('/api/projects/create', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ category, name, draft })
    });
    const j = await res.json();
    setSaving(false);
    if (!j.ok) alert('Project creation failed: ' + (j.error || 'unknown'));
    else alert('Project created (or queued via n8n). Check diagnostics + your filesystem target.');
  }

  return (
    <div className="grid">
      <div className="card span-12">
        <h1 style={{marginTop:0}}>New project</h1>
        <p className="small">
          Workflow: pick a category → get a templated project brief → trigger your n8n “crew” to scaffold a new project repo.
        </p>
      </div>

      <div className="card span-12">
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <label className="small"><b>Category</b></label>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{padding:10,borderRadius:12,border:'1px solid rgba(255,255,255,.18)',background:'rgba(255,255,255,.04)',color:'var(--text)'}}>
            <option value="">(none)</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>

          <label className="small"><b>Project name</b></label>
          <input value={name} onChange={e=>setName(e.target.value)} style={{flex:1,minWidth:260,padding:10,borderRadius:12,border:'1px solid rgba(255,255,255,.18)',background:'rgba(255,255,255,.04)',color:'var(--text)'}}/>
          <button className="btnPrimary" onClick={createProject} disabled={saving}>{saving ? 'Creating…' : 'Create project (n8n)'}</button>
        </div>

        <p className="small" style={{marginTop:10}}>
          <b>Secure credentials note:</b> this app does <u>not</u> read <code>~/.zshrc</code>. Instead, export secrets in your shell and run <code>npm run dev</code> so Next.js receives them via <code>process.env</code>,
          or copy them into <code>.env.local</code> (not committed).
        </p>
      </div>

      <div className="card span-12">
        <h2 style={{marginTop:0}}>Generated brief (editable)</h2>
        <textarea value={draft} onChange={e=>setDraft(e.target.value)} style={{width:'100%',minHeight:360,padding:12,borderRadius:12,border:'1px solid rgba(255,255,255,.18)',background:'rgba(0,0,0,.25)',color:'var(--text)',fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New'}}/>
      </div>
    </div>
  );
}
