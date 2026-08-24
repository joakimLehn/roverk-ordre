import 'server-only';
import { del, issueSignedToken, presignUrl } from '@vercel/blob';

const SIGNED_MS = 60 * 60 * 1000;

export const BLOB_TOKEN_MISSING =
  'Filopplasting er ikke konfigurert. BLOB_READ_WRITE_TOKEN mangler.';

export function blobUploadConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Signert GET-URL ~60 min. Bytene går ikke gjennom Serverless. */
export async function signedInspectionFileUrl(pathname: string): Promise<string> {
  const token = await issueSignedToken({
    pathname,
    operations: ['get'],
    validUntil: Date.now() + SIGNED_MS,
  });
  const { presignedUrl } = await presignUrl(token, {
    operation: 'get',
    pathname,
    access: 'private',
    validUntil: Date.now() + SIGNED_MS,
  });
  return presignedUrl;
}

export async function deleteInspectionBlob(pathname: string): Promise<void> {
  await del(pathname);
}

export async function deleteInspectionBlobs(pathnames: string[]): Promise<void> {
  if (pathnames.length === 0) return;
  await del(pathnames);
}
