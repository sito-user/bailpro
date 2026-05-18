const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/dashboard/overview
router.get('/overview', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const orgId = req.orgId;

    // Total properties
    const [{ total_properties }] = await db('properties')
      .where({ org_id: orgId })
      .count('id as total_properties');

    // Occupied properties
    const [{ occupied_properties }] = await db('properties')
      .where({ org_id: orgId, status: 'occupied' })
      .count('id as occupied_properties');

    // Pending payments (current month, not paid)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [{ pending_payments }] = await db('rent_payments')
      .where({ org_id: orgId, status: 'pending' })
      .whereBetween('due_date', [firstDay, lastDay])
      .count('id as pending_payments');

    // Monthly revenue (current month, paid)
    const [{ monthly_revenue }] = await db('rent_payments')
      .where({ org_id: orgId, status: 'paid' })
      .whereBetween('paid_at', [firstDay, lastDay])
      .sum('amount as monthly_revenue');

    // Open maintenance requests
    const [{ open_maintenance }] = await db('maintenance_requests')
      .where({ org_id: orgId, status: 'open' })
      .count('id as open_maintenance');

    return res.status(200).json({
      data: {
        total_properties: parseInt(total_properties, 10),
        occupied_properties: parseInt(occupied_properties, 10),
        pending_payments: parseInt(pending_payments, 10),
        monthly_revenue: parseFloat(monthly_revenue) || 0,
        open_maintenance: parseInt(open_maintenance, 10),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
