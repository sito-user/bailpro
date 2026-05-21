const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

const createTenantSchema = Joi.object({
  full_name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(30).optional(),
  password: Joi.string().min(8).optional(),
});

// GET /api/v1/users/tenants — list all tenants of the org
router.get('/tenants', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const tenants = await db('users')
      .where({ org_id: req.orgId, role: 'locataire' })
      .select(['id', 'full_name', 'email', 'phone', 'created_at'])
      .orderBy('created_at', 'desc');

    return res.status(200).json({ data: tenants });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users/tenants — create a tenant
router.post('/tenants', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const { error, value } = createTenantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const { full_name, email, phone } = value;

    // Check if email already exists in org
    const existing = await db('users')
      .where({ org_id: req.orgId, email })
      .first();

    if (existing) {
      return res.status(409).json({
        error: 'EMAIL_TAKEN',
        message: 'Cet email est déjà utilisé dans votre organisation',
      });
    }

    // Generate password if not provided
    const plainPassword = value.password || Math.random().toString(36).slice(-8) + 'A1!';
    const password_hash = await bcrypt.hash(plainPassword, 12);

    const [tenant] = await db('users')
      .insert({
        org_id: req.orgId,
        email,
        password_hash,
        full_name,
        phone: phone || null,
        role: 'locataire',
      })
      .returning(['id', 'full_name', 'email', 'phone', 'role', 'created_at']);

    // Get org name for email
    const org = await db('organizations').where({ id: req.orgId }).first();

    // Send welcome email with credentials
    sendWelcomeEmail({
      to: email,
      full_name,
      role: 'locataire',
      org_name: org?.name,
      password: plainPassword,
    }).catch(console.error);

    return res.status(201).json({
      data: tenant,
      temp_password: plainPassword,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/users/tenants/:id
router.delete('/tenants/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const tenant = await db('users')
      .where({ id: req.params.id, org_id: req.orgId, role: 'locataire' })
      .first();

    if (!tenant) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Locataire introuvable',
      });
    }

    await db('users')
      .where({ id: req.params.id, org_id: req.orgId })
      .delete();

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
