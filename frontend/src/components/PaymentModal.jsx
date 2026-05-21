import React, { useState } from 'react';
import { createPayment } from '../api/payments';
import './PaymentModal.css';

const PAYMENT_METHODS = [
  { id: 'wave', label: 'Wave', icon: '🌊', color: '#1B73E8', desc: 'Paiement via Wave' },
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', color: '#FF6600', desc: 'Paiement via Orange Money' },
  { id: 'mtn_money', label: 'MTN Money', icon: '🟡', color: '#FFCC00', desc: 'Paiement via MTN Money' },
  { id: 'cash', label: 'Espèces', icon: '💵', color: '#16a34a', desc: 'Paiement en espèces' },
  { id: 'card', label: 'Carte bancaire', icon: '💳', color: '#6366f1', desc: 'Paiement par carte' },
];

export default function PaymentModal({ lease, onClose, onSuccess }) {
  const [selected, setSelected] = useState('');
  const [step, setStep] = useState(1); // 1: select method, 2: confirm, 3: processing, 4: success
  const [paying, setPaying] = useState(false);

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === selected);

  const handlePay = async () => {
    if (!selected) return;
    setStep(3);
    setPaying(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const today = new Date().toISOString().split('T')[0];
      await createPayment({
        lease_id: lease.id,
        amount: lease.monthly_rent,
        due_date: today,
        payment_method: selected,
      });
      setStep(4);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du paiement');
      setStep(2);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Step 1 - Select method */}
        {step === 1 && (
          <>
            <div className="modal__header">
              <h2>Choisir un mode de paiement</h2>
              <button className="modal__close" onClick={onClose}>✕</button>
            </div>
            <div className="modal__body">
              <div className="payment-amount">
                <span className="payment-amount__label">Montant à payer</span>
                <span className="payment-amount__value">{formatAmount(lease.monthly_rent)}</span>
              </div>
              <div className="payment-methods">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    className={`payment-method ${selected === method.id ? 'payment-method--selected' : ''}`}
                    onClick={() => setSelected(method.id)}
                  >
                    <span className="payment-method__icon">{method.icon}</span>
                    <div className="payment-method__info">
                      <span className="payment-method__name">{method.label}</span>
                      <span className="payment-method__desc">{method.desc}</span>
                    </div>
                    {selected === method.id && <span className="payment-method__check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={onClose}>Annuler</button>
              <button className="btn btn--primary" onClick={() => setStep(2)} disabled={!selected}>
                Continuer
              </button>
            </div>
          </>
        )}

        {/* Step 2 - Confirm */}
        {step === 2 && (
          <>
            <div className="modal__header">
              <h2>Confirmer le paiement</h2>
              <button className="modal__close" onClick={onClose}>✕</button>
            </div>
            <div className="modal__body">
              <div className="confirm-summary">
                <div className="confirm-row">
                  <span>Logement</span>
                  <strong>{lease.property_address}</strong>
                </div>
                <div className="confirm-row">
                  <span>Montant</span>
                  <strong>{formatAmount(lease.monthly_rent)}</strong>
                </div>
                <div className="confirm-row">
                  <span>Mode de paiement</span>
                  <strong>{selectedMethod?.icon} {selectedMethod?.label}</strong>
                </div>
              </div>
              <p className="confirm-note">
                ⚠️ Simulation uniquement — aucun vrai paiement ne sera effectué
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setStep(1)}>Retour</button>
              <button className="btn btn--primary" onClick={handlePay}>
                Confirmer le paiement
              </button>
            </div>
          </>
        )}

        {/* Step 3 - Processing */}
        {step === 3 && (
          <div className="modal__body modal__body--center">
            <div className="processing-icon">{selectedMethod?.icon}</div>
            <h2>Traitement en cours...</h2>
            <p>Connexion à {selectedMethod?.label}</p>
            <div className="processing-bar">
              <div className="processing-bar__fill"></div>
            </div>
          </div>
        )}

        {/* Step 4 - Success */}
        {step === 4 && (
          <div className="modal__body modal__body--center">
            <div className="success-icon">✅</div>
            <h2>Paiement réussi !</h2>
            <p>Votre loyer de <strong>{formatAmount(lease.monthly_rent)}</strong> a été payé via {selectedMethod?.label}.</p>
            <p className="success-note">Votre quittance a été générée automatiquement.</p>
            <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => { onSuccess(); onClose(); }}>
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
