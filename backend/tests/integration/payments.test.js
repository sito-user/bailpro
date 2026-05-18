const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/config/db');

let tokenOrgA, tokenOrgB, orgAId;
let propertyA, tenantA, leaseA;

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db('receipts').del();
  await db('rent_payments').del();
  await db('leases').del();
  await db('properties').del();
  await db('users').del();
  await db('organizations').del();
  await db.destroy();
});

beforeEach(async () => {
  await db('receipts').del();
  await db('rent_payments').del();
  await db('leases').del();
  await db('properties').del();
  await db('users').del();
  await db('organizations').del();

  // Register Org A
  const resA = await request(app).post('/api/v1/auth/register').send({
    org_name: 'Agence Payment A',
    full_name: 'Admin Payment A',
    email: 'admin@payment-a.com',
    password: 'Password123',
  });
  tokenOrgA = resA.headers['set-cookie'][0];
  orgAId = resA.body.org.id;

  // Register Org B
  const resB = await request(app).post('/api/v1/auth/register').send({
    org_name: 'Agence Payment B',
    full_name: 'Admin Payment B',
    email: 'admin@payment-b.com',
    password: 'Password123',
  });
  tokenOrgB = resB.headers['set-cookie'][0];

  // Create property
  const propRes = await request(app)
    .post('/api/v1/properties')
    .set('Cookie', tokenOrgA)
    .send({ address: 'Apt Paiement Test', district: 'Cocody', rent_amount: 150000 });
  propertyA = propRes.body.data;

  // Create tenant
  const [tenant] = await db('users').insert({
    org_id: orgAId,
    email: 'locataire@payment-test.com',
    password_hash: '$2a$12$placeholder',
    full_name: 'Locataire Test',
    role: 'locataire',
  }).returning('*');
  tenantA = tenant;

  // Create lease
  const leaseRes = await request(app)
    .post('/api/v1/leases')
    .set('Cookie', tokenOrgA)
    .send({
      property_id: propertyA.id,
      tenant_id: tenantA.id,
      start_date: '2024-01-01',
      monthly_rent: 150000,
      deposit_amount: 300000,
    });
  leaseA = leaseRes.body.data;
});

describe('POST /api/v1/payments', () => {
  it('should create a payment and generate a receipt', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', tokenOrgA)
      .send({
        lease_id: leaseA.id,
        amount: 150000,
        due_date: '2024-02-01',
        payment_method: 'mobile_money_mock',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('paid');
    expect(res.body.data.paid_at).toBeTruthy();
    expect(res.body.receipt).toBeTruthy();
    expect(res.body.receipt.pdf_url).toBeTruthy();
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', tokenOrgA)
      .send({ lease_id: leaseA.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if lease does not belong to org', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', tokenOrgB)
      .send({
        lease_id: leaseA.id,
        amount: 150000,
        due_date: '2024-02-01',
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/payments/:id', () => {
  it('should return a payment', async () => {
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', tokenOrgA)
      .send({
        lease_id: leaseA.id,
        amount: 150000,
        due_date: '2024-02-01',
      });

    const paymentId = payRes.body.data.id;

    const res = await request(app)
      .get(`/api/v1/payments/${paymentId}`)
      .set('Cookie', tokenOrgA);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(paymentId);
  });

  it('should return 404 if payment belongs to another org', async () => {
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', tokenOrgA)
      .send({
        lease_id: leaseA.id,
        amount: 150000,
        due_date: '2024-02-01',
      });

    const paymentId = payRes.body.data.id;

    const res = await request(app)
      .get(`/api/v1/payments/${paymentId}`)
      .set('Cookie', tokenOrgB);

    expect(res.status).toBe(404);
  });
});
