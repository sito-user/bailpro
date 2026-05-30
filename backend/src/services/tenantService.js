const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sendWelcomeEmail } = require('./emailService');

const generateSecurePassword = () => {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) + 'A1!';
};

const createTenant = async ({ orgId, full_name, email, phone, property_id, start_date, monthly_rent, deposit_amount, password }) => {
  const existing = await db('users').where({ org_id: orgId, email }).first();
  if (existing) {
    const err = new Error('Cet email est déjà utilisé');
    err.status = 409;
    err.code = 'EMAIL_TAKEN';
    throw err;
  }

  if (property_id) {
    const property = await db('properties').where({ id: property_id, org_id: orgId }).first();
    if (!property) {
      const err = new Error('Logement introuvable');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (property.status === 'occupied') {
      const err = new Error('Ce logement est déjà occupé');
      err.status = 409;
      err.code = 'PROPERTY_OCCUPIED';
      throw err;
    }
  }

  const plainPassword = password || generateSecurePassword();
  const password_hash = await bcrypt.hash(plainPassword, 12);

  const result = await db.transaction(async (trx) => {
    const [tenant] = await trx('users').insert({
      org_id: orgId,
      email,
      password_hash,
      full_name,
      phone: phone || null,
      role: 'locataire',
    }).returning(['id', 'full_name', 'email', 'phone', 'role', 'created_at']);

    let lease = null;
    if (property_id) {
      const property = await trx('properties').where({ id: property_id }).first();
      const rent = monthly_rent || property.rent_amount;

      const [newLease] = await trx('leases').insert({
        org_id: orgId,
        property_id,
        tenant_id: tenant.id,
        start_date: start_date || new Date(),
        monthly_rent: rent,
        deposit_amount: deposit_amount || 0,
        status: 'active',
      }).returning('*');

      await trx('properties').where({ id: property_id }).update({ status: 'occupied', updated_at: trx.fn.now() });
      lease = newLease;
    }

    return { tenant, lease };
  });

  const org = await db('organizations').where({ id: orgId }).first();
  const pino = require('pino');
  const logger = pino({ level: 'info' });
  sendWelcomeEmail({
    to: email,
    full_name,
    role: 'locataire',
    org_name: org?.name,
    password: plainPassword,
  }).catch((err) => logger.error({ err: err.message }, 'Welcome email failed'));

  return { tenant: result.tenant, lease: result.lease, plainPassword };
};

module.exports = { createTenant };
