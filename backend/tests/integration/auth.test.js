const request = require('supertest');
const app = require('../../src/server');
const db = require('../../src/config/db');

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db('users').del();
  await db('organizations').del();
  await db.destroy();
});

beforeEach(async () => {
  await db('users').del();
  await db('organizations').del();
});

describe('POST /api/v1/auth/register', () => {
  const validPayload = {
    org_name: 'Agence Test',
    full_name: 'Jean Dupont',
    email: 'jean@test.com',
    password: 'Password123',
  };

  it('should create an org and admin user, return 201 + cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('jean@test.com');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.org.name).toBe('Agence Test');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 400 if email is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validPayload, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('should return 400 if password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validPayload, password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    // Register a user first
    await request(app).post('/api/v1/auth/register').send({
      org_name: 'Agence Login Test',
      full_name: 'Marie Konan',
      email: 'marie@test.com',
      password: 'Password123',
    });
  });

  it('should login successfully and return cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'marie@test.com', password: 'Password123' })
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('marie@test.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'marie@test.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 with unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'unknown@test.com', password: 'Password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('should clear the cookie and return 200', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return 401 if no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('should return user profile with valid token', async () => {
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      org_name: 'Agence Me Test',
      full_name: 'Karim Diallo',
      email: 'karim@test.com',
      password: 'Password123',
    });

  const cookies = registerRes.headers['set-cookie'];
  const cookieString = Array.isArray(cookies) ? cookies[0] : cookies;

  const res = await request(app)
    .get('/api/v1/auth/me')
    .set('Cookie', cookieString);

  expect(res.status).toBe(200);
  expect(res.body.user.email).toBe('karim@test.com');
});
});

describe('GET /healthz', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
