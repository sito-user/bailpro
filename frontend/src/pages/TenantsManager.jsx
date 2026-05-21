import React, { useState, useEffect } from 'react';
import { getTenants, createTenant, deleteTenant } from '../api/users';
import { getProperties } from '../api/properties';
import { Plus, Trash2, Users, Copy, Check } from 'lucide-react';
import './TenantsManager.css';

const EMPTY_FORM = { full_name: '', email: '', phone: '', password: '', property_id: '', start_date: '', monthly_rent: '', deposit_amount: '' };

export default function TenantsManager() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [newCredentials, setNewCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getTenants(), getProperties()])
      .then(([tRes, pRes]) => {
        setTenants(tRes.data.data);
        setProperties(pRes.data.data.filter(p => p.status === 'available'));
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
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password || undefined,
      };
      if (form.property_id) {
        payload.property_id = form.property_id;
        payload.start_date = form.start_date || new Date().toISOString().split('T')[0];
        if (form.monthly_rent) payload.monthly_rent = parseFloat(form.monthly_rent);
        if (form.deposit_amount) payload.deposit_amount = parseFloat(form.deposit_amount);
      }
      const res = await createTenant(payload);
      setNewCredentials({ email: form.email, password: res.data.temp_password });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce locataire ?')) return;
    try { await deleteTenant(id); load(); }
    catch { alert('Impossible de supprimer ce locataire'); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Email: ${newCredentials.email}\nMot de passe: ${newCredentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedProperty = properties.find(p => p.id === form.property_id);

  return (
    <div className="tenants-manager">
      <div className="page-header">
        <div>
          <h1 className="page-title">Locataires</h1>
          <p className="page-subtitle">{tenants.length} locataire(s) enregistré(s)</p>
        </div>
        <button className="btn btn--primary" onClick={() => { setShowForm(!showForm); setNewCredentials(null); }}>
          <Plus size={16} /> Ajouter un locataire
        </button>
      </div>

      {newCredentials && (
        <div className="credentials-card">
          <div className="credentials-card__header">
            <span>✅ Locataire créé avec succès !</span>
            <button className="icon-btn" onClick={() => setNewCredentials(null)}>✕</button>
          </div>
          <p className="credentials-card__desc">Partagez ces identifiants. Un email a également été envoyé.</p>
          <div className="credentials-card__info">
            <div className="credential-row">
              <span className="credential-label">Email</span>
              <span className="credential-value">{newCredentials.email}</span>
            </div>
            <div className="credential-row">
              <span className="credential-label">Mot de passe</span>
              <span className="credential-value">{newCredentials.password}</span>
            </div>
          </div>
          <button className="btn btn--secondary btn--sm" onClick={handleCopy}>
            {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier les identifiants</>}
          </button>
        </div>
      )}

      {showForm && (
        <div className="card form-card">
          <h2 className="card__title">Nouveau locataire</h2>
          <form className="prop-form" onSubmit={handleSubmit}>
            {formError && <div className="auth-form__error">{formError}</div>}

            <div className="form-section-title">Informations personnelles</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input className="form-input" type="text" placeholder="Ex: Karim Diallo"
                  value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="karim@gmail.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" type="text" placeholder="+225 07 00 00 00"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe (optionnel)</label>
                <input className="form-input" type="text" placeholder="Laissez vide pour générer automatiquement"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            <div className="form-section-title">Attribution d'un logement (optionnel)</div>
            <div className="form-group">
              <label className="form-label">Logement disponible</label>
              <select className="form-input" value={form.property_id}
                onChange={(e) => {
                  const p = properties.find(x => x.id === e.target.value);
                  setForm({ ...form, property_id: e.target.value, monthly_rent: p ? p.rent_amount : '' });
                }}>
                <option value="">Aucun logement pour l'instant</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.address} {p.district ? `— ${p.district}` : ''}</option>
                ))}
              </select>
            </div>

            {form.property_id && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date de début *</label>
                  <input className="form-input" type="date"
                    value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Loyer mensuel (FCFA)</label>
                  <input className="form-input" type="number"
                    value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Caution (FCFA)</label>
                  <input className="form-input" type="number" placeholder="0"
                    value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn--secondary"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Annuler</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-status">Chargement...</div>
      ) : error ? (
        <div className="page-status page-status--error">{error}</div>
      ) : tenants.length === 0 ? (
        <div className="empty-state">
          <Users size={32} color="var(--color-gray-300)" />
          <p>Aucun locataire enregistré</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Depuis le</th><th></th></tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="td--address">{t.full_name}</td>
                  <td>{t.email}</td>
                  <td>{t.phone || '—'}</td>
                  <td>{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(t.id)}>
                      <Trash2 size={15} />
                    </button>
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
