-- Demo data: one client with a loan and three invoices (paid / pending / overdue).
-- Cognito users are created separately; the users<->client link is made on first login by email.

insert into clients (id, name, email, phone, status, billing_day)
values ('11111111-1111-1111-1111-111111111111', 'John Smith', 'john.smith@email.com', '(555) 123-4567', 'current', 15)
on conflict (id) do nothing;

insert into loans (id, client_id, loan_amount, interest_rate, loan_term, monthly_payment, start_date, next_payment_date, balance)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
        250000, 6.5, 30, 1580.17, '2024-01-15', '2026-07-15', 248500)
on conflict (id) do nothing;

insert into invoices (client_id, loan_id, invoice_number, total_amount, invoice_date, due_date, status) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'INV-1001', 1580.17, '2026-04-15', '2026-04-30', 'paid'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'INV-1002', 1580.17, '2026-06-15', '2026-06-30', 'pending'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'INV-1003', 1580.17, '2026-05-15', '2026-05-30', 'overdue')
on conflict (invoice_number) do nothing;
