import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(__dirname, '../db/migrations/004-order-files.sql'),
  'utf8',
);
const withoutComments = sql.replace(/--.*$/gm, '');

describe('004-order-files.sql', () => {
  it('oppretter order_files og indeksen med if not exists', () => {
    expect(sql).toMatch(/create table if not exists order_files\b/i);
    expect(sql).toMatch(/create index if not exists order_files_order_idx/i);
    expect(sql).toMatch(/references orders/i);

    const creates = withoutComments.match(/create\s+(table|index)\b[^;]*/gi) ?? [];
    expect(creates.length).toBe(2);
    for (const stmt of creates) {
      expect(stmt.toLowerCase()).toContain('if not exists');
    }
  });

  it('rører ikke orders-kolonner, leads eller drop', () => {
    const body = withoutComments.toLowerCase();
    expect(body).not.toMatch(/\balter table\b/);
    expect(body).not.toMatch(/\bdrop\b/);
    expect(body).not.toMatch(/\bleads\b/);
  });
});
