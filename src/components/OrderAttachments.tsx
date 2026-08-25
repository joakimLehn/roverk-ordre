'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeOrderFile, saveOrderFile } from '@/app/ordre/[id]/actions';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImageLightbox } from '@/components/ImageLightbox';
import { useToast } from '@/components/Toast';
import { formatDateNo } from '@/lib/format';
import {
  formatOrderFileMeta,
  orderFileHref,
  partitionOrderFiles,
  type OrderFileView,
} from '@/lib/order-file';
import { clientUploadError } from '@/lib/upload';

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand"
      aria-hidden="true"
    />
  );
}

function FileRow({
  orderId,
  file,
  onDelete,
}: {
  orderId: string;
  file: OrderFileView;
  onDelete: (file: OrderFileView) => void;
}) {
  const href = orderFileHref(orderId, file.id);
  return (
    <div className="flex min-h-[46px] items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2">
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{file.filename}</span>
        <span className="block truncate text-[12px] text-muted">{formatDateNo(file.created_at)}</span>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="focus-ring flex min-h-[44px] items-center px-2 text-[13.5px] font-bold text-brand"
      >
        Åpne
      </a>
      <button
        type="button"
        onClick={() => onDelete(file)}
        className="focus-ring flex min-h-[44px] items-center px-2 text-[13.5px] font-semibold text-danger"
      >
        Slett
      </button>
    </div>
  );
}

export function OrderAttachments({
  orderId,
  files,
}: {
  orderId: string;
  files: OrderFileView[];
}) {
  const router = useRouter();
  const toast = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ id: string; name: string }[]>([]);
  const [lightbox, setLightbox] = useState<OrderFileView | null>(null);
  const [toDelete, setToDelete] = useState<OrderFileView | null>(null);
  const [deleting, startDelete] = useTransition();

  const { images, others } = partitionOrderFiles(files);

  async function uploadOne(file: File) {
    const rejected = clientUploadError(file);
    if (rejected) throw new Error(rejected);

    const { upload } = await import('@vercel/blob/client');
    const blob = await upload(`orders/${orderId}/${file.name}`, file, {
      access: 'private',
      handleUploadUrl: '/api/ordre/upload',
      clientPayload: JSON.stringify({ orderId }),
    });
    await saveOrderFile({
      orderId,
      pathname: blob.pathname,
      filename: file.name,
      contentType: blob.contentType || file.type,
      byteSize: file.size,
    });
  }

  async function onPick(list: FileList | null) {
    if (!list || list.length === 0) return;
    const chosen = Array.from(list);
    if (cameraRef.current) cameraRef.current.value = '';
    if (libraryRef.current) libraryRef.current.value = '';

    const jobs = chosen.map((file) => ({ id: crypto.randomUUID(), name: file.name, file }));
    setPending((cur) => [...cur, ...jobs.map(({ id, name }) => ({ id, name }))]);

    await Promise.all(
      jobs.map(async ({ id, name, file }) => {
        try {
          await uploadOne(file);
        } catch {
          toast.showError(`Kunne ikke laste opp ${name}.`);
        } finally {
          setPending((cur) => cur.filter((p) => p.id !== id));
        }
      }),
    );
    router.refresh();
  }

  function confirmDelete() {
    if (!toDelete) return;
    const file = toDelete;
    setToDelete(null);
    setLightbox(null);
    startDelete(async () => {
      try {
        await removeOrderFile(orderId, file.id);
        router.refresh();
      } catch {
        toast.showError('Kunne ikke slette vedlegget.');
      }
    });
  }

  const empty = files.length === 0 && pending.length === 0;

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="focus-ring flex min-h-[46px] cursor-pointer items-center justify-center rounded-xl bg-brand px-3.5 text-[15px] font-bold text-white">
          Ta bilde
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              void onPick(e.target.files);
            }}
          />
        </label>
        <label className="focus-ring flex min-h-[46px] cursor-pointer items-center justify-center rounded-xl border border-line bg-white px-3.5 text-[15px] font-bold">
          Last opp
          <input
            ref={libraryRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="sr-only"
            onChange={(e) => {
              void onPick(e.target.files);
            }}
          />
        </label>
      </div>

      {empty ? (
        <p className="mt-3 rounded-xl border border-line bg-white p-3.5 text-sm text-muted">
          Ingen bilder ennå. Ta bilde av det som er levert, så har vi det ved reklamasjon.
        </p>
      ) : null}

      {pending.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {pending.map((p) => (
            <li key={p.id} className="flex min-h-[44px] items-center gap-2 text-[14px] text-muted">
              <Spinner />
              <span className="truncate">{p.name}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {images.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
          {images.map((file) => {
            const href = orderFileHref(orderId, file.id);
            return (
              <li key={file.id}>
                <button
                  type="button"
                  onClick={() => setLightbox(file)}
                  className="focus-ring relative block aspect-square w-full overflow-hidden rounded-xl border border-line bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={href}
                    alt={file.filename}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {others.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {others.map((file) => (
            <li key={file.id}>
              <FileRow orderId={orderId} file={file} onDelete={setToDelete} />
            </li>
          ))}
        </ul>
      ) : null}

      {lightbox ? (
        <ImageLightbox
          src={orderFileHref(orderId, lightbox.id)}
          filename={lightbox.filename}
          meta={formatOrderFileMeta(lightbox.created_at, lightbox.created_by)}
          onClose={() => setLightbox(null)}
          onDelete={() => {
            setToDelete(lightbox);
            setLightbox(null);
          }}
        />
      ) : null}

      {toDelete ? (
        <ConfirmDialog
          title="Slett vedlegget?"
          message={`«${toDelete.filename}» slettes for godt.`}
          confirmLabel="Slett"
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      ) : null}

      {deleting ? (
        <p className="sr-only" aria-live="polite">
          Sletter …
        </p>
      ) : null}
    </>
  );
}
