import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// #13 overskrev lista med en statisk badge inni en Link. Repoet har ikke
// komponenttester (heller ikke for OrderCard), så kontrakten leses fra kilden
// – samme mønster som migreringstestene. Success: chip skriver med Angre.
// Failure: badge og chip-inni-lenke er forbudt.

function src(rel: string): string {
  return readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

const card = src('src/components/InspectionCard.tsx');
const table = src('src/components/InspectionTable.tsx');
const chip = src('src/components/InspectionStatusChip.tsx');
const badge = src('src/components/Badge.tsx');

function linkBlocks(tsx: string): string[] {
  return tsx.match(/<Link[\s\S]*?<\/Link>/g) ?? [];
}

describe('listestatus på befaringer', () => {
  it('skriver via chip med optimistisk toast og Angre', () => {
    expect(chip).toMatch(/setInspectionStatus/);
    expect(chip).toMatch(/useOptimisticField/);
    expect(chip).toMatch(/undo:\s*\(\)\s*=>\s*setInspectionStatus/);
    expect(chip).toMatch(/InspectionStatusSheet/);
    expect(chip).toMatch(/e\.stopPropagation\(\)/);

    expect(card).toMatch(/^'use client';/m);
    expect(card).toMatch(/InspectionStatusChip/);
    expect(card).toMatch(/href=\{`\/befaringer\/\$\{i\.id\}`\}/);
    expect(card).toMatch(/<InspectionStatusChip inspectionId=\{i\.id\} name=\{i\.name\} current=\{i\.status\} \/>/);

    expect(table).toMatch(/InspectionStatusChip/);
    expect(table).toMatch(/<td[^>]*onClick=\{\(e\) => e\.stopPropagation\(\)\}[^>]*>\s*<InspectionStatusChip/);
    expect(table).toMatch(/min-h-\[30px\]/);
  });

  it('avviser statisk badge og chip inni detaljlenka', () => {
    expect(badge).not.toMatch(/InspectionStatusBadge/);
    expect(badge).not.toMatch(/INSPECTION_STYLES/);
    expect(badge).not.toMatch(/INSPECTION_STATUS_LABELS/);
    expect(badge).toMatch(/export function StatusBadge/);
    expect(badge).toMatch(/export function TestBadge/);

    expect(card).not.toMatch(/InspectionStatusBadge/);
    expect(table).not.toMatch(/InspectionStatusBadge/);
    expect(card).not.toMatch(/from '\.\/Badge'/);
    expect(table).not.toMatch(/from '\.\/Badge'/);

    for (const block of linkBlocks(card)) {
      expect(block).not.toMatch(/InspectionStatusChip/);
    }
    expect(linkBlocks(card).length).toBeGreaterThan(0);

    for (const block of linkBlocks(table)) {
      expect(block).not.toMatch(/InspectionStatusChip/);
    }
  });
});
