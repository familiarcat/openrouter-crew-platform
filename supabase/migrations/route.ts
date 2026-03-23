import { scienceOfficer } from '@/domains/alex-ai-universal/dashboard/lib/rag/science-officer';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { content, metadata } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const id = await scienceOfficer.storeMemory(content, metadata || {});

    if (!id) {
      return NextResponse.json({ error: 'Failed to store memory' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}