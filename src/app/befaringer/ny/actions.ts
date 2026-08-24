'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { insertInspection } from '@/lib/db';
import { parseInspection } from '@/lib/inspection';

export interface NewInspectionState {
  message?: string;
}

export async function createInspection(
  _prev: NewInspectionState,
  formData: FormData,
): Promise<NewInspectionState> {
  const { email } = await requireUser();

  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') fields[key] = value;
  }

  const parsed = parseInspection(fields);
  if (!parsed.ok) return { message: parsed.error };

  const id = await insertInspection({
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email,
    address: parsed.data.address,
    scheduled_on: parsed.data.scheduled_on,
    scheduled_time: parsed.data.scheduled_time,
    status: parsed.data.status,
    product: parsed.data.product,
    channel: parsed.data.channel,
    notes: parsed.data.notes,
    created_by: email,
  });

  revalidatePath('/befaringer');
  redirect(`/befaringer/${id}`);
}
