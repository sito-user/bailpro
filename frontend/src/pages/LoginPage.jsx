import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { login } from '../api/auth';
import './AuthPage.css';

export default function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'bailleur';
  const isTenant = role === 'locataire';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ identifier: form.email, password: form.password });
      const user = res.data.user;

      if (isTenant && user.role !== 'locataire') {
        setError("Ce compte n'est pas un compte locataire. Veuillez utiliser l'espace bailleur.");
        setLoading(false);
        return;
      }

      if (!isTenant && user.role === 'locataire') {
        setError("Ce compte est un compte locataire. Veuillez utiliser l'espace locataire.");
        setLoading(false);
        return;
      }

      setUser(user);
      if (user.role === 'locataire') {
        navigate('/tenant');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__logo">BailPro</h1>
          <p className="auth-card__subtitle">
            {isTenant ? 'Espace locataire' : 'Espace bailleur / agence'}
          </p>
          <span className={`role-badge role-badge--${isTenant ? 'tenant' : 'admin'}`}>
            {isTenant ? 'Locataire' : 'Bailleur'}
          </span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-form__error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email ou numéro de téléphone</label>
          <input className="form-input"
            type="text"
            placeholder="email@exemple.com ou +225 07 00 00 00"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required />
        </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-card__footer">
          <button className="auth-card__link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate('/')}>
            Changer de profil
          </button>
          {!isTenant && (
            <span> · <a href="/register" className="auth-card__link">Creer un compte</a></span>
          )}
        </div>
      </div>
    </div>
  );
}
