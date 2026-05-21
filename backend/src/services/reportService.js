const db = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send monthly report to all admin users
 */
const sendMonthlyReport = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;

  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthName = lastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Get all organizations
    const orgs = await db('organizations').select('*');

    for (const org of orgs) {
      // Get admin user
      const admin = await db('users').where({ org_id: org.id, role: 'admin' }).first();
      if (!admin) continue;

      // Get stats for last month
      const [{ total_properties }] = await db('properties').where({ org_id: org.id }).count('id as total_properties');
      const [{ occupied }] = await db('properties').where({ org_id: org.id, status: 'occupied' }).count('id as occupied');
      const payments = await db('rent_payments')
        .where({ org_id: org.id })
        .whereBetween('due_date', [lastMonth, lastMonthEnd]);

      const paid = payments.filter(p => p.status === 'paid');
      const pending = payments.filter(p => p.status === 'pending');
      const totalRevenue = paid.reduce((s, p) => s + parseFloat(p.amount), 0);
      const totalPending = pending.reduce((s, p) => s + parseFloat(p.amount), 0);

      const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
      const occupancyRate = total_properties > 0 ? Math.round((occupied / total_properties) * 100) : 0;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0a0a0a; padding: 24px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">BailPro</h1>
            <p style="color: #71717a; margin: 8px 0 0;">Rapport mensuel — ${monthName}</p>
          </div>
          <div style="padding: 32px; background: #ffffff; border: 1px solid #e4e4e7;">
            <h2 style="color: #0a0a0a;">Bonjour ${admin.full_name},</h2>
            <p style="color: #52525b;">Voici le résumé de votre activité pour <strong>${monthName}</strong> :</p>

            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
              <tr style="background: #f4f4f5;">
                <td style="padding: 14px 16px; font-weight: bold; color: #0a0a0a;">Logements total</td>
                <td style="padding: 14px 16px; text-align: right; font-weight: bold;">${total_properties}</td>
              </tr>
              <tr>
                <td style="padding: 14px 16px; color: #52525b;">Taux d'occupation</td>
                <td style="padding: 14px 16px; text-align: right; font-weight: bold; color: #16a34a;">${occupancyRate}%</td>
              </tr>
              <tr style="background: #f4f4f5;">
                <td style="padding: 14px 16px; color: #52525b;">Loyers encaissés</td>
                <td style="padding: 14px 16px; text-align: right; font-weight: bold; color: #16a34a;">${formatAmount(totalRevenue)}</td>
              </tr>
              <tr>
                <td style="padding: 14px 16px; color: #52525b;">Loyers impayés</td>
                <td style="padding: 14px 16px; text-align: right; font-weight: bold; color: #dc2626;">${formatAmount(totalPending)}</td>
              </tr>
              <tr style="background: #f4f4f5;">
                <td style="padding: 14px 16px; color: #52525b;">Paiements reçus</td>
                <td style="padding: 14px 16px; text-align: right; font-weight: bold;">${paid.length}</td>
              </tr>
              <tr>
                <td style="padding: 14px 16px; color: #52525b;">Paiements en retard</td>
                <td style="padding: 14px 16px; text-align: right; font-weight: bold; color: #f59e0b;">${pending.length}</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 24px 0;">
              <a href="https://bailpro-frontend.onrender.com"
                 style="background: #0a0a0a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Voir le tableau de bord
              </a>
            </div>
          </div>
          <div style="padding: 16px; text-align: center; color: #a1a1aa; font-size: 12px;">
            BailPro — Gestion locative simplifiée pour Abidjan
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"BailPro" <${process.env.EMAIL_USER}>`,
        to: admin.email,
        subject: `📊 Rapport mensuel BailPro — ${monthName}`,
        html,
      });

      console.log(`Monthly report sent to ${admin.email}`);
    }
  } catch (err) {
    console.error('Error sending monthly report:', err.message);
  }
};

module.exports = { sendMonthlyReport };
