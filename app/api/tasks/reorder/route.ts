import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { updates } = body as { updates: { id: number; status: string; sort_order: number }[] };

  if (!updates?.length) {
    return NextResponse.json({ error: 'updates required' }, { status: 400 });
  }

  // Update all tasks using batch update
  const updatesPromises = updates.map(async (u) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: u.status, sort_order: u.sort_order })
      .eq('id', u.id);
    
    return { id: u.id, error };
  });

  const results = await Promise.all(updatesPromises);
  
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    console.error('Error updating tasks:', errors);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
