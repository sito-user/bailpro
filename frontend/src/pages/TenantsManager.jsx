import React, { useState, useEffect } from 'react';
import { getTenants, createTenant, deleteTenant } from '../api/users';
import { Plus, Trash2, Users, Copy, Check } from 'lucide-react';
import './TenantsManager.css';

const EMPTY_FORM = { full_name: '', email: '', phone: '', password: '' };

export default function TenantsManager() {
  const [tenants, setTenants] = useState([]);
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
    getTenants()
      .then((res) => setTenants(res.data.data))
      .catch(() => setError('Impossible de charger les locataires'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await createTenant({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password || undefined,
      });
      setNewCredentials({
        email: form.email,
        password: res.data.temp_password,
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

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce locataire ?')) return;
    try {
      await deleteTenant(id);
      load();
    } catch {
      alert('Impossible de supprimer ce locataire');
    }
  };

  const handleCopy = () => {
    const text = `Email: ${newCredentials.email}\nMot de passe: ${newCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

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

      {/* New credentials modal */}
      {newCredentials && (
        <div className="credentials-card">
          <div className="credentials-card__header">
            <span>✅ Locataire créé avec succès !</span>
            <button className="icon-btn" onClick={() => setNewCredentials(null)}>✕</button>
          </div>
          <p className="credentials-card__desc">
            Partagez ces identifiants avec le locataire. Un email lui a également été envoyé.
          </p>
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

      {/* Form */}
      {showForm && (
        <div className="card form-card">
          <h2 className="card__title">Nouveau locataire</h2>
          <form className="prop-form" onSubmit={handleSubmit}>
            {formError && <div className="auth-form__error">{formError}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input className="form-input" type="text"
                  placeholder="Ex: Karim Diallo"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email"
                  placeholder="karim@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" type="text"
                  placeholder="+225 07 00 00 00"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe (optionnel)</label>
                <input className="form-input" type="text"
                  placeholder="Laissez vide pour générer automatiquement"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--secondary"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                Annuler
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="page-status">Chargement...</div>
      ) : error ? (
        <div className="page-status page-status--error">{error}</div>
      ) : tenants.length === 0 ? (
        <div className="empty-state">
          <Users size={32} color="var(--color-gray-300)" />
          <p>Aucun locataire enregistré</p>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            Ajouter un locataire
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Depuis le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="td--address">{t.full_name}</td>
                  <td>{t.email}</td>
                  <td>{t.phone || '—'}</td>
                  <td>{formatDate(t.created_at)}</td>
                  <td>
                    <button className="icon-btn icon-btn--danger"
                      onClick={() => handleDelete(t.id)}>
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
