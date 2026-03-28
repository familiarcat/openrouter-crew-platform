import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ success: false, error: 'Missing Supabase configuration' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { userId, settings, globalTheme } = body;
    
    const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_KEY || "");
    
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: userId || 'anonymous', 
        settings, 
        theme: globalTheme,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error storing settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
