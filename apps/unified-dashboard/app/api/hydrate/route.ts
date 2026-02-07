import { NextResponse } from 'next/server';
import { hydrateAll } from '@/lib/hydration-service';

export async function POST() {
  try {
    const result = await hydrateAll();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Hydration failed' }, { status: 500 });
  }
}
