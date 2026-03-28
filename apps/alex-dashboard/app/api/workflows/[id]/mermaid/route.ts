import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  return NextResponse.json({ id: params.id, mermaid: 'graph TD; A-->B;' });
}
