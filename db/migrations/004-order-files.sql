-- Ordrevedlegg eies av denne appen. Ingen nye kolonner på orders
-- (ikke nettsidens kolonner). FK mot orders.id er en referanse, ikke eierskap.
-- Idempotent: trygg å kjøre flere ganger.

create table if not exists order_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by text,
  kind text not null,
  filename text not null,
  content_type text,
  byte_size integer,
  blob_pathname text not null
);

create index if not exists order_files_order_idx
  on order_files (order_id, created_at);
