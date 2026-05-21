const db = require('../config/db');
const { sendLateRentEmail } = require('./emailService');

/**
 * Check for late payments and send reminders
 * Should be called daily (e.g., via a cron job or scheduled check)
 */
const sendLateRentReminders = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find pending payments where due_date is more than 3 days ago
    const latePayments = await db('rent_payments')
      .where({ status: 'pending' })
      .where('due_date', '<=', threeDaysAgo)
      .join('leases', 'rent_payments.lease_id', 'leases.id')
      .join('properties', 'leases.property_id', 'properties.id')
      .join('users', 'leases.tenant_id', 'users.id')
      .select(
        'rent_payments.id as payment_id',
        'rent_payments.amount',
        'rent_payments.due_date',
        'rent_payments.org_id',
        'users.email as tenant_email',
        'users.full_name as tenant_name',
        'properties.address as property_address',
      );

    console.log(`Found ${latePayments.length} late payment(s) to remind`);

    for (const payment of latePayments) {
      await sendLateRentEmail({
        to: payment.tenant_email,
        full_name: payment.tenant_name,
        property_address: payment.property_address,
        amount: payment.amount,
        due_date: payment.due_date,
      });
      console.log(`Reminder sent to ${payment.tenant_email}`);
    }

    return latePayments.length;
  } catch (err) {
    console.error('Error sending reminders:', err.message);
    return 0;
  }
};

module.exports = { sendLateRentReminders };
