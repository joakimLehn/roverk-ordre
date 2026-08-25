import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { countOrderFiles, getOrder } from '@/lib/db';
import { BLOB_TOKEN_MISSING, blobUploadConfigured } from '@/lib/inspection-blob';
import { authorizeOrderUpload } from '@/lib/order-file';
import { ALLOWED_UPLOAD_MIME, MAX_FILE_BYTES } from '@/lib/upload';

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
        const authorized = await authorizeOrderUpload(pathname, clientPayload, {
          getOrder,
          countOrderFiles,
        });
        if (!authorized.ok) throw new Error(authorized.error);

        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_MIME],
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: true,
        };
      },
      // Metadata lagres fra klienten via saveOrderFile – onUploadCompleted
      // treffer ikke localhost, og raden er kilden til visning.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : BLOB_TOKEN_MISSING;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
