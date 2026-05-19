import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getLeases, getLeasePayments } from '../api/leases';
import { createPayment } from '../api/payments';
import { Home, CreditCard, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import './TenantPortal.css';

export default function TenantPortal() {
  const { user } = useAuth();
  const [leases, setLeases] = useState([]);
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const leasesRes = await getLeases();
      const myLeases = leasesRes.data.data.filter(
        (l) => l.tenant_id === user?.id && l.status === 'active'
      );
      setLeases(myLeases);
      const paymentsMap = {};
      for (const lease of myLeases) {
        const pRes = await getLeasePayments(lease.id);
        paymentsMap[lease.id] = pRes.data.data;
      }
      setPayments(paymentsMap);
    } catch {
      setError('Impossible de charger vos données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (lease) => {
    setPaying(lease.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      await createPayment({
        lease_id: lease.id,
        amount: lease.monthly_rent,
        due_date: today,
        payment_method: 'mobile_money_mock',
      });
      alert('Paiement effectue ! Votre quittance a ete generee.');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setPaying(null);
    }
  };

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  if (loading) return <div className="page-status">Chargement...</div>;
  if (error) return <div className="page-status page-status--error">{error}</div>;

  return (
    <div className="tenant-portal">
      <div className="page-header">
        <h1 className="page-title">Bonjour, {user?.full_name}</h1>
        <p className="page-subtitle">Votre espace locataire</p>
      </div>

      {leases.length === 0 ? (
        <div className="empty-state">
          <Home size={32} color="var(--color-gray-300)" />
          <p>Aucun bail actif trouve</p>
        </div>
      ) : (
        leases.map((lease) => {
          const leasePayments = payments[lease.id] || [];
          const lastPayment = leasePayments[0];
          const isPaid = lastPayment?.status === 'paid';
          return (
            <div key={lease.id}>
              <div className="tenant-card">
                <div className="tenant-card__header">
                  <Home size={18} /><span>Logement — {lease.property_address}</span>
                </div>
                <div className="tenant-card__body">
                  <div className="tenant-info-grid">
                    {lease.property_district && (
                      <div className="tenant-info-item">
                        <span className="tenant-info-label">Quartier</span>
                        <span className="tenant-info-value">{lease.property_district}</span>
                      </div>
                    )}
                    <div className="tenant-info-item">
                      <span className="tenant-info-label">Loyer mensuel</span>
                      <span className="tenant-info-value tenant-info-value--amount">{formatAmount(lease.monthly_rent)}</span>
                    </div>
                    <div className="tenant-info-item">
                      <span className="tenant-info-label">Locataire depuis le</span>
                      <span className="tenant-info-value">{formatDate(lease.start_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`tenant-card tenant-card--${isPaid ? 'paid' : 'pending'}`}>
                <div className="tenant-card__header">
                  <CreditCard size={18} /><span>Loyer du mois</span>
                </div>
                <div className="tenant-card__body">
                  <div className="payment-status">
                    <div className="payment-status__info">
                      <span className="payment-status__amount">{formatAmount(lease.monthly_rent)}</span>
                      <span className={`badge badge--${isPaid ? 'available' : 'unpaid'}`}>
                        {isPaid ? 'Paye' : 'En attente'}
                      </span>
                    </div>
                    {!isPaid && (
                      <button className="btn btn--primary" onClick={() => handlePay(lease)} disabled={paying === lease.id}>
                        <CreditCard size={14} />
                        {paying === lease.id ? 'Traitement...' : 'Payer via Mobile Money'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="tenant-card">
                <div className="tenant-card__header">
                  <FileText size={18} /><span>Derniers paiements</span>
                </div>
                <div className="tenant-card__body tenant-card__body--no-padding">
                  {leasePayments.length === 0 ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <p>Aucun paiement enregistre</p>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr><th>Periode</th><th>Montant</th><th>Statut</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {leasePayments.slice(0, 3).map((p) => (
                          <tr key={p.id}>
                            <td>{formatDate(p.due_date)}</td>
                            <td className="td--amount">{formatAmount(p.amount)}</td>
                            <td>
                              <span className={`badge badge--${p.status === 'paid' ? 'available' : 'unpaid'}`}>
                                {p.status === 'paid' ? 'Paye' : 'En attente'}
                              </span>
                            </td>
                            <td>{p.paid_at ? formatDate(p.paid_at) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
