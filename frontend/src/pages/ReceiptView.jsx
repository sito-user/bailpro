import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLeases, getLeasePayments } from '../api/leases';
import { useAuth } from '../hooks/useAuth';
import './ReceiptView.css';

export default function ReceiptView() {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const leasesRes = await getLeases();
        const myLeases = leasesRes.data.data.filter((l) => l.tenant_id === user?.id);
        for (const l of myLeases) {
          const pRes = await getLeasePayments(l.id);
          const found = pRes.data.data.find((p) => p.id === paymentId);
          if (found) {
            setPayment(found);
            setLease(l);
            break;
          }
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [paymentId]);

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');
  const receiptNumber = `BP-${paymentId?.slice(0, 8).toUpperCase()}`;

  if (loading) return <div className="page-status">Chargement...</div>;
  if (!payment) return <div className="page-status page-status--error">Reçu introuvable</div>;

  return (
    <div className="receipt-page">
      <div className="receipt-actions no-print">
        <button className="btn btn--secondary" onClick={() => navigate(-1)}>← Retour</button>
        <button className="btn btn--primary" onClick={() => window.print()}>Imprimer / Sauvegarder</button>
      </div>

      <div className="receipt-doc">
        <div className="receipt-header">
          <div className="receipt-logo">BailPro</div>
          <div className="receipt-title">
            <h1>QUITTANCE DE LOYER</h1>
            <span className="receipt-number">N° {receiptNumber}</span>
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-body">
          <div className="receipt-section">
            <h2>Locataire</h2>
            <p><strong>{user?.full_name}</strong></p>
            {user?.phone && <p>{user.phone}</p>}
          </div>

          <div className="receipt-section">
            <h2>Logement</h2>
            <p><strong>{lease?.property_address}</strong></p>
            {lease?.property_district && <p>Quartier : {lease.property_district}</p>}
          </div>

          <div className="receipt-section">
            <h2>Détails du paiement</h2>
            <table className="receipt-table">
              <tbody>
                <tr>
                  <td>Période</td>
                  <td><strong>{formatDate(payment.due_date)}</strong></td>
                </tr>
                <tr>
                  <td>Montant payé</td>
                  <td><strong>{formatAmount(payment.amount)}</strong></td>
                </tr>
                <tr>
                  <td>Date de paiement</td>
                  <td><strong>{payment.paid_at ? formatDate(payment.paid_at) : '-'}</strong></td>
                </tr>
                <tr>
                  <td>Mode de paiement</td>
                  <td><strong>Mobile Money</strong></td>
                </tr>
                <tr>
                  <td>Statut</td>
                  <td><strong style={{ color: '#16a34a' }}>✓ Payé</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-footer">
          <p>Quittance générée le {formatDate(new Date())} par BailPro</p>
          <p>Ce document atteste du paiement du loyer pour la période indiquée.</p>
        </div>
      </div>
    </div>
  );
}
