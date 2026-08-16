export type BuildStatus = 'ny' | 'under_bygging' | 'bygd' | 'montert';

export interface Order {
  id: string;
  created_at: string;            // ISO
  site: string;                  // 'skjul' | 'ved' | 'orden' | 'orden-v2'
  product: string | null;
  config: Record<string, unknown>;
  preferred_date: string | null; // ISO date
  name: string;
  phone: string;
  email: string;
  address: string | null;
  address_meta: { poststed?: string | null } & Record<string, unknown>;
  price_nok: number | null;
  build_status: BuildStatus;
  invoiced_at: string | null;
  paid_at: string | null;
  is_test: boolean;
  planned_build_date: string | null;
  internal_notes: string | null;
}
