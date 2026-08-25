import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { countInspectionFiles, getInspection } from '@/lib/db';
import { BLOB_TOKEN_MISSING, blobUploadConfigured } from '@/lib/inspection-blob';
import {
  INSPECTION_ALLOWED_MIME,
  INSPECTION_MAX_FILE_BYTES,
  validateInspectionFileCount,
} from '@/lib/inspection';
import { parseInspectionUploadRequest } from '@/lib/inspection-file';

export async function POST(request: Request): Promise<NextResponse> {
  await requireUser();

  if (!blobUploadConfigured()) {
    return NextResponse.json({ error: BLOB_TOKEN_MISSING }, { status: 503 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await requireUser();
        const parsed = parseInspectionUploadRequest(pathname, clientPayload);
        if (!parsed.ok) throw new Error(parsed.error);

        const inspection = await getInspection(parsed.data.inspectionId);
        if (!inspection) throw new Error('Fant ikke befaringen.');

        const count = await countInspectionFiles(parsed.data.inspectionId);
        const room = validateInspectionFileCount(count, 1);
        if (!room.ok) throw new Error(room.error);

        return {
          allowedContentTypes: [...INSPECTION_ALLOWED_MIME],
          maximumSizeInBytes: INSPECTION_MAX_FILE_BYTES,
          addRandomSuffix: true,
        };
      },
      // Metadata lagres fra klienten via saveInspectionFile – onUploadCompleted
      // treffer ikke localhost, og raden er kilden til visning.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : BLOB_TOKEN_MISSING;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
