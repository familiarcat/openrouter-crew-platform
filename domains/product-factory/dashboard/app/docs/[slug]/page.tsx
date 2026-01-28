import { loadMarkdownSafe } from '../../../lib/md';
import Link from 'next/link';

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filename = `${slug}.md`;
  const { html, ok, error, available } = await loadMarkdownSafe(filename);

  return (
    <div className="card">
      {!ok && (
        <div style={{marginBottom:12}}>
          <div className="badge risk">Missing doc</div>
          <p className="small" style={{marginTop:10}}>
            Couldn’t load <code>{filename}</code>. {error}
          </p>
          <p className="small">Available docs:</p>
          <ul className="small">
            {available.map((f: string) => (
              <li key={f}>
                <Link href={`/docs/${f.replace(/\.md$/,'')}`}>{f}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
