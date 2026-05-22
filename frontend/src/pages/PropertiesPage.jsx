import React from 'react';
import { useState, useEffect } from 'react';
import { getProperties, createProperty, deleteProperty } from '../api/properties';
import { Plus, Trash2, Building2, Search } from 'lucide-react';
import './PropertiesPage.css';

const EMPTY_FORM = {
  address: '', district: '', surface_m2: '', rent_amount: '', type: 'appartement',
};

const TYPE_LABELS = {
  appartement: 'Appartement', villa: 'Villa', magasin: 'Magasin',
  bureau: 'Bureau', entrepot: 'Entrepôt', autre: 'Autre',
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const load = () => {
    setLoading(true);
    getProperties()
      .then((res) => {
        setProperties(res.data.data);
        setFiltered(res.data.data);
      })
      .catch(() => setError('Impossible de charger les logements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Filter logic
  useEffect(() => {
    let result = properties;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        p.address.toLowerCase().includes(s) ||
        (p.district && p.district.toLowerCase().includes(s))
      );
    }
    if (filterStatus) result = result.filter(p => p.status === filterStatus);
    if (filterType) result = result.filter(p => p.type === filterType);
    setFiltered(result);
  }, [search, filterStatus, filterType, properties]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createProperty({
        ...form,
        surface_m2: form.surface_m2 ? parseFloat(form.surface_m2) : undefined,
        rent_amount: parseFloat(form.rent_amount),
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
    if (!window.confirm('Supprimer ce logement ?')) return;
    try { await deleteProperty(id); load(); }
    catch { alert('Impossible de supprimer ce logement'); }
  };

  return (
    <div className="properties-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logements</h1>
          <p className="page-subtitle">{filtered.length} logement(s) affiché(s)</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Search & Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" type="text"
            placeholder="Rechercher par adresse ou quartier..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-input filter-select"
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="available">Disponible</option>
          <option value="occupied">Occupé</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select className="form-input filter-select"
          value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card form-card">
          <h2 className="card__title">Nouveau bien immobilier</h2>
          <form className="prop-form" onSubmit={handleSubmit}>
            {formError && <div className="auth-form__error">{formError}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Adresse *</label>
                <input className="form-input" type="text"
                  placeholder="Rue des Jardins, Cocody"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required />
              </div>
              <div className="form-group">
                <label className="form-label">Quartier</label>
                <input className="form-input" type="text"
                  placeholder="Cocody, Marcory..."
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type de bien</label>
                <select className="form-input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Surface (m²)</label>
                <input className="form-input" type="number" min="1"
                  placeholder="75"
                  value={form.surface_m2}
                  onChange={(e) => setForm({ ...form, surface_m2: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Loyer mensuel (FCFA) *</label>
              <input className="form-input" type="number" min="1"
                placeholder="150000"
                value={form.rent_amount}
                onChange={(e) => setForm({ ...form, rent_amount: e.target.value })}
                required />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--secondary"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                Annuler
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
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
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Building2 size={32} color="var(--color-gray-300)" />
          <p>Aucun logement trouvé</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Adresse</th>
                <th>Type</th>
                <th>Quartier</th>
                <th>Surface</th>
                <th>Loyer</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="td--address">{p.address}</td>
                  <td><span className="badge badge--type">{TYPE_LABELS[p.type] || 'Appartement'}</span></td>
                  <td>{p.district || '—'}</td>
                  <td>{p.surface_m2 ? `${p.surface_m2} m²` : '—'}</td>
                  <td className="td--amount">
                    {new Intl.NumberFormat('fr-FR').format(p.rent_amount)} FCFA
                  </td>
                  <td>
                    <span className={`badge badge--${p.status}`}>
                      {p.status === 'available' ? 'Disponible'
                        : p.status === 'occupied' ? 'Occupé' : 'Maintenance'}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(p.id)}>
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
