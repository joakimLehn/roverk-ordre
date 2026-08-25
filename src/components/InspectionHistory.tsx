'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeInspectionFile, saveInspectionEmail, saveInspectionFile } from '@/app/befaringer/[id]/actions';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ImageLightbox } from '@/components/ImageLightbox';
import { useToast } from '@/components/Toast';
import { INSPECTION_MAX_FILE_BYTES, kindFromContentType } from '@/lib/inspection';
import {
  inspectionFileHref,
  isRenderableImage,
  type InspectionFileView,
} from '@/lib/inspection-file';

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand"
      aria-hidden="true"
    />
  );
}

function FileRow({
  inspectionId,
  file,
  onDelete,
}: {
  inspectionId: string;
  file: InspectionFileView;
  onDelete: (file: InspectionFileView) => void;
}) {
  const href = inspectionFileHref(inspectionId, file.id);
  return (
    <div className="flex min-h-[46px] items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2">
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{file.filename}</span>
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

export function InspectionHistory({
  inspectionId,
  files,
}: {
  inspectionId: string;
  files: InspectionFileView[];
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ id: string; name: string }[]>([]);
  const [lightbox, setLightbox] = useState<InspectionFileView | null>(null);
  const [toDelete, setToDelete] = useState<InspectionFileView | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, startEmail] = useTransition();
  const [deleting, startDelete] = useTransition();

  const attachments = files.filter((f) => f.kind !== 'epost');
  const emails = files.filter((f) => f.kind === 'epost');
  const images = attachments.filter((f) => f.kind === 'bilde' && isRenderableImage(f.content_type, f.filename));
  const others = attachments.filter((f) => !(f.kind === 'bilde' && isRenderableImage(f.content_type, f.filename)));

  async function uploadOne(file: File) {
    if (file.size > INSPECTION_MAX_FILE_BYTES) {
      throw new Error('too-large');
    }
    if (file.type) {
      const kind = kindFromContentType(file.type);
      if (kind !== 'bilde' && kind !== 'pdf') throw new Error('bad-type');
    }

    const { upload } = await import('@vercel/blob/client');
    const blob = await upload(`inspections/${inspectionId}/${file.name}`, file, {
      access: 'private',
      handleUploadUrl: '/api/befaringer/upload',
      clientPayload: JSON.stringify({ inspectionId }),
    });
    await saveInspectionFile({
      inspectionId,
      pathname: blob.pathname,
      filename: file.name,
      contentType: blob.contentType || file.type,
      byteSize: file.size,
    });
  }

  async function onPick(list: FileList | null) {
    if (!list || list.length === 0) return;
    const chosen = Array.from(list);
    if (inputRef.current) inputRef.current.value = '';

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
        await removeInspectionFile(inspectionId, file.id);
        router.refresh();
      } catch {
        toast.showError('Kunne ikke slette vedlegget.');
      }
    });
  }

  return (
    <>
      <section className="mb-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Vedlegg</h3>
        <label className="focus-ring flex min-h-[46px] cursor-pointer items-center justify-center rounded-xl bg-brand px-3.5 text-[15px] font-bold text-white">
          Last opp bilder eller PDF
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="sr-only"
            onChange={(e) => {
              void onPick(e.target.files);
            }}
          />
        </label>

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
              const href = inspectionFileHref(inspectionId, file.id);
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
                <FileRow inspectionId={inspectionId} file={file} onDelete={setToDelete} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mb-5">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">E-poster</h3>
        <ul className="space-y-2">
          {emails.map((file) => (
            <li key={file.id} className="rounded-xl border border-line bg-white px-3.5 py-3">
              {file.subject ? (
                <p className="text-[14px] font-bold">{file.subject}</p>
              ) : (
                <p className="text-[13px] text-muted">Uten emne</p>
              )}
              <p className="mt-1 whitespace-pre-wrap text-[14.5px] leading-snug">{file.body_text}</p>
              <button
                type="button"
                onClick={() => setToDelete(file)}
                className="focus-ring mt-2 flex min-h-[44px] items-center text-[13.5px] font-semibold text-danger"
              >
                Slett
              </button>
            </li>
          ))}
        </ul>

        <form
          className="mt-3 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            setEmailError(null);
            startEmail(async () => {
              const result = await saveInspectionEmail(inspectionId, fd);
              if (result.message) {
                setEmailError(result.message);
                return;
              }
              form.reset();
              router.refresh();
            });
          }}
        >
          <label className="block text-xs font-semibold text-muted">
            Emne
            <input
              name="subject"
              className="mt-1 min-h-[46px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base md:text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-muted">
            Lim inn e-post
            <textarea
              name="body_text"
              required
              rows={6}
              className="mt-1 w-full rounded-xl border border-line bg-white p-3 text-base md:rounded-lg md:p-2.5 md:text-sm"
            />
          </label>
          {emailError ? <p className="text-sm font-semibold text-danger">{emailError}</p> : null}
          <button
            disabled={savingEmail}
            className="focus-ring min-h-[46px] w-full cursor-pointer rounded-xl bg-brand px-3.5 text-[15px] font-bold text-white disabled:opacity-60 md:w-auto"
          >
            {savingEmail ? 'Lagrer …' : 'Lagre e-postutdrag'}
          </button>
        </form>
      </section>

      {lightbox ? (
        <ImageLightbox
          inspectionId={inspectionId}
          file={lightbox}
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
          message={toDelete.kind === 'epost' ? 'E-postutdraget slettes for godt.' : `«${toDelete.filename}» slettes for godt.`}
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
