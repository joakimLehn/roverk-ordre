'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import {
  countInspectionFiles,
  deleteInspection,
  deleteInspectionFile,
  getInspection,
  getInspectionFile,
  insertInspectionFile,
  listInspectionFiles,
  updateInspectionFields,
} from '@/lib/db';
import { deleteInspectionBlob, deleteInspectionBlobs } from '@/lib/inspection-blob';
import {
  parseInspection,
  parseInspectionEmailExcerpt,
  parseInspectionSchedule,
  isInspectionStatus,
  validateInspectionFile,
  validateInspectionFileCount,
} from '@/lib/inspection';
import {
  deleteBlobThenRecord,
  deleteInspectionBlobsThenRecord,
  isInspectionBlobPath,
} from '@/lib/inspection-file';

function done(id: string) {
  revalidatePath('/befaringer');
  revalidatePath(`/befaringer/${id}`);
}

export async function saveInspectionFile(input: {
  inspectionId: string;
  pathname: string;
  filename: string;
  contentType: string;
  byteSize: number;
}): Promise<void> {
  const { email } = await requireUser();
  const inspection = await getInspection(input.inspectionId);
  if (!inspection) throw new Error('Fant ikke befaringen.');

  const count = await countInspectionFiles(input.inspectionId);
  const parsed = validateInspectionFile({
    contentType: input.contentType,
    byteSize: input.byteSize,
  });
  if (!parsed.ok) throw new Error(parsed.error);
  const room = validateInspectionFileCount(count, 1);
  if (!room.ok) throw new Error(room.error);
  if (!isInspectionBlobPath(input.inspectionId, input.pathname)) {
    throw new Error('Ugyldig filsti.');
  }

  await insertInspectionFile({
    inspection_id: input.inspectionId,
    created_by: email,
    kind: parsed.kind,
    filename: input.filename.trim() || 'fil',
    content_type: input.contentType,
    byte_size: input.byteSize,
    blob_pathname: input.pathname,
    subject: null,
    body_text: null,
  });
  done(input.inspectionId);
}

export async function saveInspectionEmail(
  inspectionId: string,
  formData: FormData,
): Promise<{ message?: string }> {
  const { email } = await requireUser();
  const inspection = await getInspection(inspectionId);
  if (!inspection) return { message: 'Fant ikke befaringen.' };

  const parsed = parseInspectionEmailExcerpt({
    subject: String(formData.get('subject') ?? ''),
    body_text: String(formData.get('body_text') ?? ''),
  });
  if (!parsed.ok) return { message: parsed.error };

  const count = await countInspectionFiles(inspectionId);
  const room = validateInspectionFileCount(count, 1);
  if (!room.ok) return { message: room.error };

  await insertInspectionFile({
    inspection_id: inspectionId,
    created_by: email,
    kind: 'epost',
    filename: parsed.data.subject ?? 'E-postutdrag',
    content_type: 'text/plain',
    byte_size: parsed.data.body_text.length,
    blob_pathname: null,
    subject: parsed.data.subject,
    body_text: parsed.data.body_text,
  });
  done(inspectionId);
  return {};
}

export async function removeInspectionFile(inspectionId: string, fileId: string): Promise<void> {
  await requireUser();
  const file = await getInspectionFile(fileId);
  if (!file || file.inspection_id !== inspectionId) throw new Error('Fant ikke vedlegget.');

  await deleteBlobThenRecord({
    blobPathname: file.blob_pathname,
    deleteBlob: deleteInspectionBlob,
    deleteRecord: () => deleteInspectionFile(fileId),
  });
  done(inspectionId);
}

export async function removeInspection(id: string): Promise<void> {
  await requireUser();
  const files = await listInspectionFiles(id);
  await deleteInspectionBlobsThenRecord({
    blobPathnames: files.map((f) => f.blob_pathname).filter((p): p is string => Boolean(p)),
    deleteBlobs: deleteInspectionBlobs,
    deleteRecord: () => deleteInspection(id),
  });
  revalidatePath('/befaringer');
  redirect('/befaringer');
}

export async function setInspectionStatus(id: string, status: string): Promise<void> {
  await requireUser();
  if (!isInspectionStatus(status)) throw new Error('Ukjent status');
  await updateInspectionFields(id, { status });
  done(id);
}

export async function setInspectionSchedule(
  id: string,
  on: string,
  time: string,
): Promise<{ message?: string }> {
  await requireUser();
  const parsed = parseInspectionSchedule(on, time);
  if (!parsed.ok) return { message: parsed.error };
  await updateInspectionFields(id, {
    scheduled_on: parsed.scheduled_on,
    scheduled_time: parsed.scheduled_time,
  });
  done(id);
  return {};
}

export async function saveInspectionCustomer(
  id: string,
  formData: FormData,
): Promise<{ message?: string }> {
  await requireUser();
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') fields[key] = value;
  }
  const parsed = parseInspection(fields);
  if (!parsed.ok) return { message: parsed.error };
  // Bare kundekolonner – parseInspection default'er status/avtale når de
  // ikke er i skjemaet, og de skal ikke overskrives her.
  await updateInspectionFields(id, {
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email,
    address: parsed.data.address,
    product: parsed.data.product,
    channel: parsed.data.channel,
  });
  done(id);
  return {};
}

export async function saveInspectionNotes(id: string, notes: string): Promise<void> {
  await requireUser();
  await updateInspectionFields(id, { notes: notes.slice(0, 10_000) || null });
  done(id);
}
