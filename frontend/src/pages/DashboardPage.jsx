import React from 'react';
import { useState, useEffect } from 'react';
import { getDashboard } from '../api/payments';
import { getProperties } from '../api/properties';
import { Building2, FileText, AlertCircle, TrendingUp, Wrench } from 'lucide-react';
import './DashboardPage.css';

const KPICard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="kpi-card">
    <div className="kpi-card__icon" style={{ background: color }}>
      <Icon size={20} color="#fff" />
    </div>
    <div className="kpi-card__body">
      <span className="kpi-card__value">{value}</span>
      <span className="kpi-card__label">{label}</span>
      {sub && <span className="kpi-card__sub">{sub}</span>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getDashboard(), getProperties({ limit: 5 })])
      .then(([dashRes, propRes]) => {
        setKpis(dashRes.data.data);
        setProperties(propRes.data.data);
      })
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false));
  }, []);

  const formatAmount = (n) =>
    new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  if (loading) return <div className="page-status">Chargement...</div>;
  if (error) return <div className="page-status page-status--error">{error}</div>;

  const occupancyRate = kpis.total_properties > 0
    ? Math.round((kpis.occupied_properties / kpis.total_properties) * 100)
    : 0;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Vue d'ensemble de votre parc locatif</p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard
          icon={Building2}
          label="Logements"
          value={kpis.total_properties}
          sub={`${occupancyRate}% occupés`}
          color="#0a0a0a"
        />
        <KPICard
          icon={TrendingUp}
          label="Revenus du mois"
          value={formatAmount(kpis.monthly_revenue)}
          color="#16a34a"
        />
        <KPICard
          icon={AlertCircle}
          label="Impayés"
          value={kpis.pending_payments}
          sub="ce mois"
          color="#dc2626"
        />
        <KPICard
          icon={Wrench}
          label="Maintenance"
          value={kpis.open_maintenance}
          sub="demandes ouvertes"
          color="#d97706"
        />
      </div>

      {/* Properties list */}
      <div className="dashboard__section">
        <div className="section-header">
          <h2 className="section-title">Logements récents</h2>
          <a href="/properties" className="section-link">Voir tout →</a>
        </div>

        {properties.length === 0 ? (
          <div className="empty-state">
            <Building2 size={32} color="var(--color-gray-300)" />
            <p>Aucun logement enregistré</p>
            <a href="/properties" className="btn btn--primary" style={{display:'inline-flex',marginTop:8}}>
              Ajouter un logement
            </a>
          </div>
        ) : (
          <div className="property-list">
            {properties.map((p) => (
              <div key={p.id} className="property-row">
                <div className="property-row__info">
                  <span className="property-row__address">{p.address}</span>
                  {p.district && (
                    <span className="property-row__district">{p.district}</span>
                  )}
                </div>
                <div className="property-row__right">
                  <span className="property-row__rent">
                    {new Intl.NumberFormat('fr-FR').format(p.rent_amount)} FCFA
                  </span>
                  <span className={`badge badge--${p.status}`}>
                    {p.status === 'available' ? 'Disponible'
                      : p.status === 'occupied' ? 'Occupé'
                      : 'Maintenance'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
