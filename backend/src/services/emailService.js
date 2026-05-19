const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async ({ to, full_name, role, org_name }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;

  const isLocataire = role === 'locataire';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center;">
        <h1 style="color: white; font-size: 28px; margin: 0;">BailPro</h1>
      </div>
      <div style="padding: 32px; background: #ffffff; border: 1px solid #e4e4e7;">
        <h2 style="color: #0a0a0a;">Bienvenue sur BailPro, ${full_name} !</h2>
        <p style="color: #52525b; line-height: 1.6;">
          ${isLocataire
            ? `Votre bailleur vous a créé un compte locataire sur BailPro pour gérer votre bail avec <strong>${org_name}</strong>.`
            : `Votre espace de gestion locative <strong>${org_name}</strong> a été créé avec succès.`
          }
        </p>
        <p style="color: #52525b; line-height: 1.6;">
          Vous pouvez maintenant vous connecter sur :
          <a href="https://bailpro-frontend.onrender.com" style="color: #0a0a0a; font-weight: bold;">
            bailpro-frontend.onrender.com
          </a>
        </p>
        ${isLocataire ? `
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; color: #52525b; font-size: 14px;">
            Connectez-vous via <strong>Espace Locataire</strong> avec votre email et mot de passe.
          </p>
        </div>
        ` : ''}
      </div>
      <div style="padding: 16px; text-align: center; color: #a1a1aa; font-size: 12px;">
        BailPro — Gestion locative simplifiée pour Abidjan
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"BailPro" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Bienvenue sur BailPro${org_name ? ` — ${org_name}` : ''}`,
    html,
  });
};

/**
 * Send late rent notification
 */
const sendLateRentEmail = async ({ to, full_name, property_address, amount, due_date }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center;">
        <h1 style="color: white; font-size: 28px; margin: 0;">BailPro</h1>
      </div>
      <div style="padding: 32px; background: #ffffff; border: 1px solid #e4e4e7;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #dc2626; margin: 0 0 8px 0;">⚠ Rappel de loyer</h2>
          <p style="color: #dc2626; margin: 0; font-size: 14px;">Votre loyer est en retard</p>
        </div>
        <p style="color: #52525b;">Bonjour <strong>${full_name}</strong>,</p>
        <p style="color: #52525b; line-height: 1.6;">
          Nous vous rappelons que votre loyer pour le logement suivant est en retard :
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="border-bottom: 1px solid #e4e4e7;">
            <td style="padding: 12px 0; color: #71717a;">Logement</td>
            <td style="padding: 12px 0; font-weight: bold; color: #0a0a0a;">${property_address}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e4e4e7;">
            <td style="padding: 12px 0; color: #71717a;">Montant dû</td>
            <td style="padding: 12px 0; font-weight: bold; color: #dc2626;">${formatAmount(amount)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #71717a;">Date d'échéance</td>
            <td style="padding: 12px 0; font-weight: bold; color: #0a0a0a;">${formatDate(due_date)}</td>
          </tr>
        </table>
        <p style="color: #52525b; line-height: 1.6;">
          Veuillez régulariser votre situation en vous connectant sur BailPro.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://bailpro-frontend.onrender.com"
             style="background: #0a0a0a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Payer maintenant
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
    to,
    subject: `⚠ Rappel : Loyer en retard — ${formatAmount(amount)}`,
    html,
  });
};

module.exports = { sendWelcomeEmail, sendLateRentEmail };
