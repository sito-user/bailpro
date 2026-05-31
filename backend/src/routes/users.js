const express = require('express');
const Joi = require('joi');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createTenant } = require('../services/tenantService');

const router = express.Router();

const createTenantSchema = Joi.object({
  full_name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(30).optional(),
  password: Joi.string().min(8).optional(),
  property_id: Joi.string().uuid().optional(),
  start_date: Joi.date().optional(),
  monthly_rent: Joi.number().positive().optional(),
  deposit_amount: Joi.number().min(0).optional(),
});

// GET /api/v1/users/tenants
router.get('/tenants', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const [{ count }] = await db('users')
      .where({ org_id: req.orgId, role: 'locataire' })
      .count('id as count');

    const tenants = await db('users')
      .where({ org_id: req.orgId, role: 'locataire' })
      .select(['id', 'full_name', 'email', 'phone', 'created_at'])
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.status(200).json({ data: tenants, total: parseInt(count, 10), page, limit });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users/tenants
router.post('/tenants', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const { error, value } = createTenantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: error.details[0].message });
    }

    const { tenant, lease, plainPassword } = await createTenant({ orgId: req.orgId, ...value });
    return res.status(201).json({ data: tenant, lease, temp_password: plainPassword });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/users/tenants/:id
router.delete('/tenants/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const tenant = await db('users').where({ id: req.params.id, org_id: req.orgId, role: 'locataire' }).first();
    if (!tenant) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Locataire introuvable' });
    }

    await db.transaction(async (trx) => {
      // Résilier les baux actifs et libérer les logements
      const activeLeases = await trx('leases').where({ tenant_id: req.params.id, status: 'active' });
      for (const lease of activeLeases) {
        await trx('leases').where({ id: lease.id }).update({ status: 'terminated', updated_at: trx.fn.now() });
        await trx('properties').where({ id: lease.property_id }).update({ status: 'available', updated_at: trx.fn.now() });
      }
      // Supprimer le locataire
      await trx('users').where({ id: req.params.id, org_id: req.orgId }).delete();
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
