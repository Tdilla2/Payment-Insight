-- Invoice fields the UI shows (base amount, late fee, description).
alter table invoices add column if not exists amount      numeric(14,2);
alter table invoices add column if not exists late_fee    numeric(14,2) not null default 0;
alter table invoices add column if not exists description  text not null default '';

-- Backfill base amount from total for existing rows.
update invoices set amount = total_amount where amount is null;
