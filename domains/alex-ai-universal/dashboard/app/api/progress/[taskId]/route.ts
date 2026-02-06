import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  props: { params: Promise<{ taskId: string }> }
) {
  const params = await props.params;
  return NextResponse.json({
    taskId: params.taskId,
    progress: 100,
    status: 'completed'
  });
}
