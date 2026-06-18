-- Loan type/category for each loan (e.g. Home Mortgage, Auto Loan).
alter table loans add column if not exists loan_type text not null default 'Home Mortgage';
