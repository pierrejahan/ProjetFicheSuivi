import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Components.css';

type ConnexionProps = {
  onLogin: (role: string) => void;
};

const Connexion = ({ onLogin }: ConnexionProps) => {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [role, setRole] = useState('opérateur');  // <--- rôle par défaut changé ici

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const donnees = { identifiant, motDePasse, role };

    try {
      const response = await fetch('http://localhost:3001/api/connexion/verifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.existe) {
          onLogin(role);

          if (role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          alert('❌ Compte n’existe pas');
        }
      } else {
        alert(`Erreur : ${result.error}`);
      }
    } catch (err) {
      console.error('Erreur de requête :', err);
      alert('Erreur de connexion au serveur');
    }
  };

  return (
    <div className="connexion-container">
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <div className="connexion-form-group">
          <label>Identifiant</label><br />
          <input
            type="text"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            required
            className="connexion-input"
          />
        </div>

        <div className="connexion-form-group">
          <label>Mot de passe</label><br />
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            className="connexion-input"
          />
        </div>

        <div className="connexion-form-group">
          <label>Rôle</label><br />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="connexion-select"
          >
            <option value="admin">Admin</option>
            <option value="opérateur">Opérateur</option>
          </select>
        </div>

        <button type="submit">Se connecter</button>
      </form>

      <div className="connexion-link">
        <Link to="/creation">Création de page</Link> {/* lien Création uniquement ici */}
      </div>
    </div>
  );
};

export default Connexion;
