import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import ListeDocuments from './components/ListeDocuments';
import Creation from './components/Creation';
import Connexion from './components/Connexion';
import React, { useState } from 'react';
import ModifierMessage from './components/ModifierMessage';


function App() {
  const [role, setRole] = useState<string | null>(() => localStorage.getItem('role'));
  const [isConnected, setIsConnected] = useState(() => {
    const stored = localStorage.getItem('isConnected');
    return stored === 'true'; // car localStorage stocke en string
  });

  const handleLogin = (userRole: string) => {
    setRole(userRole);
    setIsConnected(true);
    localStorage.setItem('role', userRole);
    localStorage.setItem('isConnected', 'true');
  };

  const handleLogout = () => {
    setRole(null);
    setIsConnected(false);
    localStorage.removeItem('role');
    localStorage.setItem('isConnected', 'false');
  };

  const menu = isConnected ? (
    role === 'admin' ? (
      <nav style={{ marginBottom: '1rem' }}>
        <button onClick={handleLogout} style={{ marginLeft: '1rem' }}>Se déconnecter</button>
      </nav>
    ) : (
      <nav style={{ marginBottom: '1rem' }}>
        {/* Plus de lien création ici */}
        <button onClick={handleLogout} style={{ marginLeft: '1rem' }}>Se déconnecter</button>
      </nav>
    )
  ) : (
    <nav style={{ marginBottom: '1rem' }}>
      <Link to="/connexion" style={linkStyle}>Connexion</Link>
    </nav>
  );

  return (
    <Router>
      <div style={{ padding: '1rem' }}>
        {menu}

        <Routes>
          <Route path="/connexion" element={<Connexion onLogin={handleLogin} />} />

          {isConnected && role === 'admin' && (
            <>
              <Route path="/ModifierMessage" element={<ModifierMessage />} />
              <Route path="*" element={<Navigate to="/ModifierMessage" replace />} />
            </>
          )}

          {isConnected && role !== 'admin' && (
            <>
              <Route path="/" element={<ListeDocuments />} />
              <Route path="/creation" element={<Creation />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}

          {!isConnected && (
            <Route path="*" element={<Navigate to="/connexion" replace />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

const linkStyle: React.CSSProperties = {
  marginRight: '1rem',
  textDecoration: 'none',
  color: '#2196F3',
  fontWeight: 'bold',
};

export default App;
