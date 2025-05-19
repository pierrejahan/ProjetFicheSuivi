import { useEffect, useState } from 'react';

function ModifierMessage() {
  const [uploadedFile, setUploadedFile] = useState<any | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    const storedFileStr = localStorage.getItem('uploadedFile');
    if (storedFileStr) {
      try {
        const fileObj = JSON.parse(storedFileStr);
        setUploadedFile(fileObj);
      } catch (err) {
        console.error('Erreur parsing fichier dans localStorage', err);
        setUploadedFile(null);
      }
    }
  }, []);

  const handleUpload = async () => {
    if (!uploadedFile?.content || !uploadedFile?.ofNumber) {
      setUploadStatus("Fichier ou numéro OF manquant.");
      return;
    }

    try {
      // Convertir base64 → Blob
      const byteString = atob(uploadedFile.content.split(',')[1]);
      const mimeString = uploadedFile.content.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      const formData = new FormData();
      formData.append('file', blob, uploadedFile.name);
      formData.append('ofNumber', uploadedFile.ofNumber);

      const res = await fetch('http://localhost:3001/api/document/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
  setUploadStatus("Fichier envoyé avec succès !");
} else {
  const errText = await res.text();
  setUploadStatus(`Erreur lors de l'envoi : ${errText}`);
}
    } catch (err) {
      console.error('Erreur upload :', err);
      setUploadStatus('Erreur technique lors de l\'envoi du fichier.');
    }
  };

  if (!uploadedFile) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Fichier stocké</h2>
        <p style={{ fontStyle: 'italic' }}>Aucun fichier trouvé dans le localStorage.</p>
      </div>
    );
  }

  const { name, type, size, content, docId, ofNumber } = uploadedFile;
  const dataUrl = content || null;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Fichier stocké</h2>
      <div style={{ fontSize: '1.1rem', color: 'darkblue' }}>
        <p><strong>Nom :</strong> {name || 'N/A'}</p>
        <p><strong>Type :</strong> {type || 'N/A'}</p>
        <p><strong>Taille :</strong> {size ? `${size} octets` : 'N/A'}</p>
        <p><strong>Document ID :</strong> {docId || 'N/A'}</p>
        <p><strong>Numéro OF :</strong> {ofNumber || 'N/A'}</p>

        {dataUrl ? (
          <p>
            <a
              href={dataUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={name}
              style={{ textDecoration: 'underline', color: 'blue', cursor: 'pointer' }}
            >
              Ouvrir / Télécharger le fichier
            </a>
          </p>
        ) : (
          <p>Pas de contenu disponible</p>
        )}

        {type.startsWith('image/') && dataUrl && (
          <div style={{ marginTop: '1rem' }}>
            <img
              src={dataUrl}
              alt={name}
              style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #ccc' }}
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          style={{
            marginTop: '1.5rem',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Valider l’envoi du fichier
        </button>

        {uploadStatus && (
          <p style={{ marginTop: '1rem', color: uploadStatus.includes('succès') ? 'green' : 'red' }}>
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  );
}

export default ModifierMessage;
