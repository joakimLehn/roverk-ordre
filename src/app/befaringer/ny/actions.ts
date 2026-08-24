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

  const id = await insertInspection({ ...parsed.data, created_by: email });

  revalidatePath('/befaringer');
  redirect(`/befaringer/${id}`);
}
