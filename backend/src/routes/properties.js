const express = require('express');
const Joi = require('joi');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const propertySchema = Joi.object({
  address: Joi.string().min(5).max(500).required(),
  district: Joi.string().max(100).optional(),
  surface_m2: Joi.number().positive().optional(),
  rent_amount: Joi.number().positive().required(),
  status: Joi.string().valid('available', 'occupied', 'maintenance').optional(),
  type: Joi.string().valid('appartement', 'villa', 'magasin', 'bureau', 'entrepot', 'autre').optional().default('appartement'),
});

const updatePropertySchema = Joi.object({
  address: Joi.string().min(5).max(500).optional(),
  district: Joi.string().max(100).optional(),
  surface_m2: Joi.number().positive().optional(),
  rent_amount: Joi.number().positive().optional(),
  status: Joi.string().valid('available', 'occupied', 'maintenance').optional(),
  type: Joi.string().valid('appartement', 'villa', 'magasin', 'bureau', 'entrepot', 'autre').optional(),
}).min(1);

// GET /api/v1/properties
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const [{ count }] = await db('properties')
      .where({ org_id: req.orgId })
      .count('id as count');

    const properties = await db('properties')
      .where({ org_id: req.orgId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.status(200).json({
      data: properties,
      total: parseInt(count, 10),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/properties/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const property = await db('properties')
      .where({ id: req.params.id, org_id: req.orgId })
      .first();

    if (!property) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Logement introuvable',
      });
    }

    return res.status(200).json({ data: property });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/properties
router.post('/', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const { error, value } = propertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const [property] = await db('properties')
      .insert({ ...value, org_id: req.orgId })
      .returning('*');

    return res.status(201).json({ data: property });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/properties/:id
router.patch('/:id', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const { error, value } = updatePropertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const existing = await db('properties')
      .where({ id: req.params.id, org_id: req.orgId })
      .first();

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Logement introuvable',
      });
    }

    const [updated] = await db('properties')
      .where({ id: req.params.id, org_id: req.orgId })
      .update({ ...value, updated_at: db.fn.now() })
      .returning('*');

    return res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/properties/:id
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const existing = await db('properties')
      .where({ id: req.params.id, org_id: req.orgId })
      .first();

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Logement introuvable',
      });
    }

    await db('properties')
      .where({ id: req.params.id, org_id: req.orgId })
      .delete();

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
