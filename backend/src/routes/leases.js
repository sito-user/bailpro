const express = require('express');
const Joi = require('joi');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const leaseSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  tenant_id: Joi.string().uuid().required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().greater(Joi.ref('start_date')).optional(),
  monthly_rent: Joi.number().positive().required(),
  deposit_amount: Joi.number().min(0).optional(),
});

const updateLeaseSchema = Joi.object({
  end_date: Joi.date().optional(),
  monthly_rent: Joi.number().positive().optional(),
  deposit_amount: Joi.number().min(0).optional(),
  status: Joi.string().valid('active', 'terminated', 'pending').optional(),
}).min(1);

// GET /api/v1/leases
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const [{ count }] = await db('leases')
      .where({ 'leases.org_id': req.orgId })
      .count('leases.id as count');

    const leases = await db('leases')
      .where({ 'leases.org_id': req.orgId })
      .join('properties', 'leases.property_id', 'properties.id')
      .join('users', 'leases.tenant_id', 'users.id')
      .select(
        'leases.*',
        'properties.address as property_address',
        'properties.district as property_district',
        'users.full_name as tenant_name',
        'users.email as tenant_email'
      )
      .orderBy('leases.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      data: leases,
      total: parseInt(count, 10),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/leases/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const lease = await db('leases')
      .where({ 'leases.id': req.params.id, 'leases.org_id': req.orgId })
      .join('properties', 'leases.property_id', 'properties.id')
      .join('users', 'leases.tenant_id', 'users.id')
      .select(
        'leases.*',
        'properties.address as property_address',
        'properties.district as property_district',
        'users.full_name as tenant_name',
        'users.email as tenant_email'
      )
      .first();

    if (!lease) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Bail introuvable',
      });
    }

    return res.status(200).json({ data: lease });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/leases
router.post('/', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const { error, value } = leaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const { property_id, tenant_id, ...rest } = value;

    // Verify property belongs to org
    const property = await db('properties')
      .where({ id: property_id, org_id: req.orgId })
      .first();

    if (!property) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Logement introuvable',
      });
    }

    // Verify tenant belongs to org
    const tenant = await db('users')
      .where({ id: tenant_id, org_id: req.orgId, role: 'locataire' })
      .first();

    if (!tenant) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Locataire introuvable',
      });
    }

    // Check property is available
    if (property.status === 'occupied') {
      return res.status(409).json({
        error: 'PROPERTY_OCCUPIED',
        message: 'Ce logement est déjà occupé',
      });
    }

    // Create lease and update property status in transaction
    const lease = await db.transaction(async (trx) => {
      const [newLease] = await trx('leases')
        .insert({
          org_id: req.orgId,
          property_id,
          tenant_id,
          status: 'active',
          ...rest,
        })
        .returning('*');

      await trx('properties')
        .where({ id: property_id })
        .update({ status: 'occupied', updated_at: trx.fn.now() });

      return newLease;
    });

    return res.status(201).json({ data: lease });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/leases/:id
router.patch('/:id', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const { error, value } = updateLeaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const existing = await db('leases')
      .where({ id: req.params.id, org_id: req.orgId })
      .first();

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Bail introuvable',
      });
    }

    const [updated] = await db('leases')
      .where({ id: req.params.id, org_id: req.orgId })
      .update({ ...value, updated_at: db.fn.now() })
      .returning('*');

    // If lease is terminated, free up the property
    if (value.status === 'terminated') {
      await db('properties')
        .where({ id: existing.property_id })
        .update({ status: 'available', updated_at: db.fn.now() });
    }

    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/leases/:id/payments
router.get('/:id/payments', requireAuth, async (req, res, next) => {
  try {
    const lease = await db('leases')
      .where({ id: req.params.id, org_id: req.orgId })
      .first();

    if (!lease) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Bail introuvable',
      });
    }

    const payments = await db('rent_payments')
      .where({ lease_id: req.params.id, org_id: req.orgId })
      .orderBy('due_date', 'desc');

    return res.status(200).json({ data: payments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
