import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { query, one } from './db.js';
import { getConfig } from './config.js';
import { amortization } from './amortization.js';
import { createPaymentIntent, settlePayment } from './stripe.js';
import { provisionClientUser, provisionAdminUser, listAllUsers, deleteUser } from './cognitoAdmin.js';

// ---------- helpers ----------
const json = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  body: JSON.stringify(body),
});

interface Identity { sub: string; email: string; role: 'superadmin' | 'client'; }

function identity(event: APIGatewayProxyEventV2): Identity | null {
  const claims = (event.requestContext as any)?.authorizer?.jwt?.claims;
  if (!claims) return null;
  const raw = claims['cognito:groups'];
  const groups: string[] = Array.isArray(raw)
    ? raw
    : String(raw ?? '').replace(/[[\]]/g, '').split(/[ ,]+/).filter(Boolean);
  return {
    sub: claims.sub,
    email: claims.email,
    role: groups.includes('superadmin') ? 'superadmin' : 'client',
  };
}

async function clientIdFor(id: Identity): Promise<string | null> {
  if (id.role === 'superadmin') return null;
  const u = await one<{ client_id: string }>('select client_id from users where cognito_sub=$1', [id.sub]);
  if (u?.client_id) return u.client_id;
  const c = await one<{ id: string }>('select id from clients where lower(email)=lower($1)', [id.email]);
  if (c) {
    await query(
      `insert into users (cognito_sub, email, role, client_id) values ($1,$2,'client',$3)
       on conflict (email) do update set cognito_sub=$1, client_id=$3`,
      [id.sub, id.email, c.id]);
    return c.id;
  }
  return null;
}

