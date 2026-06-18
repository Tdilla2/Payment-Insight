-- Payment Insight — initial schema
-- Relational model mirroring the existing TypeScript interfaces.

create extension if not exists "pgcrypto";

-- Application users (linked to Cognito by `sub`). Role drives portal vs. admin view.
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  cognito_sub   text unique,                       -- Cognito user "sub" claim
  email         text not null unique,
  role          text not null check (role in ('superadmin','client')),
  client_id     uuid,                              -- set for role='client'
  created_at    timestamptz not null default now()
);

create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  phone         text default '',
  status        text not null default 'current' check (status in ('current','late','paid')),
  billing_day   int default 1 check (billing_day between 1 and 28),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Each client has one (or more) loans.
create table if not exists loans (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references clients(id) on delete cascade,
  loan_amount      numeric(14,2) not null,
  interest_rate    numeric(6,3)  not null,        -- annual %
  loan_term        int           not null,        -- years
  monthly_payment  numeric(14,2) not null,
  start_date       date          not null,
  next_payment_date date,
  balance          numeric(14,2) not null,
  created_at       timestamptz   not null default now()
);

create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references clients(id) on delete cascade,
  loan_id        uuid references loans(id) on delete set null,
  invoice_number text not null unique,
  total_amount   numeric(14,2) not null,
  invoice_date   date not null,
  due_date       date not null,
  status         text not null default 'pending'
                   check (status in ('draft','sent','pending','paid','overdue')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists payments (
  id                     uuid primary key default gen_random_uuid(),
  invoice_id             uuid not null references invoices(id) on delete cascade,
  client_id              uuid not null references clients(id) on delete cascade,
  amount                 numeric(14,2) not null,
  method                 text check (method in ('online','check','cash','bank_transfer')),
  status                 text not null default 'pending'
                           check (status in ('pending','succeeded','failed','refunded')),
  stripe_payment_intent  text,                    -- test-mode PaymentIntent id
  confirmation_number    text,
  paid_at                timestamptz,
  created_at             timestamptz not null default now()
);

create index if not exists idx_loans_client    on loans(client_id);
create index if not exists idx_invoices_client on invoices(client_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_payments_invoice on payments(invoice_id);
create index if not exists idx_payments_client  on payments(client_id);
create index if not exists idx_users_cognito    on users(cognito_sub);
