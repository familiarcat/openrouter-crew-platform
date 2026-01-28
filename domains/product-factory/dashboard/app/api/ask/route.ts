import { NextResponse } from 'next/server';
import { loadDocs } from '../../../lib/rag/docs';
import { buildIndex, search } from '../../../lib/rag/tfidf';
import { appendEvent } from '../../../lib/store';
import { detectDeployIntent, formatDeployResponse } from '../../../lib/deploy';

export async function POST(req: Request) {
  const { question } = await req.json();
  
  // Check for deployment intent first
  const deployIntent = detectDeployIntent(question);
  if (deployIntent) {
    // Route to deployment handler
    const baseUrl = new URL(req.url).origin;
    const deployResponse = await fetch(`${baseUrl}/api/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question }),
    });
    
    const deployResult = await deployResponse.json();
    
    await appendEvent({ 
      type: 'deploy-via-ask', 
      at: new Date().toISOString(), 
      question, 
      intent: deployIntent,
      success: deployResult.success 
    });
    
    return NextResponse.json({
      answer: deployResult.formattedResponse || deployResult.message,
      citations: [{
        source: 'Deployment System',
        snippet: `Intent: ${deployIntent} | Success: ${deployResult.success}`
      }],
      trace: {
        type: 'deployment',
        intent: deployIntent,
        result: deployResult,
      },
      isDeployment: true,
    });
  }
  
  // Standard RAG query
  const docs = await loadDocs();
  const index = buildIndex(docs);
  const hits = search(index, question, 4);

  const citations = hits.map(h => ({
    source: h.doc.source,
    snippet: h.doc.text.slice(0, 220).replace(/\s+/g,' ') + (h.doc.text.length > 220 ? '…' : '')
  }));

  // Minimal "answer" heuristic (no external LLM required):
  const answer = [
    `Based on the project docs, the strongest monetization wedge is usually Observability/Diagnostics (fastest to sell into existing AI efforts),`,
    `followed by packaged Enterprise RAG implementations (IaC + evals), then Governance/Refresh as a premium trust layer.`,
    `See citations for the supporting sections and consider building an /ask + /diagnostics demo first.`
  ].join(' ');

  const trace = {
    retrieval: hits.map(h => ({ id: h.doc.id, source: h.doc.source, score: Number(h.score.toFixed(4)) })),
    docs_loaded: docs.length
  };

  await appendEvent({ type:'ask', at: new Date().toISOString(), question, trace });

  return NextResponse.json({ answer, citations, trace });
}
