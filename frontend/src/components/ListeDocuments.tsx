import { useState, useEffect } from 'react';
import './Components.css';

function ListeDocuments() {
  type CriteriaKeys = 'Num OF' | 'Produit' | 'Lieu' | 'Libellé Lieu' | 'INDREF' | 'Date Cre' | 'Date sold' | 'TYPOF';
  type Criteria = { [key in CriteriaKeys]: string };

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

  const [docs, setDocs] = useState<any[]>([]);
  const [doc, setDoc] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchSimple, setSearchSimple] = useState('');

  const handleChange = (key: CriteriaKeys, value: string) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
  };

  const handleSearchAdvanced = (pageToFetch = 1) => {
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
  setIsSearching(true);

  fetch(`http://localhost:3001/api/document/full-search?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      setDocs(data.documents || []);
      setTotalPages(data.totalPages || 1);
      setPage(pageToFetch);
      setDoc(null);
      setLoading(false);

      // 👉 Réinitialise les champs après la recherche
      setCriteria({
        'Num OF': '',
        Produit: '',
        Lieu: '',
        'Libellé Lieu': '',
        INDREF: '',
        'Date Cre': '',
        'Date sold': '',
        TYPOF: '',
      });
    })
    .catch(() => {
      setError("Erreur de recherche");
      setLoading(false);
    });
};

  const handleSearchSimple = () => {
    if (!searchSimple) {
      setError('Veuillez entrer un numéro OF');
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearching(true);

    fetch(`http://localhost:3001/api/document/search?query=${searchSimple}`)
      .then(res => {
        if (!res.ok) throw new Error('Erreur lors de la recherche');
        return res.json();
      })
      .then(data => {
        if (!data || Object.keys(data).length === 0) {
          setDoc(null);
          setError('Pas de numéro correspondant');
        } else {
          setDoc(data);
          setError(null);
        }
        setLoading(false);
        setSearchSimple('');
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleBackToList = () => {
    setIsSearching(false);
    setDoc(null);
    fetchDocuments(1);
    setPage(1);
  };

  // Nouvelle fonction pour gérer la sélection du fichier sur clic "Modifier"
const handleModifyFileSelect = (docId: string, ofNumber: string, e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    // reader.result contient le fichier encodé en base64
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      content: reader.result,
      docId,
      ofNumber,
    };
    localStorage.setItem('uploadedFile', JSON.stringify(fileData));
    alert(`Fichier ${file.name} stocké dans localStorage pour le document ${ofNumber}`);
  };
  reader.readAsDataURL(file);
};


  const fetchDocuments = (pageToFetch: number) => {
    setLoading(true);
    setError(null);

    fetch(`http://localhost:3001/api/document?page=${pageToFetch}&limit=30`)
      .then(res => res.json())
      .then(data => {
        setDocs(data.documents);
        setTotalPages(data.totalPages);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isSearching) {
      fetchDocuments(page);
    }
  }, [page, isSearching]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, ofNumber: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ofNumber', ofNumber);

    fetch('http://localhost:3001/api/document/upload', {
      method: 'POST',
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error('Échec du téléversement');
        return res.json();
      })
      .then(() => {
        setUploadSuccess(ofNumber);
        setTimeout(() => setUploadSuccess(null), 2000);
      })
      .catch(err => {
        console.error('Erreur téléversement:', err);
      });
  };

  const handlePageClick = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setPage(targetPage);
    if (showAdvancedSearch) {
      handleSearchAdvanced(targetPage);
    } else {
      fetchDocuments(targetPage);
    }
  };

  return (
    <div className="liste-documents-container">
      <h2>Feuille de suivi</h2>

      <button
        onClick={() => {
          setShowAdvancedSearch(!showAdvancedSearch);
          setError(null);
          setDoc(null);
          setIsSearching(false);
        }}
        className="liste-documents-button-toggle-search"
        style={{ marginBottom: '1rem' }}
      >
        {showAdvancedSearch ? 'Recherche simple' : 'Recherche avancée'}
      </button>

      {showAdvancedSearch ? (
        <div className="advanced-search-container">
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
          <button onClick={() => handleSearchAdvanced(1)} className="btn-primary" style={{ marginTop: '1rem' }}>
            Rechercher
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="Rechercher un Num OF..."
            value={searchSimple}
            onChange={(e) => setSearchSimple(e.target.value)}
            className="liste-documents-input"
          />
          <button onClick={handleSearchSimple} className="liste-documents-button-search">
            Rechercher
          </button>
        </div>
      )}

      {loading && <p>Chargement...</p>}
      {error && <p className="liste-documents-error">{error}</p>}

      {doc ? (
        <div>
          <table className="liste-documents-table">
            <thead>
              <tr>
                <th className="liste-documents-cell">Num OF</th>
                <th className="liste-documents-cell">Produit</th>
                <th className="liste-documents-cell">Lieu</th>
                <th className="liste-documents-cell">Libellé Lieu</th>
                <th className="liste-documents-cell">INDREF</th>
                <th className="liste-documents-cell">Date Création</th>
                <th className="liste-documents-cell">Date Sold</th>
                <th className="liste-documents-cell">Type OF</th>
                <th className="liste-documents-cell">Téléverser</th>
                <th className="liste-documents-cell fichier-col">Fichier</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="liste-documents-cell">{doc['Num OF']}</td>
                <td className="liste-documents-cell">{doc.Produit}</td>
                <td className="liste-documents-cell">{doc.Lieu}</td>
                <td className="liste-documents-cell">{doc['Libellé Lieu']}</td>
                <td className="liste-documents-cell">{doc.INDREF}</td>
                <td className="liste-documents-cell">{doc['Date Cre']}</td>
                <td className="liste-documents-cell">{doc['Date sold']}</td>
                <td className="liste-documents-cell">{doc.TYPOF}</td>
                <td className="liste-documents-cell fichier-col">
                  {doc.uploadedFile ? (
                    <>
                      <a
                        href={`http://localhost:3001/api/document/file/${doc._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.uploadedFile.originalname}
                        title="Télécharger le fichier"
                      >
                        📎 {doc.uploadedFile.originalname}
                      </a>
                    </>
                  ) : null}
                </td>
                <td className="liste-documents-cell">
                  {doc.uploadedFile ? (
  <>
    <input
      type="file"
      id={`modify-file-${doc._id}`}
      style={{ display: 'none' }}
      onChange={e => handleModifyFileSelect(doc._id, doc['Num OF'].toString(), e)}
      accept="*/*"
    />
    <label
      htmlFor={`modify-file-${doc._id}`}
      className="btn-modify"
      style={{ cursor: 'pointer' }}
      title="Modifier"
    >
      Modifier
    </label>
  </>
                  ) : (
                    <>
                      <input
                        type="file"
                        id={`file-upload-${doc['Num OF']}`}
                        onChange={e => handleFileUpload(e, doc['Num OF'].toString())}
                        className="input-file-hidden"
                        title="Téléverser un fichier"
                      />
                      <label htmlFor={`file-upload-${doc['Num OF']}`} className="input-file-label">
                        Téléverser un document
                      </label>
                      {uploadSuccess === doc['Num OF'].toString() && (
                        <span style={{ color: 'green', marginLeft: '0.5rem' }}>✔️</span>
                      )}
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <button onClick={handleBackToList} className="btn-primary" style={{ marginTop: '1rem' }}>
            Retour à la liste
          </button>
        </div>
      ) : (
        <div>
          <table className="liste-documents-table">
            <thead>
              <tr>
                <th className="liste-documents-cell">Num OF</th>
                <th className="liste-documents-cell">Produit</th>
                <th className="liste-documents-cell">Lieu</th>
                <th className="liste-documents-cell">Libellé Lieu</th>
                <th className="liste-documents-cell">INDREF</th>
                <th className="liste-documents-cell">Date Création</th>
                <th className="liste-documents-cell">Date Sold</th>
                <th className="liste-documents-cell">Type OF</th>
                <th className="liste-documents-cell">Fichier</th>
                <th className="liste-documents-cell fichier-col">Téléverser</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr
                  key={doc._id}
                  onClick={() => {
                    setDoc(doc);
                    setError(null);
                  }}
                  className="liste-documents-row"
                  style={{ cursor: 'pointer' }}
                >
                  <td className="liste-documents-cell">{doc['Num OF']}</td>
                  <td className="liste-documents-cell">{doc.Produit}</td>
                  <td className="liste-documents-cell">{doc.Lieu}</td>
                  <td className="liste-documents-cell">{doc['Libellé Lieu']}</td>
                  <td className="liste-documents-cell">{doc.INDREF}</td>
                  <td className="liste-documents-cell">{doc['Date Cre']}</td>
                  <td className="liste-documents-cell">{doc['Date sold']}</td>
                  <td className="liste-documents-cell">{doc.TYPOF}</td>
                  <td className="liste-documents-cell fichier-col">
                    {doc.uploadedFile ? (
                      <>
                        <a
                          href={`http://localhost:3001/api/document/file/${doc._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.uploadedFile.originalname}
                          title="Télécharger le fichier"
                          onClick={e => e.stopPropagation()}
                        >
                          📎 {doc.uploadedFile.originalname}
                        </a>
                      </>
                    ) : null}
                  </td>
                  <td className="liste-documents-cell">
                    {doc.uploadedFile ? (
                      <button
  type="button"
  className="btn-modify"
  title="Modifier"
  onClick={(e) => {
    e.stopPropagation(); // évite de doubler l'action ligne
    setDoc(doc);         // 👉 ouvre le détail du document
  }}
>
  Modifier
</button>

                    ) : (
                      <>
                        <input
                          type="file"
                          id={`file-upload-${doc['Num OF']}`}
                          onChange={e => handleFileUpload(e, doc['Num OF'].toString())}
                          className="input-file-hidden"
                          title="Téléverser un fichier"
                        />
                        <label htmlFor={`file-upload-${doc['Num OF']}`} className="input-file-label">
                          Téléverser un document
                        </label>
                        {uploadSuccess === doc['Num OF'].toString() && (
                          <span style={{ color: 'green', marginLeft: '0.5rem' }}>✔️</span>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isSearching && (
      <button
        onClick={handleBackToList}
        className="btn-primary"
        style={{ marginTop: '1rem' }}
      >
        Retour à la liste
      </button>
          )}
          {/* Pagination */}
          {/* Pagination */}
<div className="pagination">
  <button onClick={() => handlePageClick(1)} disabled={page === 1}>
    Première
  </button>
  <button onClick={() => handlePageClick(page - 1)} disabled={page === 1}>
    Précédent
  </button>
  {getVisiblePages().map(p => (
    <button
      key={p}
      onClick={() => handlePageClick(p)}
      className={p === page ? 'active' : ''}
    >
      {p}
    </button>
  ))}
  <button onClick={() => handlePageClick(page + 1)} disabled={page === totalPages}>
    Suivant
  </button>
  <button onClick={() => handlePageClick(totalPages)} disabled={page === totalPages}>
    Dernière
  </button>
</div>

        </div>
      )}
    </div>
  );
}

export default ListeDocuments;
