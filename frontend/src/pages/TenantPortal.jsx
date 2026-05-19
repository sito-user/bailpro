import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getLeases, getLeasePayments } from '../api/leases';
import { createPayment, createMaintenance } from '../api/payments';
import {
  Home, CreditCard, FileText, Wrench,
  CheckCircle, AlertCircle, Plus
} from 'lucide-react';
import './TenantPortal.css';

export default function TenantPortal() {
  const { user } = useAuth();
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintForm, setMaintForm] = useState({ title: '', description: '', priority: 'medium' });
  const [maintSaving, setMaintSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const leasesRes = await getLeases();
      const myLease = leasesRes.data.data.find(
        (l) => l.tenant_id === user?.id && l.status === 'active'
      );
      if (myLease) {
        setLease(myLease);
        const paymentsRes = await getLeasePayments(myLease.id);
        setPayments(paymentsRes.data.data);
      }
    } catch {
      setError('Impossible de charger vos données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePay = async () => {
    if (!lease) return;
    setPaying(true);
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
      setPaying(false);
    }
  };

  const handleMaintenance = async (e) => {
    e.preventDefault();
    if (!lease) return;
    setMaintSaving(true);
    try {
      await createMaintenance({
        property_id: lease.property_id,
        ...maintForm,
      });
      setMaintForm({ title: '', description: '', priority: 'medium' });
      setShowMaintenance(false);
      alert('Demande envoyee au bailleur !');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l envoi');
    } finally {
      setMaintSaving(false);
    }
  };

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');
  const lastPayment = payments[0];
  const isPaid = lastPayment?.status === 'paid';

  if (loading) return <div className="page-status">Chargement...</div>;
  if (error) return <div className="page-status page-status--error">{error}</div>;

  return (
    <div className="tenant-portal">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bonjour, {user?.full_name}</h1>
          <p className="page-subtitle">Votre espace locataire</p>
        </div>
      </div>

      {!lease ? (
        <div className="empty-state">
          <Home size={32} color="var(--color-gray-300)" />
          <p>Aucun bail actif trouve</p>
        </div>
      ) : (
        <>
          <div className="tenant-card">
            <div className="tenant-card__header">
              <Home size={18} /><span>Mon logement</span>
            </div>
            <div className="tenant-card__body">
              <div className="tenant-info-grid">
                <div className="tenant-info-item">
                  <span className="tenant-info-label">Adresse</span>
                  <span className="tenant-info-value">{lease.property_address}</span>
                </div>
                {lease.property_district && (
                  <div className="tenant-info-item">
                    <span className="tenant-info-label">Quartier</span>
                    <span className="tenant-info-value">{lease.property_district}</span>
                  </div>
                )}
                <div className="tenant-info-item">
                  <span className="tenant-info-label">Loyer mensuel</span>
                  <span className="tenant-info-value tenant-info-value--amount">
                    {formatAmount(lease.monthly_rent)}
                  </span>
                </div>
                <div className="tenant-info-item">
                  <span className="tenant-info-label">Debut du bail</span>
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
                  <button className="btn btn--primary" onClick={handlePay} disabled={paying}>
                    <CreditCard size={14} />
                    {paying ? 'Traitement...' : 'Payer via Mobile Money'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="tenant-card">
            <div className="tenant-card__header">
              <FileText size={18} /><span>Historique des paiements</span>
            </div>
            <div className="tenant-card__body tenant-card__body--no-padding">
              {payments.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <p>Aucun paiement enregistre</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Periode</th><th>Montant</th><th>Statut</th><th>Date paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{formatDate(p.due_date)}</td>
                        <td className="td--amount">{formatAmount(p.amount)}</td>
                        <td>
                          <span className={`badge badge--${p.status === 'paid' ? 'available' : 'unpaid'}`}>
                            {p.status === 'paid' ? 'Paye' : p.status === 'pending' ? 'En attente' : 'Retard'}
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

          <div className="tenant-card">
            <div className="tenant-card__header">
              <Wrench size={18} /><span>Signaler un probleme</span>
              <button className="btn btn--secondary btn--sm" style={{ marginLeft: 'auto' }}
                onClick={() => setShowMaintenance(!showMaintenance)}>
                <Plus size={14} /> Signaler
              </button>
            </div>
            {showMaintenance && (
              <div className="tenant-card__body">
                <form className="prop-form" onSubmit={handleMaintenance}>
                  <div className="form-group">
                    <label className="form-label">Titre *</label>
                    <input className="form-input" type="text"
                      placeholder="Ex: Fuite d eau salle de bain"
                      value={maintForm.title}
                      onChange={(e) => setMaintForm({ ...maintForm, title: e.target.value })}
                      required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input form-textarea"
                      placeholder="Decrivez le probleme..."
                      value={maintForm.description}
                      onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priorite</label>
                    <select className="form-input"
                      value={maintForm.priority}
                      onChange={(e) => setMaintForm({ ...maintForm, priority: e.target.value })}>
                      <option value="low">Faible</option>
                      <option value="medium">Moyen</option>
                      <option value="high">Eleve</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn--secondary"
                      onClick={() => setShowMaintenance(false)}>Annuler</button>
                    <button type="submit" className="btn btn--primary" disabled={maintSaving}>
                      {maintSaving ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
