const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { generateReceipt, streamReceiptPdf } = require('../services/receiptService');

const router = express.Router();

// POST /api/v1/receipts/generate
router.post('/generate', requireAuth, async (req, res, next) => {
  try {
    const { payment_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'payment_id est requis' });
    }

    const payment = await db('rent_payments')
      .where({ id: payment_id, org_id: req.orgId })
      .first();

    if (!payment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Paiement introuvable' });
    }

    if (payment.status !== 'paid') {
      return res.status(409).json({ error: 'PAYMENT_NOT_PAID', message: 'Impossible de générer une quittance pour un paiement non effectué' });
    }

    const receipt = await generateReceipt(payment_id, req.orgId);
    return res.status(201).json({ data: receipt });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/receipts/download/:paymentId — stream PDF on the fly
router.get('/download/:paymentId', requireAuth, async (req, res, next) => {
  try {
    await streamReceiptPdf(req.params.paymentId, req.orgId, res);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/receipts/:id — get receipt record
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const receipt = await db('receipts')
      .where({ id: req.params.id, org_id: req.orgId })
      .first();

    if (!receipt) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Quittance introuvable' });
    }

    return res.status(200).json({ data: receipt });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
