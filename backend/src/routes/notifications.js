const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/v1/notifications
router.get('/', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const orgId = req.orgId;

    const notifications = [];

    // Late payments (pending and due more than 3 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const latePayments = await db('rent_payments')
      .where({ 'rent_payments.org_id': orgId, 'rent_payments.status': 'pending' })
      .where('rent_payments.due_date', '<=', threeDaysAgo)
      .join('leases', 'rent_payments.lease_id', 'leases.id')
      .join('users', 'leases.tenant_id', 'users.id')
      .join('properties', 'leases.property_id', 'properties.id')
      .select(
        'rent_payments.id',
        'rent_payments.amount',
        'rent_payments.due_date',
        'users.full_name as tenant_name',
        'properties.address as property_address'
      );

    latePayments.forEach(p => {
      notifications.push({
        id: `late-${p.id}`,
        type: 'late_payment',
        title: 'Loyer en retard',
        message: `${p.tenant_name} — ${p.property_address}`,
        amount: p.amount,
        date: p.due_date,
        read: false,
      });
    });

    // New maintenance requests (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newMaintenance = await db('maintenance_requests')
      .where({ 'maintenance_requests.org_id': orgId, 'maintenance_requests.status': 'open' })
      .where('maintenance_requests.created_at', '>=', sevenDaysAgo)
      .join('users', 'maintenance_requests.tenant_id', 'users.id')
      .join('properties', 'maintenance_requests.property_id', 'properties.id')
      .select(
        'maintenance_requests.id',
        'maintenance_requests.title',
        'maintenance_requests.priority',
        'maintenance_requests.created_at',
        'users.full_name as tenant_name',
        'properties.address as property_address'
      );

    newMaintenance.forEach(m => {
      notifications.push({
        id: `maint-${m.id}`,
        type: 'maintenance',
        title: 'Nouvelle demande de maintenance',
        message: `${m.title} — ${m.tenant_name}`,
        priority: m.priority,
        date: m.created_at,
        read: false,
      });
    });

    // Sort by date descending
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      data: notifications,
      unread: notifications.filter(n => !n.read).length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
