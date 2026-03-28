import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  props: { params: Promise<{ theme: string }> }
) {
  const params = await props.params;
  return NextResponse.json({ 
    theme: params.theme,
    tokens: { colors: { primary: '#000000' } }
  });
}