const body = (event: APIGatewayProxyEventV2) => {
  try {
    let raw = event.body;
    if (raw && event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

// Client query with its primary loan fields merged in (matches the UI shape).
const CLIENT_SELECT = `
  select c.*, l.loan_type, l.loan_amount, l.interest_rate, l.loan_term, l.monthly_payment,
         l.start_date, l.next_payment_date, l.balance
  from clients c
  left join lateral (select * from loans where client_id = c.id order by created_at limit 1) l on true`;

const INVOICE_SELECT = `
  select i.*, c.name as client_name, c.email as client_email, l.loan_type
  from invoices i
  join clients c on c.id = i.client_id
  left join lateral (select loan_type from loans where client_id = c.id order by created_at limit 1) l on true`;

async function upsertLoan(clientId: string, b: any) {
  if (b.loanAmount == null) return;
  const existing = await one<{ id: string }>('select id from loans where client_id=$1 order by created_at limit 1', [clientId]);
  if (existing) {
    await query(
      `update loans set loan_type=coalesce($9,loan_type), loan_amount=$2, interest_rate=$3, loan_term=$4,
       monthly_payment=$5, start_date=$6, next_payment_date=$7, balance=$8 where id=$1`,
      [existing.id, b.loanAmount, b.interestRate, b.loanTerm, b.monthlyPayment, b.startDate, b.nextPaymentDate, b.balance ?? b.loanAmount, b.loanType]);
  } else {
    await query(
      `insert into loans (client_id,loan_amount,interest_rate,loan_term,monthly_payment,start_date,next_payment_date,balance,loan_type)
       values ($1,$2,$3,$4,$5,$6,$7,$8,coalesce($9,'Home Mortgage'))`,
      [clientId, b.loanAmount, b.interestRate, b.loanTerm, b.monthlyPayment, b.startDate, b.nextPaymentDate, b.balance ?? b.loanAmount, b.loanType]);
  }
}

// ---------- handler ----------
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.rawPath.replace(/\/$/, '') || '/';
  const seg = path.split('/').filter(Boolean);

  try {
    // ----- public -----
    if (method === 'GET' && path === '/health') return json(200, { ok: true });

    if (method === 'POST' && path === '/stripe/webhook') {
      const evt = body(event);
      const intentId = evt?.data?.object?.id || evt?.intentId;
      if (evt?.type === 'payment_intent.succeeded' && intentId) await settlePayment(intentId);
      return json(200, { received: true });
    }

    // ----- authenticated -----
    const id = identity(event);
    if (!id) return json(401, { error: 'unauthorized' });

    if (method === 'GET' && path === '/me') {
      const clientId = await clientIdFor(id);
      const cfg = await getConfig();
      return json(200, {
        email: id.email, role: id.role, clientId,
        stripePublishableKey: cfg.STRIPE_PUBLISHABLE_KEY, stripeMode: cfg.STRIPE_MODE,
      });
    }

    const myClient = await clientIdFor(id);
    const admin = id.role === 'superadmin';

    // ----- /users (user management — admins + clients; superadmin only) -----
    if (seg[0] === 'users') {
      if (!admin) return json(403, { error: 'forbidden' });
      if (seg.length === 1 && method === 'GET') return json(200, await listAllUsers());
      if (seg.length === 1 && method === 'POST') {
        // Invite a new admin user (clients are created via /clients with loan details).
        const b = body(event);
        if (!b.email) return json(400, { error: 'email required' });
        const tempPassword = b.password || 'Temp1234!';
        await provisionAdminUser(b.email, tempPassword);
        return json(201, { email: b.email, role: 'admin', tempPassword });
      }
      if (seg.length === 2 && method === 'DELETE') {
        const target = decodeURIComponent(seg[1]);
        if (target.toLowerCase() === id.email.toLowerCase())
          return json(400, { error: 'You cannot remove your own account.' });
        // Remove the login. If they're a client, also drop their app record/link.
        await deleteUser(target);
        await query('delete from users where lower(email)=lower($1)', [target]);
        await query('delete from clients where lower(email)=lower($1)', [target]);
        return json(204, {});
      }
    }

    // ----- /clients -----
    if (seg[0] === 'clients') {
      if (seg.length === 1) {
        if (method === 'GET') {
          return admin
            ? json(200, await query(`${CLIENT_SELECT} order by c.created_at desc`))
            : json(200, await query(`${CLIENT_SELECT} where c.id=$1`, [myClient]));
        }
        if (method === 'POST' && admin) {
          const b = body(event);
          const c = await one<any>(
            `insert into clients (name,email,phone,status,billing_day)
             values ($1,$2,$3,coalesce($4,'current'),coalesce($5,1)) returning *`,
            [b.name, b.email, b.phone ?? '', b.status, b.billingDay]);
          await upsertLoan(c!.id, b);
          // Provision a Cognito login (temp password -> must change on first sign-in).
          await provisionClientUser(b.email, b.password || 'Temp1234!');
          return json(201, await one(`${CLIENT_SELECT} where c.id=$1`, [c!.id]));
        }
      }
      const cid = seg[1];
      if (!admin && cid !== myClient) return json(403, { error: 'forbidden' });

      if (seg.length === 2 && method === 'GET')
        return json(200, await one(`${CLIENT_SELECT} where c.id=$1`, [cid]));
      if (seg.length === 2 && method === 'PUT' && admin) {
        const b = body(event);
        await query(
          `update clients set name=coalesce($2,name), email=coalesce($3,email),
           phone=coalesce($4,phone), status=coalesce($5,status), billing_day=coalesce($6,billing_day),
           updated_at=now() where id=$1`,
          [cid, b.name, b.email, b.phone, b.status, b.billingDay]);
        await upsertLoan(cid, b);
        return json(200, await one(`${CLIENT_SELECT} where c.id=$1`, [cid]));
      }
      if (seg.length === 2 && method === 'DELETE' && admin) {
        const c = await one<{ email: string }>('select email from clients where id=$1', [cid]);
        await query('delete from clients where id=$1', [cid]);
        if (c) await deleteUser(c.email);
        return json(204, {});
      }
      if (seg[2] === 'amortization' && method === 'GET') {
        const loan = await one<any>('select * from loans where client_id=$1 order by created_at limit 1', [cid]);
        if (!loan) return json(404, { error: 'no loan' });
        return json(200, amortization(loan));
      }
    }

    // ----- /invoices -----
    if (seg[0] === 'invoices') {
      if (seg.length === 1 && method === 'GET') {
        return admin
          ? json(200, await query(`${INVOICE_SELECT} order by i.invoice_date desc`))
          : json(200, await query(`${INVOICE_SELECT} where i.client_id=$1 order by i.invoice_date desc`, [myClient]));
      }
      if (seg.length === 1 && method === 'POST' && admin) {
        const b = body(event);
        const inv = await one<any>(
          `insert into invoices (client_id,loan_id,invoice_number,amount,late_fee,total_amount,invoice_date,due_date,status,description)
           values ($1,$2,$3,$4,coalesce($5,0),$6,$7,$8,coalesce($9,'pending'),coalesce($10,'')) returning id`,
          [b.clientId, b.loanId, b.invoiceNumber, b.amount ?? b.totalAmount, b.lateFee, b.totalAmount, b.invoiceDate, b.dueDate, b.status, b.description]);
        return json(201, await one(`${INVOICE_SELECT} where i.id=$1`, [inv!.id]));
      }
      const iid = seg[1];
      if (seg.length === 2 && method === 'PUT' && admin) {
        const b = body(event);
        await query(
          `update invoices set total_amount=coalesce($2,total_amount), amount=coalesce($3,amount),
           late_fee=coalesce($4,late_fee), due_date=coalesce($5,due_date), status=coalesce($6,status),
           description=coalesce($7,description), updated_at=now() where id=$1`,
          [iid, b.totalAmount, b.amount, b.lateFee, b.dueDate, b.status, b.description]);
        return json(200, await one(`${INVOICE_SELECT} where i.id=$1`, [iid]));
      }
      if (seg.length === 2 && method === 'DELETE' && admin) {
        await query('delete from invoices where id=$1', [iid]);
        return json(204, {});
      }
    }

    // ----- /payments -----
    if (seg[0] === 'payments') {
      if (seg.length === 1 && method === 'GET') {
        return admin
          ? json(200, await query('select * from payments order by created_at desc'))
          : json(200, await query('select * from payments where client_id=$1 order by created_at desc', [myClient]));
      }
      if (path === '/payments/intent' && method === 'POST') {
        const b = body(event);
        const inv = await one<any>('select * from invoices where id=$1', [b.invoiceId]);
        if (!inv) return json(404, { error: 'invoice not found' });
        if (!admin && inv.client_id !== myClient) return json(403, { error: 'forbidden' });
        return json(200, await createPaymentIntent(inv));
      }
      if (seg[2] === 'confirm' && method === 'POST') {
        await settlePayment(seg[1]);
        return json(200, { status: 'succeeded' });
      }
    }

    return json(404, { error: 'not found', path, method });
  } catch (err: any) {
    console.error(err);
    return json(500, { error: 'server_error', detail: err?.message });
  }
};
