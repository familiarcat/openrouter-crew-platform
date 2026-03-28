import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  props: { params: Promise<{ project: string }> }
) {
  const params = await props.params;
  return NextResponse.json({
    project: params.project,
    theme: 'default',
    tokens: {
      colors: {
        primary: '#000000',
        secondary: '#ffffff'
      }
    }
  });
}
