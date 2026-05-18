const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/config/db');

let tokenOrgA, tokenOrgB, orgAId, orgBId;
let propertyA, tenantA;

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db('rent_payments').del();
  await db('leases').del();
  await db('properties').del();
  await db('users').del();
  await db('organizations').del();
  await db.destroy();
});

beforeEach(async () => {
  await db('rent_payments').del();
  await db('leases').del();
  await db('properties').del();
  await db('users').del();
  await db('organizations').del();

  const resA = await request(app).post('/api/v1/auth/register').send({
    org_name: 'Agence Bail A',
    full_name: 'Admin Bail A',
    email: 'admin@bail-a.com',
    password: 'Password123',
  });
  tokenOrgA = resA.headers['set-cookie'][0];
  orgAId = resA.body.org.id;

  const resB = await request(app).post('/api/v1/auth/register').send({
    org_name: 'Agence Bail B',
    full_name: 'Admin Bail B',
    email: 'admin@bail-b.com',
    password: 'Password123',
  });
  tokenOrgB = resB.headers['set-cookie'][0];

  const propRes = await request(app)
    .post('/api/v1/properties')
    .set('Cookie', tokenOrgA)
    .send({ address: 'Apt Cocody Lease Test', district: 'Cocody', rent_amount: 150000 });
  propertyA = propRes.body.data;

  const [tenant] = await db('users').insert({
    org_id: orgAId,
    email: 'karim@locataire.com',
    password_hash: '$2a$12$placeholder',
    full_name: 'Karim Locataire',
    role: 'locataire',
  }).returning('*');
  tenantA = tenant;
});

describe('POST /api/v1/leases', () => {
  it('should create a lease and set property to occupied', async () => {
    const res = await request(app)
      .post('/api/v1/leases')
      .set('Cookie', tokenOrgA)
      .send({
        property_id: propertyA.id,
        tenant_id: tenantA.id,
        start_date: '2024-01-01',
        monthly_rent: 150000,
        deposit_amount: 300000,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('active');

    // Verify property is now occupied
    const prop = await db('properties').where({ id: propertyA.id }).first();
    expect(prop.status).toBe('occupied');
  });

  it('should return 409 if property is already occupied', async () => {
    // Create first lease
    await request(app)
      .post('/api/v1/leases')
      .set('Cookie', tokenOrgA)
      .send({
        property_id: propertyA.id,
        tenant_id: tenantA.id,
        start_date: '2024-01-01',
        monthly_rent: 150000,
      });

    // Try to create second lease on same property
    const res = await request(app)
      .post('/api/v1/leases')
      .set('Cookie', tokenOrgA)
      .send({
        property_id: propertyA.id,
        tenant_id: tenantA.id,
        start_date: '2024-06-01',
        monthly_rent: 150000,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('PROPERTY_OCCUPIED');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/leases')
      .set('Cookie', tokenOrgA)
      .send({ property_id: propertyA.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});

describe('Cross-tenant isolation — Leases', () => {
  it('org B cannot access a lease created by org A', async () => {
    const leaseRes = await request(app)
      .post('/api/v1/leases')
      .set('Cookie', tokenOrgA)
      .send({
        property_id: propertyA.id,
        tenant_id: tenantA.id,
        start_date: '2024-01-01',
        monthly_rent: 150000,
      });

    const leaseId = leaseRes.body.data.id;

    const res = await request(app)
      .get(`/api/v1/leases/${leaseId}`)
      .set('Cookie', tokenOrgB);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/leases/:id/payments', () => {
  it('should return empty payments for a new lease', async () => {
    const leaseRes = await request(app)
      .post('/api/v1/leases')
      .set('Cookie', tokenOrgA)
      .send({
        property_id: propertyA.id,
        tenant_id: tenantA.id,
        start_date: '2024-01-01',
        monthly_rent: 150000,
      });

    const leaseId = leaseRes.body.data.id;

    const res = await request(app)
      .get(`/api/v1/leases/${leaseId}/payments`)
      .set('Cookie', tokenOrgA);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
