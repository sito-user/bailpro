import React from 'react';
import { useState, useEffect } from 'react';
import { getLeases } from '../api/leases';
import { createPayment } from '../api/payments';
import { FileText, CreditCard } from 'lucide-react';
import './LeasesPage.css';

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingLease, setPayingLease] = useState(null);

  const load = () => {
    setLoading(true);
    getLeases()
      .then((res) => setLeases(res.data.data))
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (lease) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await createPayment({
        lease_id: lease.id,
        amount: lease.monthly_rent,
        due_date: today,
        payment_method: 'mobile_money_mock',
      });
      alert('Paiement enregistré ! Quittance générée.');
      setPayingLease(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du paiement');
    }
  };

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  return (
    <div className="leases-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Baux</h1>
          <p className="page-subtitle">{leases.length} bail(s) actif(s)</p>
        </div>
      </div>

      {loading ? (
        <div className="page-status">Chargement...</div>
      ) : error ? (
        <div className="page-status page-status--error">{error}</div>
      ) : leases.length === 0 ? (
        <div className="empty-state">
          <FileText size={32} color="var(--color-gray-300)" />
          <p>Aucun bail enregistré</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Logement</th>
                <th>Locataire</th>
                <th>Loyer</th>
                <th>Début</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((l) => (
                <tr key={l.id}>
                  <td className="td--address">{l.property_address}</td>
                  <td>{l.tenant_name}</td>
                  <td className="td--amount">{formatAmount(l.monthly_rent)}</td>
                  <td>{new Date(l.start_date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`badge badge--lease-${l.status}`}>
                      {l.status === 'active' ? 'Actif'
                        : l.status === 'terminated' ? 'Résilié' : 'En attente'}
                    </span>
                  </td>
                  <td>
                    {l.status === 'active' && (
                      <button className="btn btn--secondary btn--sm"
                        onClick={() => handlePay(l)}>
                        <CreditCard size={13} /> Payer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
