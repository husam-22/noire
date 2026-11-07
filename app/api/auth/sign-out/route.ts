import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasSupabasePublicConfig } from '@/lib/env';

export async function POST(request: NextRequest) {
  if (hasSupabasePublicConfig()) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const { origin } = new URL(request.url);
  const locale = request.cookies.get('NEXT_LOCALE')?.value;
  return NextResponse.redirect(`${origin}${locale === 'ar' ? '/ar' : '/'}`, { status: 303 });
}
