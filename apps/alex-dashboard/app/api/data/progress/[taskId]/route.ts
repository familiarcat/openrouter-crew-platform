import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  props: { params: Promise<{ taskId: string }> }
) {
  const params = await props.params;
  const { taskId } = params;
  
  return NextResponse.json({
    taskId,
    progress: 100,
    status: 'completed',
    message: 'Mock progress data'
  });
}
