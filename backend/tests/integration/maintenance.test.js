const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/config/db');

let tokenOrgA, tokenOrgB, orgAId;
let propertyA, adminUserA;

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db('maintenance_requests').del();
  await db('receipts').del();
  await db('rent_payments').del();
  await db('leases').del();
  await db('properties').del();
  await db('users').del();
  await db('organizations').del();
  await db.destroy();
});

beforeEach(async () => {
  await db('maintenance_requests').del();
  await db('receipts').del();
  await db('rent_payments').del();
  await db('leases').del();
  await db('properties').del();
  await db('users').del();
  await db('organizations').del();

  // Register Org A
  const resA = await request(app).post('/api/v1/auth/register').send({
    org_name: 'Agence Maintenance A',
    full_name: 'Admin Maintenance A',
    email: 'admin@maint-a.com',
    password: 'Password123',
  });
  tokenOrgA = resA.headers['set-cookie'][0];
  orgAId = resA.body.org.id;
  adminUserA = resA.body.user;

  // Register Org B
  const resB = await request(app).post('/api/v1/auth/register').send({
    org_name: 'Agence Maintenance B',
    full_name: 'Admin Maintenance B',
    email: 'admin@maint-b.com',
    password: 'Password123',
  });
  tokenOrgB = resB.headers['set-cookie'][0];

  // Create property for Org A
  const propRes = await request(app)
    .post('/api/v1/properties')
    .set('Cookie', tokenOrgA)
    .send({ address: 'Apt Maintenance Test', district: 'Marcory', rent_amount: 120000 });
  propertyA = propRes.body.data;
});

describe('POST /api/v1/maintenance-requests', () => {
  it('should create a maintenance request', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance-requests')
      .set('Cookie', tokenOrgA)
      .send({
        property_id: propertyA.id,
        title: 'Fuite d\'eau dans la salle de bain',
        description: 'La robinetterie fuit depuis 2 jours',
        priority: 'high',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('open');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.title).toBe('Fuite d\'eau dans la salle de bain');
  });

  it('should return 400 if title is missing', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance-requests')
      .set('Cookie', tokenOrgA)
      .send({ property_id: propertyA.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if property belongs to another org', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance-requests')
      .set('Cookie', tokenOrgB)
      .send({
        property_id: propertyA.id,
        title: 'Test intrusion',
        priority: 'low',
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/maintenance-requests', () => {
  it('should return only org A requests', async () => {
    await request(app)
      .post('/api/v1/maintenance-requests')
      .set('Cookie', tokenOrgA)
      .send({ property_id: propertyA.id, title: 'Problème électrique', priority: 'urgent' });

    const res = await request(app)
      .get('/api/v1/maintenance-requests')
      .set('Cookie', tokenOrgA);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Problème électrique');
  });
});

describe('PATCH /api/v1/maintenance-requests/:id', () => {
  it('should update the status of a maintenance request', async () => {
    const createRes = await request(app)
      .post('/api/v1/maintenance-requests')
      .set('Cookie', tokenOrgA)
      .send({ property_id: propertyA.id, title: 'Porte cassée', priority: 'medium' });

    const requestId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/maintenance-requests/${requestId}`)
      .set('Cookie', tokenOrgA)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });
});

describe('GET /api/v1/dashboard/overview', () => {
  it('should return correct KPIs', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/overview')
      .set('Cookie', tokenOrgA);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total_properties');
    expect(res.body.data).toHaveProperty('occupied_properties');
    expect(res.body.data).toHaveProperty('pending_payments');
    expect(res.body.data).toHaveProperty('monthly_revenue');
    expect(res.body.data).toHaveProperty('open_maintenance');
    expect(res.body.data.total_properties).toBe(1);
    expect(res.body.data.occupied_properties).toBe(0);
  });
});
