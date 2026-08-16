'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { insertManualOrder } from '@/lib/db';
import { parseManualOrder } from '@/lib/manual-order';

export interface NewOrderState {
  message?: string;
}

export async function createOrder(_prev: NewOrderState, formData: FormData): Promise<NewOrderState> {
  const { email: registeredBy } = await requireUser();

  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') fields[key] = value;
  }

  const parsed = parseManualOrder(fields);
  if (!parsed.ok) return { message: parsed.error };

  const { kanal, config, ...rest } = parsed.data;
  const id = await insertManualOrder({
    ...rest,
    config: { ...config, kanal, registrert_av: registeredBy, manuell: true },
  });

  revalidatePath('/');
  redirect(`/ordre/${id}`);
}
