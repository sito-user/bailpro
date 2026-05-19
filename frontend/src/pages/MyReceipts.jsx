import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getLeases, getLeasePayments } from '../api/leases';
import { Receipt, Download } from 'lucide-react';
import './MyReceipts.css';

export default function MyReceipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const leasesRes = await getLeases();
        const myLeases = leasesRes.data.data.filter(
          (l) => l.tenant_id === user?.id
        );
        const allPayments = [];
        for (const lease of myLeases) {
          const pRes = await getLeasePayments(lease.id);
          const paid = pRes.data.data.filter((p) => p.status === 'paid');
          paid.forEach((p) => allPayments.push({ ...p, property_address: lease.property_address }));
        }
        setReceipts(allPayments);
      } catch {
        setError('Impossible de charger vos quittances');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  if (loading) return <div className="page-status">Chargement...</div>;
  if (error) return <div className="page-status page-status--error">{error}</div>;

  return (
    <div className="my-receipts">
      <div className="page-header">
        <h1 className="page-title">Mes quittances</h1>
        <p className="page-subtitle">{receipts.length} quittance(s) disponible(s)</p>
      </div>

      {receipts.length === 0 ? (
        <div className="empty-state">
          <Receipt size={32} color="var(--color-gray-300)" />
          <p>Aucune quittance disponible</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Logement</th>
                <th>Periode</th>
                <th>Montant</th>
                <th>Date paiement</th>
                <th>Quittance</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((p) => (
                <tr key={p.id}>
                  <td className="td--address">{p.property_address}</td>
                  <td>{formatDate(p.due_date)}</td>
                  <td className="td--amount">{formatAmount(p.amount)}</td>
                  <td>{p.paid_at ? formatDate(p.paid_at) : '-'}</td>
                  <td>
                    <span className="badge badge--available">Disponible</span>
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
