import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(__dirname, '../db/migrations/003-inspections.sql'),
  'utf8',
);
const withoutComments = sql.replace(/--.*$/gm, '');

describe('003-inspections.sql', () => {
  it('oppretter tabeller og indekser med if not exists', () => {
    expect(sql).toMatch(/create table if not exists inspections\b/i);
    expect(sql).toMatch(/create table if not exists inspection_files\b/i);
    expect(sql).toMatch(/create index if not exists inspections_status_on_idx/i);
    expect(sql).toMatch(/create index if not exists inspection_files_inspection_idx/i);

    const creates = withoutComments.match(/create\s+(table|index)\b[^;]*/gi) ?? [];
    expect(creates.length).toBe(4);
    for (const stmt of creates) {
      expect(stmt.toLowerCase()).toContain('if not exists');
    }
  });

  it('rører ikke orders eller leads', () => {
    const body = withoutComments.toLowerCase();
    expect(body).not.toMatch(/\borders\b/);
    expect(body).not.toMatch(/\bleads\b/);
    expect(body).not.toMatch(/\bdrop\b/);
    expect(body).not.toMatch(/\balter table\b/);
  });
});
