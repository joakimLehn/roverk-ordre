import { describe, expect, it } from 'vitest';
import { INSPECTION_EDITABLE_FIELDS, inspectionUpdateKeys } from '@/lib/inspection-update';

describe('inspectionUpdateKeys', () => {
  it('beholder kun tillatte kolonner i whitelist-rekkefølge', () => {
    const keys = inspectionUpdateKeys({
      notes: 'ring først',
      name: 'Kari',
      status: 'aktiv',
    });
    expect(keys).toEqual(['name', 'status', 'notes']);
    expect(INSPECTION_EDITABLE_FIELDS).toEqual([
      'name', 'phone', 'email', 'address',
      'scheduled_on', 'scheduled_time', 'status', 'product', 'channel', 'notes',
    ]);
  });

  it('dropper ukjente nøkler så de ikke interpoleres i SQL', () => {
    const keys = inspectionUpdateKeys({
      name: 'Kari',
      id: 'ikke-oppdaterbar',
      created_at: '2026-08-24T00:00:00.000Z',
      updated_at: '2026-08-24T00:00:00.000Z',
      file_count: 3,
      created_by: 'x@roverk.no',
      'name = $1; drop table inspections; --': 'x',
    });
    expect(keys).toEqual(['name']);
    expect(keys).not.toContain('id');
    expect(keys.some((k) => k.includes(';') || k.includes('drop'))).toBe(false);
  });
});
