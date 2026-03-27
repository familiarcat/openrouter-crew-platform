import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
});

export async function GET() {
  try {
    // Retrieve the historical snapshots from Redis
    const rawHistory = await redis.lrange('cloudwatch_alarms_history', 0, -1);
    const history = rawHistory.map(item => JSON.parse(item));

    return NextResponse.json({
      success: true,
      history: history
    });
  } catch (error: any) {
    console.error('Failed to fetch health history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}