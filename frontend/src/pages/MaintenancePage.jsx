import React from 'react';
import { useState, useEffect } from 'react';
import { getMaintenance, createMaintenance, updateMaintenance } from '../api/payments';
import { getProperties } from '../api/properties';
import { Plus, Wrench } from 'lucide-react';
import './MaintenancePage.css';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Élevé', urgent: 'Urgent' };
const STATUS_LABELS = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ property_id: '', title: '', description: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getMaintenance(), getProperties()])
      .then(([mRes, pRes]) => {
        setRequests(mRes.data.data);
        setProperties(pRes.data.data);
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
      await createMaintenance(form);
      setForm({ property_id: '', title: '', description: '', priority: 'medium' });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateMaintenance(id, { status });
      load();
    } catch { alert('Impossible de mettre à jour'); }
  };

  return (
    <div className="maintenance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">{requests.filter((r) => r.status === 'open').length} demande(s) ouverte(s)</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Signaler
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h2 className="card__title">Nouvelle demande</h2>
          <form className="prop-form" onSubmit={handleSubmit}>
            {formError && <div className="auth-form__error">{formError}</div>}
            <div className="form-group">
              <label className="form-label">Logement *</label>
              <select className="form-input"
                value={form.property_id}
                onChange={(e) => setForm({ ...form, property_id: e.target.value })} required>
                <option value="">Sélectionner un logement</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.address}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Titre *</label>
              <input className="form-input" type="text"
                placeholder="Ex: Fuite d'eau salle de bain"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea"
                placeholder="Décrivez le problème..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Priorité</label>
              <select className="form-input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--secondary"
                onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-status">Chargement...</div>
      ) : error ? (
        <div className="page-status page-status--error">{error}</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <Wrench size={32} color="var(--color-gray-300)" />
          <p>Aucune demande de maintenance</p>
        </div>
      ) : (
        <div className="maintenance-list">
          {requests.map((r) => (
            <div key={r.id} className={`maint-card maint-card--${r.status}`}>
              <div className="maint-card__header">
                <div className="maint-card__title-row">
                  <span className="maint-card__title">{r.title}</span>
                  <span className={`badge badge--priority-${r.priority}`}>
                    {PRIORITY_LABELS[r.priority]}
                  </span>
                </div>
                <span className="maint-card__address">{r.property_address}</span>
              </div>
              {r.description && (
                <p className="maint-card__desc">{r.description}</p>
              )}
              <div className="maint-card__footer">
                <span className="maint-card__tenant">Par {r.tenant_name}</span>
                <select
                  className="status-select"
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
