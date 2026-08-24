import { describe, expect, it } from 'vitest';
import {
  INSPECTION_MAX_EMAIL_CHARS,
  INSPECTION_MAX_FILE_BYTES,
  INSPECTION_MAX_FILES,
  INSPECTION_PRODUCTS,
  INSPECTION_PRODUCT_LABELS,
  INSPECTION_STATUSES,
  INSPECTION_STATUS_LABELS,
  applyInspectionView,
  formatInspectionWhen,
  inspectionViewHref,
  isInspectionProduct,
  isInspectionStatus,
  isInspectionViewKey,
  kindFromContentType,
  parseInspection,
  parseInspectionEmailExcerpt,
  searchInspections,
  validateInspectionFile,
  validateInspectionFileCount,
  type Inspection,
} from '@/lib/inspection';

function item(p: Partial<Inspection>): Inspection {
  return {
    id: 'x',
    created_at: '2026-08-01T00:00:00Z',
    created_by: null,
    name: 'n',
    phone: null,
    email: null,
    address: null,
    scheduled_on: null,
    scheduled_time: null,
    status: 'aktiv',
    product: null,
    channel: null,
    notes: null,
    updated_at: '2026-08-01T00:00:00Z',
    file_count: 0,
    ...p,
  };
}

describe('status og produkt', () => {
  it('har tre statuser med norske labels', () => {
    expect(INSPECTION_STATUSES).toEqual(['aktiv', 'gjennomfort', 'avlyst']);
    expect(INSPECTION_STATUS_LABELS).toEqual({
      aktiv: 'Aktiv',
      gjennomfort: 'Gjennomført',
      avlyst: 'Avlyst',
    });
  });

  it('godtar kun kjente statuser', () => {
    expect(isInspectionStatus('aktiv')).toBe(true);
    expect(isInspectionStatus('ny')).toBe(false);
    expect(isInspectionStatus('')).toBe(false);
    expect(isInspectionStatus(null)).toBe(false);
  });

  it('har fire produkter med norske labels', () => {
    expect(INSPECTION_PRODUCTS).toEqual(['skjul', 'ved', 'orden', 'annet']);
    expect(INSPECTION_PRODUCT_LABELS.skjul).toBe('Skjul');
    expect(INSPECTION_PRODUCT_LABELS.ved).toBe('Ved');
    expect(INSPECTION_PRODUCT_LABELS.orden).toBe('Orden');
    expect(INSPECTION_PRODUCT_LABELS.annet).toBe('Annet');
  });

  it('godtar kun kjente produkter', () => {
    expect(isInspectionProduct('skjul')).toBe(true);
    expect(isInspectionProduct('annet')).toBe(true);
    expect(isInspectionProduct('tull')).toBe(false);
    expect(isInspectionProduct(null)).toBe(false);
  });
});

