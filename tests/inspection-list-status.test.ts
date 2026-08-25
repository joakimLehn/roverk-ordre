import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.join(__dirname, '..');

function src(rel: string): string {
  return readFileSync(path.join(root, rel), 'utf8');
}

function withoutJsxComments(s: string): string {
  return s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function linkBlocks(s: string): string[] {
  return withoutJsxComments(s).match(/<Link\b[\s\S]*?<\/Link>/g) ?? [];
}

/** Fjerner `<Link>…</Link>`-blokker så vi kan se hva som ligger utenfor. */
function withoutLinks(s: string): string {
  return withoutJsxComments(s).replace(/<Link\b[\s\S]*?<\/Link>/g, '');
}

describe('liste-status på befaringer', () => {
  const card = src('src/components/InspectionCard.tsx');
  const table = src('src/components/InspectionTable.tsx');
  const chip = src('src/components/InspectionStatusChip.tsx');
  const badge = src('src/components/Badge.tsx');

  it('åpner sheet via chip utenfor detaljlenken og skriver med setInspectionStatus', () => {
    expect(card).toMatch(/^'use client';/m);
    expect(card).toContain("from './InspectionStatusChip'");
    expect(card).toContain('href={`/befaringer/${i.id}`}');
    expect(withoutLinks(card)).toMatch(/<InspectionStatusChip\b/);
    for (const block of linkBlocks(card)) {
      expect(block).not.toMatch(/InspectionStatusChip/);
    }

    expect(table).toContain("from './InspectionStatusChip'");
    expect(table).toMatch(/<td[^>]*onClick=\{\(e\) => e\.stopPropagation\(\)\}/);
    expect(table).toMatch(/<InspectionStatusChip\b/);

    expect(chip).toContain('setInspectionStatus');
    expect(chip).toContain('useOptimisticField');
    expect(chip).toContain('e.stopPropagation()');
    expect(chip).toContain('InspectionStatusSheet');
  });

  it('avviser statisk InspectionStatusBadge som listekontroll', () => {
    expect(badge).not.toMatch(/InspectionStatusBadge/);
    expect(badge).not.toMatch(/INSPECTION_STYLES/);
    expect(badge).not.toMatch(/INSPECTION_STATUS_LABELS/);
    expect(card).not.toMatch(/InspectionStatusBadge/);
    expect(table).not.toMatch(/InspectionStatusBadge/);
    expect(table).not.toMatch(/from '\.\/Badge'/);
  });
});
