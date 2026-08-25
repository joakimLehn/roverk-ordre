'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import {
  countOrderFiles,
  deleteOrderFile,
  getOrder,
  getOrderFile,
  insertOrderFile,
  setOrdersInvoiced,
  updateOrderBestilling,
  updateOrderFields,
} from '@/lib/db';
import { deleteInspectionBlob } from '@/lib/inspection-blob';
import { parseBestillingEdit } from '@/lib/edit-order';
import {
  orderFileDisplayName,
  validateOrderFileInsert,
} from '@/lib/order-file';
import { isBuildStatus } from '@/lib/status';
import { normalizeEmail } from '@/lib/email';
import { deleteBlobThenRecord } from '@/lib/upload';

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

/**
 * Marker en bunke ordrer som fakturert (eller angre bunken).
 *
 * Én skriving og én revalidering for hele stabelen, i stedet for N av hver.
 * Returnerer hvor mange rader som faktisk ble endret, så toasten kan si
 * sannheten når noen av dem alt var fakturert.
 */
export async function setInvoicedBulk(ids: string[], invoiced: boolean): Promise<number> {
  await requireUser();
  const clean = ids.filter((id) => typeof id === 'string' && id.length > 0).slice(0, 300);
  const changed = await setOrdersInvoiced(clean, invoiced ? new Date().toISOString() : null);
  revalidatePath('/');
  for (const id of clean) revalidatePath(`/ordre/${id}`);
  return changed;
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

export async function saveOrderFile(input: {
  orderId: string;
  pathname: string;
  filename: string;
  contentType: string;
  byteSize: number;
}): Promise<void> {
  const { email } = await requireUser();
  const order = await getOrder(input.orderId);
  if (!order) throw new Error('Fant ikke ordren.');

  const count = await countOrderFiles(input.orderId);
  const parsed = validateOrderFileInsert({
    orderId: input.orderId,
    pathname: input.pathname,
    contentType: input.contentType,
    byteSize: input.byteSize,
    currentFileCount: count,
  });
  if (!parsed.ok) throw new Error(parsed.error);

  await insertOrderFile({
    order_id: input.orderId,
    created_by: email,
    kind: parsed.kind,
    filename: orderFileDisplayName(input.filename),
    content_type: input.contentType,
    byte_size: input.byteSize,
    blob_pathname: input.pathname,
  });
  done(input.orderId);
}

export async function removeOrderFile(orderId: string, fileId: string): Promise<void> {
  await requireUser();
  const file = await getOrderFile(fileId);
  if (!file || file.order_id !== orderId) throw new Error('Fant ikke vedlegget.');

  await deleteBlobThenRecord({
    blobPathname: file.blob_pathname,
    deleteBlob: deleteInspectionBlob,
    deleteRecord: () => deleteOrderFile(fileId),
  });
  done(orderId);
}
