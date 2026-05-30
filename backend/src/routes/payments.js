const express = require('express');
const Joi = require('joi');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateReceipt } = require('../services/receiptService');

const router = express.Router();

const paymentSchema = Joi.object({
  lease_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  due_date: Joi.date().required(),
  payment_method: Joi.string().max(50).optional().default('mobile_money_mock'),
});

// POST /api/v1/payments
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: error.details[0].message,
      });
    }

    const { lease_id, amount, due_date, payment_method } = value;

    // Verify lease belongs to org
    const lease = await db('leases')
      .where({ id: lease_id, org_id: req.orgId })
      .first();

    if (!lease) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Bail introuvable',
      });
    }

    if (lease.status !== 'active') {
      return res.status(409).json({
        error: 'LEASE_NOT_ACTIVE',
        message: 'Ce bail n\'est pas actif',
      });
    }

    // Create payment record
    const [payment] = await db('rent_payments')
      .insert({
        org_id: req.orgId,
        lease_id,
        amount,
        due_date,
        paid_at: new Date(),
        status: 'paid',
        payment_method,
      })
      .returning('*');

    // Generate receipt automatically
    let receipt = null;
    try {
      receipt = await generateReceipt(payment.id, req.orgId);
    } catch (receiptErr) {
      // Receipt generation failure should not block the payment
      // receipt generation failure does not block the payment
    }

    return res.status(201).json({
      data: payment,
      receipt,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/payments/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const payment = await db('rent_payments')
      .where({ id: req.params.id, org_id: req.orgId })
      .first();

    if (!payment) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Paiement introuvable',
      });
    }

    return res.status(200).json({ data: payment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
