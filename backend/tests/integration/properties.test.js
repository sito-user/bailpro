const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/config/db');

let tokenOrgA, tokenOrgB, orgAId, orgBId;

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

  // Register Org A
  const resA = await request(app).post('/api/v1/auth/register').send({
    org_name: 'Agence A',
    full_name: 'Admin A',
    email: 'admin@orga.com',
    password: 'Password123',
  });
  tokenOrgA = resA.headers['set-cookie'][0];
  orgAId = resA.body.org.id;

  // Register Org B
  const resB = await request(app).post('/api/v1/auth/register').send({
    org_name: 'Agence B',
    full_name: 'Admin B',
    email: 'admin@orgb.com',
    password: 'Password123',
  });
  tokenOrgB = resB.headers['set-cookie'][0];
  orgBId = resB.body.org.id;
});

describe('POST /api/v1/properties', () => {
  it('should create a property for org A', async () => {
    const res = await request(app)
      .post('/api/v1/properties')
      .set('Cookie', tokenOrgA)
      .send({
        address: 'Rue des Jardins, Cocody, Abidjan',
        district: 'Cocody',
        surface_m2: 75,
        rent_amount: 150000,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.address).toBe('Rue des Jardins, Cocody, Abidjan');
    expect(res.body.data.org_id).toBe(orgAId);
  });

  it('should return 400 if rent_amount is missing', async () => {
    const res = await request(app)
      .post('/api/v1/properties')
      .set('Cookie', tokenOrgA)
      .send({ address: 'Rue des Jardins, Cocody, Abidjan' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/properties')
      .send({ address: 'Test', rent_amount: 100000 });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/properties', () => {
  it('should return only org A properties for org A user', async () => {
    // Create property for org A
    await request(app)
      .post('/api/v1/properties')
      .set('Cookie', tokenOrgA)
      .send({ address: 'Appartement Cocody', district: 'Cocody', rent_amount: 150000 });

    // Create property for org B
    await request(app)
      .post('/api/v1/properties')
      .set('Cookie', tokenOrgB)
      .send({ address: 'Appartement Marcory', district: 'Marcory', rent_amount: 120000 });

    const res = await request(app)
      .get('/api/v1/properties')
      .set('Cookie', tokenOrgA);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].district).toBe('Cocody');
  });
});

describe('Cross-tenant isolation — Properties', () => {
  it('org B cannot access a property created by org A', async () => {
    // Create property with org A
    const createRes = await request(app)
      .post('/api/v1/properties')
      .set('Cookie', tokenOrgA)
      .send({ address: 'Appartement Secret Org A', rent_amount: 200000 });

    const propertyId = createRes.body.data.id;

    // Try to access with org B
    const res = await request(app)
      .get(`/api/v1/properties/${propertyId}`)
      .set('Cookie', tokenOrgB);

    expect(res.status).toBe(404);
  });

  it('org B cannot update a property of org A', async () => {
    const createRes = await request(app)
      .post('/api/v1/properties')
      .set('Cookie', tokenOrgA)
      .send({ address: 'Appartement à protéger', rent_amount: 200000 });

    const propertyId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/properties/${propertyId}`)
      .set('Cookie', tokenOrgB)
      .send({ rent_amount: 999999 });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/properties/:id', () => {
  it('should update a property', async () => {
    const createRes = await request(app)
      .post('/api/v1/properties')
      .set('Cookie', tokenOrgA)
      .send({ address: 'Ancien Appartement', rent_amount: 100000 });

    const propertyId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/properties/${propertyId}`)
      .set('Cookie', tokenOrgA)
      .send({ rent_amount: 120000 });

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.data.rent_amount)).toBe(120000);
  });
});

describe('DELETE /api/v1/properties/:id', () => {
  it('should delete a property', async () => {
    const createRes = await request(app)
      .post('/api/v1/properties')
      .set('Cookie', tokenOrgA)
      .send({ address: 'À supprimer', rent_amount: 100000 });

    const propertyId = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/properties/${propertyId}`)
      .set('Cookie', tokenOrgA);

    expect(res.status).toBe(204);
  });
});
