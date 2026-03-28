import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Explicitly typed empty array to satisfy TypeScript
  const errors: any[] = [];
  return NextResponse.json({ errors });
}
