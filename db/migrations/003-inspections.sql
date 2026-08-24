-- Idempotent. Appen eier inspections – rører ikke orders eller leads.
create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text,
  name text not null,
  phone text,
  email text,
  address text,
  scheduled_on date,
  scheduled_time time,
  status text not null default 'aktiv',
  product text,
  channel text,
  notes text,
  updated_at timestamptz not null default now()
);

create index if not exists inspections_status_on_idx
  on inspections (status, scheduled_on);
