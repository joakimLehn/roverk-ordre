import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase';
import { isEmailAllowed } from './db';

/** Sender brukeren til /login hvis sesjon mangler eller e-posten er fjernet fra allowlist. */
export async function requireUser(): Promise<{ email: string }> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/login');
  const email = user.email.toLowerCase();
  if (!(await isEmailAllowed(email))) {
    await supabase.auth.signOut();
    redirect('/login');
  }
  return { email };
}
