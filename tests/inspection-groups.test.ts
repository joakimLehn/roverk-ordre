import { describe, expect, it } from 'vitest';
import { buildGroupOf, osloDate } from '@/lib/groups';
import {
  INSPECTION_GROUP_LABELS,
  groupInspectionsByDate,
  inspectionGroupOf,
} from '@/lib/inspection-groups';
import type { Inspection } from '@/lib/inspection';

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

// Onsdag 19. august 2026 – samme anker som groups.test.ts.
const TODAY = '2026-08-19';

describe('inspectionGroupOf', () => {
  it('setter befaring uten dato i egen gruppe', () => {
    expect(inspectionGroupOf(null, TODAY)).toBe('ingen');
  });

  it('flagger avtalt dato som har passert som forfalt', () => {
    expect(inspectionGroupOf('2026-08-18', TODAY)).toBe('forfalt');
    expect(inspectionGroupOf('2026-07-01', TODAY)).toBe('forfalt');
  });

  it('kjenner i dag', () => {
    expect(inspectionGroupOf(TODAY, TODAY)).toBe('i_dag');
  });

  it('speiler ordre-bøttene, inkludert uka mot søndag', () => {
    expect(inspectionGroupOf('2026-08-21', TODAY)).toBe('uka');
    expect(inspectionGroupOf('2026-08-23', TODAY)).toBe('uka');
    expect(inspectionGroupOf('2026-08-24', TODAY)).toBe('senere');
    expect(inspectionGroupOf('2026-08-21', TODAY)).toBe(buildGroupOf('2026-08-21', TODAY));
  });

  it('tar today som Oslo-dag, samme kontrakt som osloDate', () => {
    const today = osloDate('2026-08-19T10:00:00.000Z');
    expect(inspectionGroupOf(today, today)).toBe('i_dag');
  });
});

describe('groupInspectionsByDate', () => {
  const items = [
    item({ id: 'senere', scheduled_on: '2026-09-01' }),
    item({ id: 'ingen-ny', scheduled_on: null, created_at: '2026-08-10T00:00:00Z' }),
    item({ id: 'i-dag-sent', scheduled_on: TODAY, scheduled_time: '14:00', created_at: '2026-08-02T00:00:00Z' }),
    item({ id: 'forfalt', scheduled_on: '2026-08-12' }),
    item({ id: 'i-dag-tidlig', scheduled_on: TODAY, scheduled_time: '09:00', created_at: '2026-08-05T00:00:00Z' }),
    item({ id: 'i-dag-uten-klokke', scheduled_on: TODAY, scheduled_time: null, created_at: '2026-08-01T00:00:00Z' }),
    item({ id: 'ingen-gammel', scheduled_on: null, created_at: '2026-07-01T00:00:00Z' }),
    item({ id: 'uka', scheduled_on: '2026-08-21' }),
  ];

  it('sorterer gruppene i hastverksrekkefølge og utelater tomme', () => {
    expect(groupInspectionsByDate(items, TODAY).map((g) => g.key)).toEqual([
      'forfalt', 'i_dag', 'uka', 'senere', 'ingen',
    ]);
    expect(groupInspectionsByDate([item({ id: 'a' })], TODAY).map((g) => g.key)).toEqual(['ingen']);
  });

  it('grupperer forfalt, i dag og uten dato', () => {
    const grouped = groupInspectionsByDate(items, TODAY);
    expect(grouped.find((g) => g.key === 'forfalt')?.inspections.map((x) => x.id)).toEqual(['forfalt']);
    expect(grouped.find((g) => g.key === 'i_dag')?.inspections.map((x) => x.id)).toEqual([
      'i-dag-tidlig', 'i-dag-sent', 'i-dag-uten-klokke',
    ]);
    expect(grouped.find((g) => g.key === 'ingen')?.inspections.map((x) => x.id)).toEqual([
      'ingen-gammel', 'ingen-ny',
    ]);
  });

  it('sorterer innenfor gruppe på dato, så klokke med null sist, så created_at', () => {
    const sameDay = [
      item({ id: 'b', scheduled_on: TODAY, scheduled_time: '11:00', created_at: '2026-08-01T00:00:00Z' }),
      item({ id: 'a', scheduled_on: TODAY, scheduled_time: '09:00', created_at: '2026-08-10T00:00:00Z' }),
      item({ id: 'c', scheduled_on: TODAY, scheduled_time: null, created_at: '2026-07-01T00:00:00Z' }),
    ];
    const iDag = groupInspectionsByDate(sameDay, TODAY).find((g) => g.key === 'i_dag');
    expect(iDag?.inspections.map((x) => x.id)).toEqual(['a', 'b', 'c']);

    const uka = groupInspectionsByDate(
      [
        item({ id: 'senere-i-uka', scheduled_on: '2026-08-23' }),
        item({ id: 'tidlig-i-uka', scheduled_on: '2026-08-20' }),
      ],
      TODAY,
    ).find((g) => g.key === 'uka');
    expect(uka?.inspections.map((x) => x.id)).toEqual(['tidlig-i-uka', 'senere-i-uka']);
  });

  it('gir norsk etikett Uten dato, ikke Uten byggedato', () => {
    expect(INSPECTION_GROUP_LABELS.ingen).toBe('Uten dato');
    for (const g of groupInspectionsByDate(items, TODAY)) {
      expect(g.label).toBe(INSPECTION_GROUP_LABELS[g.key]);
    }
  });

  it('mister ingen befaringer', () => {
    const total = groupInspectionsByDate(items, TODAY).reduce((n, g) => n + g.inspections.length, 0);
    expect(total).toBe(items.length);
  });
});
