require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.seed = async function (knex) {
  await knex('maintenance_requests').del();
  await knex('receipts').del();
  await knex('rent_payments').del();
  await knex('leases').del();
  await knex('properties').del();
  await knex('users').del();
  await knex('organizations').del();

  const orgId = uuidv4();
  await knex('organizations').insert({ id: orgId, name: 'Agence Cocody Immo', slug: 'cocody-immo' });

  const adminHash = await bcrypt.hash('Demo1234!', 12);
  const adminId = uuidv4();
  await knex('users').insert({
    id: adminId, org_id: orgId, email: 'demo@gmail.com',
    password_hash: adminHash, full_name: 'Mme Konan', role: 'admin', phone: '+225 07 00 00 00',
  });

  const tenantHash = await bcrypt.hash('Locataire2026!', 12);
  const karimId = uuidv4();
  const aminataId = uuidv4();
  const souleymaneId = uuidv4();

  await knex('users').insert([
    { id: karimId, org_id: orgId, email: 'aidibiaya2006@gmail.com', password_hash: tenantHash, full_name: 'Karim Diallo', role: 'locataire', phone: '+225 05 11 22 33' },
    { id: aminataId, org_id: orgId, email: 'aidibiaya05@gmail.com', password_hash: tenantHash, full_name: 'Aminata Coulibaly', role: 'locataire', phone: '+225 07 44 55 66' },
    { id: souleymaneId, org_id: orgId, email: 'souleymane@gmail.com', password_hash: tenantHash, full_name: 'Souleymane Traore', role: 'locataire', phone: '+225 01 77 88 99' },
  ]);

  const prop1Id = uuidv4(); const prop2Id = uuidv4(); const prop3Id = uuidv4(); const prop4Id = uuidv4();
  await knex('properties').insert([
    { id: prop1Id, org_id: orgId, address: 'Rue des Jardins, Cocody Riviera 3', district: 'Cocody', surface_m2: 85, rent_amount: 250000, status: 'occupied' },
    { id: prop2Id, org_id: orgId, address: 'Avenue Chardy, Plateau, Immeuble Sococe', district: 'Plateau', surface_m2: 60, rent_amount: 180000, status: 'occupied' },
    { id: prop3Id, org_id: orgId, address: 'Cite Anador, Marcory Zone 4', district: 'Marcory', surface_m2: 70, rent_amount: 150000, status: 'occupied' },
    { id: prop4Id, org_id: orgId, address: 'II Plateaux Vallons, Rue K57', district: 'II Plateaux', surface_m2: 95, rent_amount: 320000, status: 'available' },
  ]);

  const lease1Id = uuidv4(); const lease2Id = uuidv4(); const lease3Id = uuidv4();
  await knex('leases').insert([
    { id: lease1Id, org_id: orgId, property_id: prop1Id, tenant_id: karimId, start_date: '2024-01-01', monthly_rent: 250000, deposit_amount: 500000, status: 'active' },
    { id: lease2Id, org_id: orgId, property_id: prop2Id, tenant_id: aminataId, start_date: '2024-03-01', monthly_rent: 180000, deposit_amount: 360000, status: 'active' },
    { id: lease3Id, org_id: orgId, property_id: prop3Id, tenant_id: souleymaneId, start_date: '2023-09-01', monthly_rent: 150000, deposit_amount: 300000, status: 'active' },
  ]);

  const pay1Id = uuidv4(); const pay2Id = uuidv4(); const pay3Id = uuidv4(); const pay4Id = uuidv4();
  await knex('rent_payments').insert([
    { id: pay1Id, org_id: orgId, lease_id: lease1Id, amount: 250000, due_date: '2024-04-01', paid_at: new Date('2024-04-02'), status: 'paid', payment_method: 'mobile_money_mock' },
    { id: pay2Id, org_id: orgId, lease_id: lease1Id, amount: 250000, due_date: '2024-05-01', paid_at: new Date('2024-05-03'), status: 'paid', payment_method: 'mobile_money_mock' },
    { id: pay3Id, org_id: orgId, lease_id: lease2Id, amount: 180000, due_date: '2024-04-01', paid_at: new Date('2024-04-01'), status: 'paid', payment_method: 'mobile_money_mock' },
    { id: pay4Id, org_id: orgId, lease_id: lease3Id, amount: 150000, due_date: '2024-05-01', paid_at: null, status: 'pending', payment_method: null },
  ]);

  await knex('receipts').insert([
    { id: uuidv4(), org_id: orgId, payment_id: pay1Id, pdf_url: '/uploads/receipts/demo_receipt_1.pdf', issued_at: new Date('2024-04-02') },
    { id: uuidv4(), org_id: orgId, payment_id: pay2Id, pdf_url: '/uploads/receipts/demo_receipt_2.pdf', issued_at: new Date('2024-05-03') },
    { id: uuidv4(), org_id: orgId, payment_id: pay3Id, pdf_url: '/uploads/receipts/demo_receipt_3.pdf', issued_at: new Date('2024-04-01') },
  ]);

  await knex('maintenance_requests').insert([
    { id: uuidv4(), org_id: orgId, property_id: prop1Id, tenant_id: karimId, title: 'Fuite eau salle de bain', description: 'La robinetterie du lavabo fuit depuis 3 jours.', priority: 'high', status: 'in_progress' },
    { id: uuidv4(), org_id: orgId, property_id: prop3Id, tenant_id: souleymaneId, title: 'Panne electricite cuisine', description: 'Les prises de la cuisine ne fonctionnent plus.', priority: 'urgent', status: 'open' },
    { id: uuidv4(), org_id: orgId, property_id: prop2Id, tenant_id: aminataId, title: 'Climatiseur en panne', description: 'Le climatiseur de la chambre principale ne refroidit plus.', priority: 'medium', status: 'resolved' },
  ]);

  console.log('Demo seed completed!');
  console.log('Admin: demo@gmail.com / Demo1234!');
  console.log('Locataire 1: aidibiaya2006@gmail.com / Locataire2026!');
  console.log('Locataire 2: aidibiaya05@gmail.com / Locataire2026!');
};
