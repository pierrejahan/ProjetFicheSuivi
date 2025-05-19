import { useState } from 'react';
import './Components.css';

const Creation = () => {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [role, setRole] = useState('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const donnees = { identifiant, motDePasse, role };

    try {
      const response = await fetch('http://localhost:3001/api/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
      });

      const result = await response.json();
      console.log('Réponse du serveur :', result);

      if (response.ok) {
        alert('Utilisateur enregistré avec succès');
        setIdentifiant('');
        setMotDePasse('');
        setRole('admin');
      } else {
        alert(`Erreur : ${result.error}`);
      }
    } catch (err) {
      console.error('Erreur lors de l’envoi :', err);
      alert('Erreur de connexion au serveur');
    }
  };

  return (
    <div className="creation-container">
      <h2>Création</h2>
      <form onSubmit={handleSubmit}>
        <div className="creation-form-group">
          <label>Identifiant</label><br />
          <input
            type="text"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            required
            className="creation-input"
          />
        </div>

        <div className="creation-form-group">
          <label>Mot de passe</label><br />
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            className="creation-input"
          />
        </div>

        <div className="creation-form-group">
          <label>Rôle</label><br />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="creation-select"
          >
            <option value="admin">Admin</option>
            <option value="opérateur">Opérateur</option>
          </select>
        </div>

        <button type="submit" className="creation-button">
          Créé le compte
        </button>
      </form>
    </div>
  );
};

export default Creation;
