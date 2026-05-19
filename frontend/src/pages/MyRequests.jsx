import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMaintenance, createMaintenance } from '../api/payments';
import { getProperties } from '../api/properties';
import { ClipboardList, Plus } from 'lucide-react';
import './MyRequests.css';

const PRIORITY_LABELS = { low: 'Faible', medium: 'Moyen', high: 'Eleve', urgent: 'Urgent' };
const STATUS_LABELS = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Resolu', closed: 'Ferme' };

export default function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ property_id: '', title: '', description: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([getMaintenance(), getProperties()]);
      const myRequests = mRes.data.data.filter((r) => r.tenant_id === user?.id);
      setRequests(myRequests);
      setProperties(pRes.data.data);
    } catch {
      setError('Impossible de charger vos demandes');
    } finally {
      setLoading(false);
    }
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
      setFormError(err.response?.data?.message || 'Erreur lors de l envoi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-status">Chargement...</div>;
  if (error) return <div className="page-status page-status--error">{error}</div>;

  return (
    <div className="my-requests">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes demandes</h1>
          <p className="page-subtitle">{requests.length} demande(s)</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Nouvelle demande
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h2 className="card__title">Signaler un probleme</h2>
          <form className="prop-form" onSubmit={handleSubmit}>
            {formError && <div className="auth-form__error">{formError}</div>}
            <div className="form-group">
              <label className="form-label">Logement *</label>
              <select className="form-input"
                value={form.property_id}
                onChange={(e) => setForm({ ...form, property_id: e.target.value })} required>
                <option value="">Selectionner un logement</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.address}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Titre *</label>
              <input className="form-input" type="text"
                placeholder="Ex: Fuite d eau salle de bain"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea"
                placeholder="Decrivez le probleme..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Priorite</label>
              <select className="form-input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Faible</option>
                <option value="medium">Moyen</option>
                <option value="high">Eleve</option>
                <option value="urgent">Urgent</option>
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

      {requests.length === 0 && !showForm ? (
        <div className="empty-state">
          <ClipboardList size={32} color="var(--color-gray-300)" />
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
              {r.description && <p className="maint-card__desc">{r.description}</p>}
              <div className="maint-card__footer">
                <span className={`badge badge--status-${r.status}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
