-- Idempotent. Kjøres mot samme Neon-DB som nettsiden. Rører ikke nettsidens kolonner.
alter table orders add column if not exists build_status text not null default 'ny';
alter table orders add column if not exists invoiced_at timestamptz;
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists is_test boolean not null default false;
alter table orders add column if not exists planned_build_date date;
alter table orders add column if not exists internal_notes text;

create table if not exists allowed_emails (
  email    text primary key,
  added_at timestamptz not null default now(),
  added_by text
);
