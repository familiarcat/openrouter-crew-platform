export type Doc = { id: string; text: string; source: string };

function tokenize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

export function buildIndex(docs: Doc[]) {
  const df = new Map<string, number>();
  const tf = docs.map(d => {
    const counts = new Map<string, number>();
    const toks = tokenize(d.text);
    for (const t of toks) counts.set(t, (counts.get(t) || 0) + 1);
    const uniq = new Set(toks);
    for (const t of uniq) df.set(t, (df.get(t) || 0) + 1);
    return { doc: d, counts, len: toks.length || 1 };
  });
  return { df, tf, n: docs.length };
}

export function search(index: ReturnType<typeof buildIndex>, query: string, k = 4) {
  const q = tokenize(query);
  const qCounts = new Map<string, number>();
  for (const t of q) qCounts.set(t, (qCounts.get(t) || 0) + 1);

  const scores = index.tf.map(({ doc, counts, len }) => {
    let score = 0;
    for (const [t, qc] of qCounts.entries()) {
      const tfv = (counts.get(t) || 0) / len;
      const dfv = index.df.get(t) || 0;
      const idf = Math.log((index.n + 1) / (dfv + 1)) + 1;
      score += (qc * tfv * idf);
    }
    return { doc, score };
  }).sort((a,b)=>b.score-a.score).slice(0,k);

  return scores;
}
