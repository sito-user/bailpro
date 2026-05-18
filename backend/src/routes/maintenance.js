const express = require('express');
const Joi = require('joi');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const createSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional().default('medium'),
});

const updateSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(2000).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
}).min(1);

// GET /api/v1/maintenance-requests
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const [{ count }] = await db('maintenance_requests')
      .where({ 'maintenance_requests.org_id': req.orgId })
      .count('maintenance_requests.id as count');

    const requests = await db('maintenance_requests')
      .where({ 'maintenance_requests.org_id': req.orgId })
      .join('properties', 'maintenance_requests.property_id', 'properties.id')
      .join('users', 'maintenance_requests.tenant_id', 'users.id')
      .select(
        'maintenance_requests.*',
        'properties.address as property_address',
        'properties.district as property_district',
        'users.full_name as tenant_name'
      )
      .orderBy('maintenance_requests.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      data: requests,
      total: parseInt(count, 10),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/maintenance-requests
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const { property_id, title, description, priority } = value;

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

    const [request] = await db('maintenance_requests')
      .insert({
        org_id: req.orgId,
        property_id,
        tenant_id: req.user.userId,
        title,
        description,
        priority,
        status: 'open',
      })
      .returning('*');

    return res.status(201).json({ data: request });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/maintenance-requests/:id
router.patch('/:id', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const existing = await db('maintenance_requests')
      .where({ id: req.params.id, org_id: req.orgId })
      .first();

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Demande introuvable',
      });
    }

    const [updated] = await db('maintenance_requests')
      .where({ id: req.params.id, org_id: req.orgId })
      .update({ ...value, updated_at: db.fn.now() })
      .returning('*');

    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
