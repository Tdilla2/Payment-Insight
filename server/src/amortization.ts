interface Loan {
  loan_amount: string | number;
  interest_rate: string | number;
  loan_term: number;
  monthly_payment: string | number;
  start_date: string | Date;
}

export interface AmortRow {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

// Standard fixed-rate amortization schedule.
export function amortization(loan: Loan): AmortRow[] {
  const principal0 = Number(loan.loan_amount);
  const annualRate = Number(loan.interest_rate) / 100;
  const monthlyRate = annualRate / 12;
  const months = Number(loan.loan_term) * 12;
  const payment = Number(loan.monthly_payment);

  const rows: AmortRow[] = [];
  let balance = principal0;
  // pg returns DATE columns as Date objects; strings ('YYYY-MM-DD') also work here.
  const start = new Date(loan.start_date);

  for (let m = 1; m <= months && balance > 0.005; m++) {
    const interest = balance * monthlyRate;
    let principal = payment - interest;
    if (principal > balance) principal = balance;
    balance -= principal;
    const d = new Date(start);
    d.setUTCMonth(d.getUTCMonth() + m);
    rows.push({
      month: m,
      date: d.toISOString().slice(0, 10),
      payment: round(principal + interest),
      principal: round(principal),
      interest: round(interest),
      balance: round(Math.max(balance, 0)),
    });
  }
  return rows;
}

const round = (n: number) => Math.round(n * 100) / 100;
