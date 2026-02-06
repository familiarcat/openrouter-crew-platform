import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  return NextResponse.json({ success: true, id: params.id, status: 'retrying' });
}
