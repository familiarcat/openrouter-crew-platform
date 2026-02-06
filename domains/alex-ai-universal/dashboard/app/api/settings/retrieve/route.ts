import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ settings: {} });
  }

  try {
    const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_KEY || "");
    
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ settings: data || {} });
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return NextResponse.json({ settings: {} });
  }
}
