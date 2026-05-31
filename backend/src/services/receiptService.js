const PDFDocument = require('pdfkit');
const db = require('../config/db');

/**
 * Fetch payment data for a receipt
 */
const getPaymentData = async (paymentId, orgId) => {
  const payment = await db('rent_payments')
    .where({ 'rent_payments.id': paymentId, 'rent_payments.org_id': orgId })
    .join('leases', 'rent_payments.lease_id', 'leases.id')
    .join('properties', 'leases.property_id', 'properties.id')
    .join('users as tenants', 'leases.tenant_id', 'tenants.id')
    .join('organizations', 'rent_payments.org_id', 'organizations.id')
    .select(
      'rent_payments.id as payment_id',
      'rent_payments.amount',
      'rent_payments.due_date',
      'rent_payments.paid_at',
      'rent_payments.payment_method',
      'properties.address as property_address',
      'properties.district as property_district',
      'tenants.full_name as tenant_name',
      'tenants.email as tenant_email',
      'organizations.name as org_name'
    )
    .first();

  return payment;
};

/**
 * Build PDF buffer from payment data (no disk I/O)
 */
const buildPdfBuffer = (payment) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('QUITTANCE DE LOYER', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Organisation : ${payment.org_name}`, { align: 'center' });
    doc.moveDown(2);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Tenant info
    doc.font('Helvetica-Bold').text('Locataire :');
    doc.font('Helvetica').text(`Nom : ${payment.tenant_name}`);
    doc.text(`Email : ${payment.tenant_email}`);
    doc.moveDown();

    // Property info
    doc.font('Helvetica-Bold').text('Logement :');
    doc.font('Helvetica').text(`Adresse : ${payment.property_address}`);
    if (payment.property_district) doc.text(`Quartier : ${payment.property_district}`);
    doc.moveDown();

    // Payment info
    doc.font('Helvetica-Bold').text('Paiement :');
    doc.font('Helvetica');
    doc.text(`Période : ${formatDate(payment.due_date)}`);
    doc.text(`Montant : ${formatAmount(payment.amount)} FCFA`);
    doc.text(`Date de paiement : ${formatDate(payment.paid_at)}`);
    doc.text(`Méthode : ${payment.payment_method || 'Mobile Money'}`);
    doc.moveDown(2);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Footer
    doc.fontSize(10).font('Helvetica').fillColor('gray')
      .text(`Quittance générée le ${new Date().toLocaleDateString('fr-FR')} par BailPro`, { align: 'center' });

    doc.end();
  });
};

/**
 * Generate receipt record in DB and return receipt
 */
const generateReceipt = async (paymentId, orgId) => {
  const payment = await getPaymentData(paymentId, orgId);
  if (!payment) throw new Error('Payment not found');

  // Check if receipt already exists
  const existing = await db('receipts').where({ payment_id: paymentId, org_id: orgId }).first();
  if (existing) return existing;

  const [receipt] = await db('receipts').insert({
    org_id: orgId,
    payment_id: paymentId,
    pdf_url: `/api/v1/receipts/download/${paymentId}`,
    issued_at: new Date(),
  }).returning('*');

  return receipt;
};

/**
 * Stream PDF directly to response (no disk storage)
 */
const streamReceiptPdf = async (paymentId, orgId, res) => {
  const payment = await getPaymentData(paymentId, orgId);
  if (!payment) return null;

  const buffer = await buildPdfBuffer(payment);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="quittance_${paymentId}.pdf"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatAmount = (amount) => parseInt(amount, 10).toLocaleString('fr-FR');

module.exports = { generateReceipt, streamReceiptPdf };