describe('parseInspection', () => {
  it('godtar gyldig navn og normaliserer valgfrie felter', () => {
    const r = parseInspection({
      name: '  Per Hansen  ',
      phone: '  90000000  ',
      email: ' Per@Epost.NO ',
      address: '  Kvamveien 1  ',
      scheduled_on: '2026-08-24',
      scheduled_time: '14:00',
      product: 'skjul',
      channel: 'Telefon',
      notes: '  Ring først  ',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({
      name: 'Per Hansen',
      phone: '90000000',
      email: 'per@epost.no',
      address: 'Kvamveien 1',
      scheduled_on: '2026-08-24',
      scheduled_time: '14:00',
      status: 'aktiv',
      product: 'skjul',
      channel: 'Telefon',
      notes: 'Ring først',
      file_count: 0,
    });
  });

  it('avviser tomt navn', () => {
    expect(parseInspection({ name: '' }).ok).toBe(false);
    expect(parseInspection({ name: '   ' }).ok).toBe(false);
    expect(parseInspection({}).ok).toBe(false);
  });

  it('avviser ugyldig e-post og lar tom e-post bli null', () => {
    expect(parseInspection({ name: 'Per', email: 'tull' }).ok).toBe(false);
    const tom = parseInspection({ name: 'Per', email: '  ' });
    expect(tom.ok && tom.data.email).toBeNull();
  });

  it('avviser klokkeslett uten dato', () => {
    const r = parseInspection({ name: 'Per', scheduled_time: '10:00' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/dato/i);
  });

  it('avviser ukjent produkt og ukjent kanal – gjetter ikke annet', () => {
    expect(parseInspection({ name: 'Per', product: 'tull' }).ok).toBe(false);
    expect(parseInspection({ name: 'Per', channel: 'Brevdue' }).ok).toBe(false);
    const tomt = parseInspection({ name: 'Per' });
    expect(tomt.ok && tomt.data.product).toBeNull();
    expect(tomt.ok && tomt.data.channel).toBeNull();
  });

  it('godtar kjent produkt annet og kjent kanal Annet når de er valgt bevisst', () => {
    const r = parseInspection({ name: 'Per', product: 'annet', channel: 'Annet' });
    expect(r.ok && r.data.product).toBe('annet');
    expect(r.ok && r.data.channel).toBe('Annet');
  });

  it('leser skjemafeltet kanal likt som channel', () => {
    const r = parseInspection({ name: 'Per', kanal: 'Telefon' });
    expect(r.ok && r.data.channel).toBe('Telefon');
    expect(parseInspection({ name: 'Per', kanal: 'Brevdue' }).ok).toBe(false);
  });

  it('lagrer HTML-klokkeslett med sekunder som HH:MM', () => {
    const r = parseInspection({
      name: 'Per',
      scheduled_on: '2026-08-24',
      scheduled_time: '14:30:00',
    });
    expect(r.ok && r.data.scheduled_time).toBe('14:30');
  });
});

describe('visning og søk', () => {
  const items = [
    item({ id: 'a', status: 'aktiv', name: 'Per Hansen' }),
    item({ id: 'b', status: 'gjennomfort', name: 'Kari' }),
    item({ id: 'c', status: 'avlyst', name: 'Nils' }),
  ];

  it('kommende viser aktive, ferdig viser gjennomført og avlyst, alle viser alt', () => {
    expect(applyInspectionView(items, 'kommende').map((x) => x.id)).toEqual(['a']);
    expect(applyInspectionView(items, 'ferdig').map((x) => x.id)).toEqual(['b', 'c']);
    expect(applyInspectionView(items, 'alle')).toHaveLength(3);
  });

  it('godtar kun kjente visninger', () => {
    expect(isInspectionViewKey('kommende')).toBe(true);
    expect(isInspectionViewKey('ferdig')).toBe(true);
    expect(isInspectionViewKey('alle')).toBe(true);
    expect(isInspectionViewKey('bygge')).toBe(false);
    expect(isInspectionViewKey(undefined)).toBe(false);
  });

  it('søker case-insensitive i navn, telefon, e-post og adresse', () => {
    const set = [
      item({ id: 'n', name: 'Per Hansen', phone: '90011122', email: 'per@epost.no', address: 'Kvamveien 1' }),
      item({ id: 'x', name: 'Kari', phone: '40000000', email: 'kari@x.no', address: 'Oslo' }),
    ];
    expect(searchInspections(set, 'hansen').map((x) => x.id)).toEqual(['n']);
    expect(searchInspections(set, '900111').map((x) => x.id)).toEqual(['n']);
    expect(searchInspections(set, 'PER@EPOST').map((x) => x.id)).toEqual(['n']);
    expect(searchInspections(set, 'kvam').map((x) => x.id)).toEqual(['n']);
    expect(searchInspections(set, '  ')).toEqual(set);
  });
});

describe('inspectionViewHref', () => {
  it('utelater vis-parameteren for kommende', () => {
    expect(inspectionViewHref('kommende', {})).toBe('/befaringer');
  });

  it('setter vis for ferdig og alle, ikke view=', () => {
    expect(inspectionViewHref('ferdig', {})).toBe('/befaringer?vis=ferdig');
    expect(inspectionViewHref('alle', {})).toBe('/befaringer?vis=alle');
    expect(inspectionViewHref('alle', { view: 'ferdig' })).toBe('/befaringer?vis=alle');
  });

  it('beholder q', () => {
    expect(inspectionViewHref('kommende', { q: 'kvam' })).toBe('/befaringer?q=kvam');
    expect(inspectionViewHref('ferdig', { q: 'kvam' })).toBe('/befaringer?q=kvam&vis=ferdig');
  });
});

describe('formatInspectionWhen', () => {
  const today = '2026-08-24';

  it('sier i dag med og uten klokke', () => {
    expect(formatInspectionWhen(today, '14:00', today)).toBe('i dag kl. 14:00');
    expect(formatInspectionWhen(today, null, today)).toBe('i dag');
  });

  it('formatterer annen dato med og uten klokke, uten år', () => {
    expect(formatInspectionWhen('2026-08-24', '10:00', '2026-08-19')).toBe('24. aug. kl. 10:00');
    expect(formatInspectionWhen('2026-08-24', null, '2026-08-19')).toBe('24. aug.');
  });

  it('sier Ikke avtalt uten dato', () => {
    expect(formatInspectionWhen(null, null, today)).toBe('Ikke avtalt');
    expect(formatInspectionWhen(null, '10:00', today)).toBe('Ikke avtalt');
  });
});

describe('filregler', () => {
  it('mapper kjent MIME til kind og avviser resten', () => {
    expect(kindFromContentType('image/jpeg')).toBe('bilde');
    expect(kindFromContentType('image/png')).toBe('bilde');
    expect(kindFromContentType('image/webp')).toBe('bilde');
    expect(kindFromContentType('image/gif')).toBe('bilde');
    expect(kindFromContentType('image/heic')).toBe('bilde');
    expect(kindFromContentType('image/heif')).toBe('bilde');
    expect(kindFromContentType('application/pdf')).toBe('pdf');
    expect(kindFromContentType('application/zip')).toBeNull();
    expect(kindFromContentType('image/svg+xml')).toBeNull();
    expect(kindFromContentType('text/plain')).toBeNull();
  });

  it('godtar fil på maksstørrelse og avviser over', () => {
    const ok = validateInspectionFile({
      contentType: 'image/jpeg',
      byteSize: INSPECTION_MAX_FILE_BYTES,
    });
    expect(ok.ok && ok.kind).toBe('bilde');

    const stor = validateInspectionFile({
      contentType: 'application/pdf',
      byteSize: INSPECTION_MAX_FILE_BYTES + 1,
    });
    expect(stor.ok).toBe(false);

    const mime = validateInspectionFile({ contentType: 'video/mp4', byteSize: 100 });
    expect(mime.ok).toBe(false);
  });

  it('teller e-postrader med i maks 40 filer', () => {
    expect(validateInspectionFileCount(39, 1).ok).toBe(true);
    expect(validateInspectionFileCount(INSPECTION_MAX_FILES, 1).ok).toBe(false);
    expect(validateInspectionFileCount(38, 3).ok).toBe(false);
  });

  it('krever e-posttekst, avviser for lang, og setter blob_pathname til null', () => {
    const tom = parseInspectionEmailExcerpt({ body_text: '   ' });
    expect(tom.ok).toBe(false);

    const lang = parseInspectionEmailExcerpt({ body_text: 'a'.repeat(INSPECTION_MAX_EMAIL_CHARS + 1) });
    expect(lang.ok).toBe(false);

    const ok = parseInspectionEmailExcerpt({
      subject: '  Befaring  ',
      body_text: '  Hei, kan vi komme?  ',
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.data.kind).toBe('epost');
    expect(ok.data.subject).toBe('Befaring');
    expect(ok.data.body_text).toBe('Hei, kan vi komme?');
    expect(ok.data.blob_pathname).toBeNull();

    const grense = parseInspectionEmailExcerpt({ body_text: 'a'.repeat(INSPECTION_MAX_EMAIL_CHARS) });
    expect(grense.ok && grense.data.body_text).toHaveLength(INSPECTION_MAX_EMAIL_CHARS);
  });
});
