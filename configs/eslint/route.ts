import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // In a real app, you would validate the session user here
  // const { data: { user } } = await supabase.auth.getUser();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Aggregate usage stats
    const { data, error } = await supabase
      .from('llm_usage')
      .select('cost_usd, tokens_out, model')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const totalCost = data.reduce((acc, row) => acc + (row.cost_usd || 0), 0);
    
    return NextResponse.json({ totalCost, history: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}