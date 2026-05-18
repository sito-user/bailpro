const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

/**
 * Generate a PDF receipt for a payment
 * @param {string} paymentId
 * @param {string} orgId
 * @returns {Promise<string>} path to the generated PDF
 */
const generateReceipt = async (paymentId, orgId) => {
  // Fetch payment with lease, property and tenant info
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

  if (!payment) {
    throw new Error('Payment not found');
  }

  // Ensure upload directory exists
  const uploadDir = path.join(__dirname, '../../uploads/receipts');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `quittance_${paymentId}.pdf`;
  const filepath = path.join(uploadDir, filename);

  // Generate PDF
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('QUITTANCE DE LOYER', { align: 'center' });

    doc.moveDown();
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Organisation : ${payment.org_name}`, { align: 'center' });

    doc.moveDown(2);

    // Divider
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
    if (payment.property_district) {
      doc.text(`Quartier : ${payment.property_district}`);
    }

    doc.moveDown();

    // Payment info
    doc.font('Helvetica-Bold').text('Paiement :');
    doc.font('Helvetica');
    doc.text(`Période : ${formatDate(payment.due_date)}`);
    doc.text(`Montant : ${formatAmount(payment.amount)} FCFA`);
    doc.text(`Date de paiement : ${formatDate(payment.paid_at)}`);
    doc.text(`Méthode : ${payment.payment_method || 'Mobile Money'}`);

    doc.moveDown(2);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Footer
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('gray')
      .text(
        `Quittance générée le ${new Date().toLocaleDateString('fr-FR')} par BailPro`,
        { align: 'center' }
      );

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Save receipt record in DB
  const [receipt] = await db('receipts')
    .insert({
      org_id: orgId,
      payment_id: paymentId,
      pdf_url: `/uploads/receipts/${filename}`,
      issued_at: new Date(),
    })
    .returning('*');

  return receipt;
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatAmount = (amount) => {
  return parseInt(amount, 10).toLocaleString('fr-FR');
};

module.exports = { generateReceipt };
