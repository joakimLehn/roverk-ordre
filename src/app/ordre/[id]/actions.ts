'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { getOrder, updateOrderBestilling, updateOrderFields } from '@/lib/db';
import { parseBestillingEdit } from '@/lib/edit-order';
import { isBuildStatus } from '@/lib/status';
import { normalizeEmail } from '@/lib/email';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function done(id: string) {
  revalidatePath('/');
  revalidatePath(`/ordre/${id}`);
}

export async function setBuildStatus(id: string, status: string): Promise<void> {
  await requireUser();
  if (!isBuildStatus(status)) throw new Error('Ukjent byggstatus');
  await updateOrderFields(id, { build_status: status });
  done(id);
}

export async function setInvoiced(id: string, invoiced: boolean): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { invoiced_at: invoiced ? new Date().toISOString() : null });
  done(id);
}

export async function setPaid(id: string, paid: boolean): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { paid_at: paid ? new Date().toISOString() : null });
  done(id);
}

export async function setTestFlag(id: string, isTest: boolean): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { is_test: isTest });
  done(id);
}

export async function setPlannedDate(id: string, date: string): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { planned_build_date: ISO_DATE_RE.test(date) ? date : null });
  done(id);
}

export async function saveNotes(id: string, notes: string): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { internal_notes: notes.slice(0, 10_000) });
  done(id);
}

export interface SaveBestillingState {
  message?: string;
}

export async function saveBestilling(
  id: string,
  formData: FormData,
): Promise<SaveBestillingState> {
  const { email } = await requireUser();
  const order = await getOrder(id);
  if (!order) return { message: 'Fant ikke ordren.' };

  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') fields[key] = value;
  }

  const parsed = parseBestillingEdit(order, fields, email, new Date().toISOString());
  if (!parsed.ok) return { message: parsed.error };

  await updateOrderBestilling(id, parsed.data);
  done(id);
  return {};
}

export async function saveCustomer(id: string, formData: FormData): Promise<void> {
  await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const emailRaw = String(formData.get('email') ?? '').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  const address = String(formData.get('address') ?? '').trim();
  const pd = String(formData.get('preferred_date') ?? '').trim();
  if (!name) throw new Error('Navn er påkrevd');
  if (emailRaw && !email) throw new Error('Ugyldig e-postadresse');
  await updateOrderFields(id, {
    name,
    phone: phone || null,
    email,
    address: address || null,
    preferred_date: ISO_DATE_RE.test(pd) ? pd : null,
  });
  done(id);
}
