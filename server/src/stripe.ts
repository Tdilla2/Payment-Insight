import { query, one } from './db.js';
import { getConfig } from './config.js';

// Real Stripe is used only when a genuine test key (sk_test_...) is configured.
// Otherwise we run a self-contained MOCK so the payment flow works end-to-end
// today, and flips to real test-mode charges the moment you set the keys.
function isLive(secret: string): boolean {
  return secret.startsWith('sk_test_') && !secret.includes('placeholder');
}

export async function createPaymentIntent(inv: any): Promise<{
  intentId: string; clientSecret: string; publishableKey: string; mock: boolean; amount: number;
}> {
  const cfg = await getConfig();
  const amountCents = Math.round(Number(inv.total_amount) * 100);
  let intentId: string;
  let clientSecret: string;
  let mock = true;

  if (isLive(cfg.STRIPE_SECRET_KEY)) {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(cfg.STRIPE_SECRET_KEY);
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { invoiceId: inv.id, invoiceNumber: inv.invoice_number },
      automatic_payment_methods: { enabled: true },
    });
    intentId = pi.id;
    clientSecret = pi.client_secret!;
    mock = false;
  } else {
    // Deterministic fake intent for the mock flow.
    intentId = 'pi_mock_' + inv.id.replace(/-/g, '').slice(0, 16);
    clientSecret = intentId + '_secret_mock';
  }

  await query(
    `insert into payments (invoice_id, client_id, amount, method, status, stripe_payment_intent)
     values ($1,$2,$3,'online','pending',$4)
     on conflict do nothing`,
    [inv.id, inv.client_id, inv.total_amount, intentId],
  );

  return { intentId, clientSecret, publishableKey: cfg.STRIPE_PUBLISHABLE_KEY, mock, amount: amountCents };
}

// Marks a payment + its invoice as paid. Called by the Stripe webhook
// (real mode, by intent id) or the /payments/:id/confirm endpoint (mock mode,
// by payment row id) — so it accepts either identifier.
export async function settlePayment(ref: string): Promise<void> {
  const pay = await one<any>(
    `select * from payments where stripe_payment_intent=$1 or id::text=$1`, [ref]);
  if (!pay) return;
  const confirmation = 'PAY-' + String(pay.stripe_payment_intent || pay.id).slice(-8).toUpperCase();
  await query(
    `update payments set status='succeeded', method='online',
     confirmation_number=$2, paid_at=now() where id=$1`,
    [pay.id, confirmation],
  );
  await query(`update invoices set status='paid', updated_at=now() where id=$1`, [pay.invoice_id]);
}
