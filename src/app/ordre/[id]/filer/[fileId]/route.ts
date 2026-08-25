import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getOrderFile } from '@/lib/db';
import { signedInspectionFileUrl } from '@/lib/inspection-blob';
import { canServeOrderFile } from '@/lib/order-file';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  await requireUser();
  const { id, fileId } = await params;
  const file = await getOrderFile(fileId);
  if (!canServeOrderFile(file, id)) notFound();
  redirect(await signedInspectionFileUrl(file.blob_pathname));
}
