import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTenants } from '../api/users';
import { getLeases, getLeasePayments } from '../api/leases';
import { getMaintenance } from '../api/payments';
import { User, Home, CreditCard, Wrench, ArrowLeft } from 'lucide-react';
import './TenantProfile.css';

const TYPE_LABELS = {
  appartement: 'Appartement', villa: 'Villa', magasin: 'Magasin',
  bureau: 'Bureau', entrepot: 'Entrepôt', autre: 'Autre',
};

const STATUS_LABELS = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };
const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé', urgent: 'Urgent' };

export default function TenantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [leases, setLeases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Get tenant info
        const tenantsRes = await getTenants();
        const found = tenantsRes.data.data.find(t => t.id === id);
        if (!found) { setError('Locataire introuvable'); return; }
        setTenant(found);

        // Get leases for this tenant
        const leasesRes = await getLeases();
        const tenantLeases = leasesRes.data.data.filter(l => l.tenant_id === id);
        setLeases(tenantLeases);

        // Get payments for each lease
        const allPayments = [];
        for (const lease of tenantLeases) {
          const pRes = await getLeasePayments(lease.id);
          pRes.data.data.forEach(p => allPayments.push({
            ...p,
            property_address: lease.property_address,
          }));
        }
        setPayments(allPayments.sort((a, b) => new Date(b.due_date) - new Date(a.due_date)));

        // Get maintenance requests
        const maintRes = await getMaintenance();
        const tenantMaint = maintRes.data.data.filter(m => m.tenant_id === id);
        setMaintenance(tenantMaint);

      } catch {
        setError('Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  if (loading) return <div className="page-status">Chargement...</div>;
  if (error) return <div className="page-status page-status--error">{error}</div>;

  return (
    <div className="tenant-profile">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn--secondary btn--sm" onClick={() => navigate('/app/tenants')}>
            <ArrowLeft size={14} /> Retour
          </button>
          <div>
            <h1 className="page-title">{tenant?.full_name}</h1>
            <p className="page-subtitle">Profil locataire</p>
          </div>
        </div>
      </div>

      {/* Tenant info */}
      <div className="profile-card">
        <div className="profile-card__header">
          <User size={18} /><span>Informations personnelles</span>
        </div>
        <div className="profile-card__body">
          <div className="profile-grid">
            <div className="profile-item">
              <span className="profile-label">Nom complet</span>
              <span className="profile-value">{tenant?.full_name}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email</span>
              <span className="profile-value">{tenant?.email}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Téléphone</span>
              <span className="profile-value">{tenant?.phone || '—'}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Client depuis</span>
              <span className="profile-value">{tenant?.created_at ? formatDate(tenant.created_at) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leases */}
      <div className="profile-card">
        <div className="profile-card__header">
          <Home size={18} /><span>Logement(s) loué(s)</span>
        </div>
        <div className="profile-card__body">
          {leases.length === 0 ? (
            <p style={{ color: 'var(--color-gray-400)', fontSize: 14 }}>Aucun bail actif</p>
          ) : (
            leases.map(lease => (
              <div key={lease.id} className="lease-row">
                <div className="lease-row__info">
                  <span className="lease-row__address">{lease.property_address}</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {lease.property_type && (
                      <span className="badge badge--type">
                        {TYPE_LABELS[lease.property_type] || lease.property_type}
                      </span>
                    )}
                    {lease.property_district && (
                      <span className="badge" style={{ background: '#f4f4f5', color: '#71717a' }}>
                        {lease.property_district}
                      </span>
                    )}
                    <span className={`badge badge--${lease.status}`}>
                      {lease.status === 'active' ? 'Actif' : lease.status}
                    </span>
                  </div>
                </div>
                <div className="lease-row__details">
                  <div className="profile-item">
                    <span className="profile-label">Loyer mensuel</span>
                    <span className="profile-value" style={{ fontWeight: 700 }}>
                      {formatAmount(lease.monthly_rent)}
                    </span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Locataire depuis</span>
                    <span className="profile-value">{formatDate(lease.start_date)}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Caution</span>
                    <span className="profile-value">{formatAmount(lease.deposit_amount)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payments */}
      <div className="profile-card">
        <div className="profile-card__header">
          <CreditCard size={18} /><span>Historique des paiements ({payments.length})</span>
        </div>
        <div className="profile-card__body profile-card__body--no-padding">
          {payments.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--color-gray-400)', fontSize: 14 }}>Aucun paiement</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Logement</th><th>Période</th><th>Montant</th><th>Statut</th><th>Date paiement</th></tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>{p.property_address}</td>
                    <td>{formatDate(p.due_date)}</td>
                    <td className="td--amount">{formatAmount(p.amount)}</td>
                    <td>
                      <span className={`badge badge--${p.status === 'paid' ? 'available' : 'unpaid'}`}>
                        {p.status === 'paid' ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                    <td>{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Maintenance */}
      <div className="profile-card">
        <div className="profile-card__header">
          <Wrench size={18} /><span>Demandes de maintenance ({maintenance.length})</span>
        </div>
        <div className="profile-card__body profile-card__body--no-padding">
          {maintenance.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--color-gray-400)', fontSize: 14 }}>Aucune demande</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Titre</th><th>Priorité</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {maintenance.map(m => (
                  <tr key={m.id}>
                    <td>{m.title}</td>
                    <td>
                      <span className={`badge badge--priority-${m.priority}`}>
                        {PRIORITY_LABELS[m.priority]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge--status-${m.status}`}>
                        {STATUS_LABELS[m.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
