-- Avtalt leveringsdato og klokkeslett på ordren. Appens egne kolonner –
-- nettsiden skriver dem aldri. Dato og klokke i hver sin kolonne (lokal tid,
-- som befaringens avtale), så en dag uten klokkeslett ikke blir midnatt.
-- Idempotent: trygg å kjøre flere ganger.
alter table orders add column if not exists delivery_date date;
alter table orders add column if not exists delivery_time time;
