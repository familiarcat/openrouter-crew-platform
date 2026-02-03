import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { question } = await req.json();

  // 1. Get relevant documents from the backend
  const searchResponse = await fetch('http://localhost:8000/memory/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: question, limit: 5 }),
  });

  if (!searchResponse.ok) {
    const errorBody = await searchResponse.text();
    return NextResponse.json({ error: `Backend search failed: ${errorBody}` }, { status: 500 });
  }

  const searchResults = await searchResponse.json();
  const citations = searchResults.map((r: any) => ({
    source: r.source,
    snippet: r.text,
  }));

  // 2. Create a prompt for the Gemini model
  const prompt = `
    Question: ${question}

    Context:
    ${citations.map((c: any) => `- ${c.snippet}`).join('\n')}

    Answer the question based on the context.
  `;

  // 3. TODO: Get an answer from the Gemini model
  // const answer = await call_generative_model(prompt);
  const answer = "This is a placeholder answer from the new Gemini-powered RAG pipeline.";

  const trace = {
    retrieval: searchResults.map((r: any) => ({ id: r.id, source: r.source, score: r.score })),
    docs_loaded: searchResults.length,
  };

  return NextResponse.json({ answer, citations, trace });
}
