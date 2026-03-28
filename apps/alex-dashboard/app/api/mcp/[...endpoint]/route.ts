import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'MCP Catch-all Endpoint' });
}

export async function POST(request: Request) {
  return NextResponse.json({ message: 'MCP Catch-all Endpoint' });
}
