const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/v1/ai/chat
router.post('/chat', requireAuth, requireRole('admin', 'gestionnaire'), async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Message requis' });
    }

    const orgId = req.orgId;

    // Fetch org data for context
    const [properties, leases, payments, maintenance, org] = await Promise.all([
      db('properties').where({ org_id: orgId }),
      db('leases').where({ 'leases.org_id': orgId })
        .join('properties', 'leases.property_id', 'properties.id')
        .join('users', 'leases.tenant_id', 'users.id')
        .select('leases.*', 'properties.address as property_address', 'users.full_name as tenant_name', 'users.email as tenant_email'),
      db('rent_payments').where({ org_id: orgId }).orderBy('due_date', 'desc').limit(20),
      db('maintenance_requests').where({ org_id: orgId }).orderBy('created_at', 'desc').limit(10),
      db('organizations').where({ id: orgId }).first(),
    ]);

    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const occupiedProperties = properties.filter(p => p.status === 'occupied');
    const openMaintenance = maintenance.filter(m => m.status === 'open' || m.status === 'in_progress');

    const context = `
Tu es Wari, l'assistant immobilier intelligent de BailPro pour ${org?.name || 'une agence'} à Abidjan, Côte d'Ivoire.
Tu as une personnalité chaleureuse, amicale et professionnelle à la fois. Tu tutoies le bailleur avec respect, tu utilises parfois des expressions encourageantes ("Bonne nouvelle !", "Attention,", "Super !").
Tu vas droit au but, tu es concis, et tu termines toujours par une suggestion concrète ou une action à faire si c'est pertinent.
Si tout va bien, dis-le avec enthousiasme. Si il y a un problème (impayé, maintenance urgente), sois direct mais rassurant.
Réponds toujours en français.

DONNÉES ACTUELLES DE L'ORGANISATION :

LOGEMENTS (${properties.length} au total) :
${properties.map(p => `- ${p.address} (${p.district || 'N/A'}) : ${parseInt(p.rent_amount).toLocaleString('fr-FR')} FCFA/mois — Statut: ${p.status === 'occupied' ? 'Occupé' : p.status === 'available' ? 'Disponible' : 'Maintenance'}`).join('\n')}

BAUX ACTIFS (${leases.filter(l => l.status === 'active').length}) :
${leases.filter(l => l.status === 'active').map(l => `- ${l.tenant_name} (${l.tenant_email}) loue ${l.property_address} à ${parseInt(l.monthly_rent).toLocaleString('fr-FR')} FCFA/mois depuis ${new Date(l.start_date).toLocaleDateString('fr-FR')}`).join('\n')}

PAIEMENTS RÉCENTS :
- Total encaissé : ${totalRevenue.toLocaleString('fr-FR')} FCFA
- Impayés en cours : ${pendingPayments.length} (${pendingPayments.map(p => parseInt(p.amount).toLocaleString('fr-FR') + ' FCFA').join(', ')})
- Logements occupés : ${occupiedProperties.length}/${properties.length}

DEMANDES DE MAINTENANCE EN COURS (${openMaintenance.length}) :
${openMaintenance.map(m => `- ${m.title} — Priorité: ${m.priority} — Statut: ${m.status}`).join('\n') || 'Aucune demande en cours'}
    `.trim();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system: context,
      messages: [{ role: 'user', content: message }],
    });

    const reply = response.content[0]?.text || 'Désolé, je n\'ai pas pu générer une réponse.';

    return res.status(200).json({ reply });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
