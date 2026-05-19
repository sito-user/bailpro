import React from 'react';
import { useState, useEffect } from 'react';
import { getLeases, createLease } from '../api/leases';
import { getProperties } from '../api/properties';
import { createPayment } from '../api/payments';
import { Plus, FileText, CreditCard } from 'lucide-react';
import './LeasesPage.css';

const EMPTY_FORM = {
  property_id: '', tenant_email: '', tenant_full_name: '',
  start_date: '', monthly_rent: '', deposit_amount: '',
};

export default function LeasesPage() {
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [payingLease, setPayingLease] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getLeases(), getProperties()])
      .then(([lRes, pRes]) => {
        setLeases(lRes.data.data);
        setProperties(pRes.data.data.filter((p) => p.status === 'available'));
      })
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createLease({
        property_id: form.property_id,
        tenant_id: form.tenant_id,
        start_date: form.start_date,
        monthly_rent: parseFloat(form.monthly_rent),
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : 0,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

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
        <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nouveau bail
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h2 className="card__title">Créer un bail</h2>
          <form className="prop-form" onSubmit={handleSubmit}>
            {formError && <div className="auth-form__error">{formError}</div>}
            <div className="form-group">
              <label className="form-label">Logement disponible *</label>
              <select className="form-input"
                value={form.property_id}
                onChange={(e) => {
                  const p = properties.find((x) => x.id === e.target.value);
                  setForm({ ...form, property_id: e.target.value,
                    monthly_rent: p ? p.rent_amount : '' });
                }} required>
                <option value="">Sélectionner un logement</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address} {p.district ? `— ${p.district}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ID du locataire *</label>
              <input className="form-input" type="text"
                placeholder="UUID du locataire"
                value={form.tenant_id || ''}
                onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
                required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date de début *</label>
                <input className="form-input" type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required />
              </div>
              <div className="form-group">
                <label className="form-label">Loyer mensuel (FCFA) *</label>
                <input className="form-input" type="number"
                  value={form.monthly_rent}
                  onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })}
                  required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Caution (FCFA)</label>
              <input className="form-input" type="number"
                placeholder="0"
                value={form.deposit_amount}
                onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--secondary"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                Annuler
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Créer le bail'}
              </button>
            </div>
          </form>
        </div>
      )}

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
