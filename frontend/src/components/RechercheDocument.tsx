import { useState } from 'react';
import './Components.css';

function RechercheDocument() {
  type CriteriaKeys = 'Num OF' | 'Produit' | 'Lieu' | 'Libellé Lieu' | 'INDREF' | 'Date Cre' | 'Date sold' | 'TYPOF';
  type Criteria = {
    [key in CriteriaKeys]: string;
  };

  const [criteria, setCriteria] = useState<Criteria>({
    'Num OF': '',
    Produit: '',
    Lieu: '',
    'Libellé Lieu': '',
    INDREF: '',
    'Date Cre': '',
    'Date sold': '',
    TYPOF: ''
  });

  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleChange = (key: CriteriaKeys, value: string) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (pageToFetch = 1) => {
    const params = new URLSearchParams();
    for (const key in criteria) {
      if (criteria[key as CriteriaKeys]) {
        params.append(key, criteria[key as CriteriaKeys]);
      }
    }

    params.append('page', pageToFetch.toString());
    params.append('limit', '30');

    setLoading(true);
    setError(null);

    fetch(`http://localhost:3001/api/document/full-search?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setResults(data.documents || []);
        setTotalPages(data.totalPages || 1);
        setPage(pageToFetch);
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur de recherche");
        setLoading(false);
      });
  };

  const getVisiblePages = () => {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="container">
      <h2>Recherche avancée</h2>

      <div className="grid-2-columns gap-1rem">
        {Object.entries(criteria).map(([key, value]) => (
          <div key={key}>
            <label>{key}</label><br />
            <input
              type="text"
              value={value}
              onChange={e => handleChange(key as CriteriaKeys, e.target.value)}
              className="input-full"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => handleSearch(1)}
        className="btn-primary"
      >
        Rechercher
      </button>

      {loading && <p>Chargement...</p>}
      {error && <p className="error-text">{error}</p>}

      {results.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                {Object.keys(criteria).map((key) => (
                  <th key={key}>{key}</th>
                ))}
                <th>Fichier</th>
              </tr>
            </thead>
            <tbody>
              {results.map((doc, idx) => (
                <tr key={idx}>
                  {Object.keys(criteria).map((key) => (
                    <td key={key}>{doc[key]}</td>
                  ))}
                  <td>
                    {doc.uploadedFile && doc.uploadedFile.originalname ? (
                      <a
                        href={`http://localhost:3001/api/document/file/${doc._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {doc.uploadedFile.originalname}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={() => handleSearch(1)} disabled={page === 1} className="btn-pagination">
              Première page
            </button>
            <button onClick={() => handleSearch(page - 1)} disabled={page === 1} className="btn-pagination">
              ◀ Précédent
            </button>
            {getVisiblePages().map(p => (
              <button
                key={p}
                onClick={() => handleSearch(p)}
                className={`btn-pagination ${page === p ? 'active' : ''}`}
              >
                {p}
              </button>
            ))}
            <button onClick={() => handleSearch(page + 1)} disabled={page === totalPages} className="btn-pagination">
              Suivant ▶
            </button>
            <button onClick={() => handleSearch(totalPages)} disabled={page === totalPages} className="btn-pagination last">
              Dernière page »
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default RechercheDocument;
