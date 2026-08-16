'use server';

import { redirect } from 'next/navigation';
import { normalizeEmail } from '@/lib/email';
import { isEmailAllowed } from '@/lib/db';
import { supabaseServer } from '@/lib/supabase';

export interface LoginState {
  step: 'email' | 'code';
  email?: string;
  message?: string;
}

export async function requestCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  if (!email) return { step: 'email', message: 'Skriv inn en gyldig e-postadresse.' };

  // Samme svar uansett om e-posten er på lista – lekk ikke hvem som har tilgang.
  if (await isEmailAllowed(email)) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      console.error('OTP-utsending feilet:', error.message);
      return { step: 'email', message: 'Kunne ikke sende kode. Prøv igjen om litt.' };
    }
  }
  return { step: 'code', email, message: 'Hvis e-posten er registrert, har du fått en 8-sifret kode.' };
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const token = String(formData.get('token') ?? '').trim();
  // Supabase-prosjektet er satt opp med 8-sifret OTP; godta 6–8 så en
  // senere endring av lengden i Supabase ikke låser folk ute.
  if (!email || !/^\d{6,8}$/.test(token)) {
    return { step: 'code', email: email ?? undefined, message: 'Skriv inn den 8-sifrede koden fra e-posten.' };
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { step: 'code', email, message: 'Feil eller utløpt kode. Be om en ny.' };
  redirect('/');
}

export async function logout(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
