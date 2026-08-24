-- Befaringer eies av denne appen (ikke nettsidens orders/leads).
-- Idempotent: trygg å kjøre flere ganger.

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

create table if not exists inspection_files (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by text,
  kind text not null,
  filename text not null,
  content_type text,
  byte_size integer,
  blob_pathname text,
  subject text,
  body_text text
);

create index if not exists inspection_files_inspection_idx
  on inspection_files (inspection_id, created_at);
