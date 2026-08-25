import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { countOrderFiles, getOrder } from '@/lib/db';
import { BLOB_TOKEN_MISSING, blobUploadConfigured } from '@/lib/inspection-blob';
import { parseOrderUploadRequest } from '@/lib/order-file';
import { ALLOWED_UPLOAD_MIME, MAX_FILE_BYTES, validateUploadFileCount } from '@/lib/upload';

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
        const parsed = parseOrderUploadRequest(pathname, clientPayload);
        if (!parsed.ok) throw new Error(parsed.error);

        const order = await getOrder(parsed.data.orderId);
        if (!order) throw new Error('Fant ikke ordren.');

        const count = await countOrderFiles(parsed.data.orderId);
        const room = validateUploadFileCount(count, 1, 'ordre');
        if (!room.ok) throw new Error(room.error);

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
