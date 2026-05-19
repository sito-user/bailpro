import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { register } from '../api/auth';
import './AuthPage.css';

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    org_name: '',
    full_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register(form);
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__logo">BailPro</h1>
          <p className="auth-card__subtitle">Créez votre espace de gestion</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-form__error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Nom de votre agence / organisation</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ex: Cocody Immo"
              value={form.org_name}
              onChange={(e) => setForm({ ...form, org_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Votre nom complet</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ex: M. Salloum"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="vous@exemple.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              className="form-input"
              type="password"
              placeholder="Minimum 8 caractères"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon espace'}
          </button>
        </form>

        <p className="auth-card__footer">
          Déjà un compte ?{' '}
          <Link to="/login" className="auth-card__link">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
