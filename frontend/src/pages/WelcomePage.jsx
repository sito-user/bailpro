import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <div className="welcome-logo">BailPro</div>
        <p className="welcome-tagline">Gestion locative simplifiée pour Abidjan</p>

        <h2 className="welcome-question">Qui êtes-vous ?</h2>

        <div className="welcome-cards">
          <button
            className="welcome-card"
            onClick={() => navigate('/login?role=bailleur')}
          >
            <div className="welcome-card__icon">🏢</div>
            <div className="welcome-card__body">
              <h3>Bailleur / Agence</h3>
              <p>Gérez vos logements, baux et locataires</p>
            </div>
            <span className="welcome-card__arrow">→</span>
          </button>

          <button
            className="welcome-card"
            onClick={() => navigate('/login?role=locataire')}
          >
            <div className="welcome-card__icon">🏠</div>
            <div className="welcome-card__body">
              <h3>Locataire</h3>
              <p>Consultez votre loyer et vos quittances</p>
            </div>
            <span className="welcome-card__arrow">→</span>
          </button>
        </div>

        <p className="welcome-footer">
          BailPro — La gestion locative moderne à Abidjan
        </p>
      </div>
    </div>
  );
}
