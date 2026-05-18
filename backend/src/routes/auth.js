const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require('../config/env');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  org_name: Joi.string().min(2).max(255).required(),
  full_name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Helper to set JWT cookie
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const { org_name, full_name, email, password } = value;

    // Generate slug from org name
    const slug = org_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingOrg = await db('organizations').where({ slug }).first();
    if (existingOrg) {
      return res.status(409).json({
        error: 'SLUG_TAKEN',
        message: 'Ce nom d\'organisation est déjà pris',
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Create org and admin user in a transaction
    const result = await db.transaction(async (trx) => {
      const [org] = await trx('organizations')
        .insert({ name: org_name, slug })
        .returning('*');

      const [user] = await trx('users')
        .insert({
          org_id: org.id,
          email,
          password_hash,
          full_name,
          role: 'admin',
        })
        .returning(['id', 'org_id', 'email', 'full_name', 'role']);

      return { org, user };
    });

    const token = jwt.sign(
      { userId: result.user.id, orgId: result.org.id, role: result.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    setTokenCookie(res, token);

    return res.status(201).json({
      user: result.user,
      org: result.org,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const { email, password } = value;

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect',
      });
    }

    const token = jwt.sign(
      { userId: user.id, orgId: user.org_id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    setTokenCookie(res, token);

    return res.status(200).json({
      user: {
        id: user.id,
        org_id: user.org_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.status(200).json({ message: 'Déconnecté avec succès' });
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await db('users')
      .where({ id: req.user.userId })
      .select(['id', 'org_id', 'email', 'full_name', 'role', 'phone'])
      .first();

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Utilisateur introuvable',
      });
    }

    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
