import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import OF from './models/OF'; // Modèle pour les ordres de fabrication (OF)
import Connexion from './models/Connexion'; // Modèle pour les utilisateurs

const app = express();
const PORT = 3001;

// Middlewares globaux
app.use(cors()); // Autorise les requêtes cross-origin
app.use(express.json()); // Parse le corps des requêtes en JSON

// Connexion à MongoDB (local ou via variable d'environnement)
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/Document')
  .then(() => console.log("Connexion à MongoDB réussie"))
  .catch((err) => {
    console.error("Erreur de connexion à MongoDB:", err);
    process.exit(1); // Arrêt si échec de la connexion
  });

// Configuration de multer pour gérer les fichiers en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage });


// ========================= ROUTES ========================= //


//  Récupérer la liste paginée des documents
app.get('/api/document', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const total = await OF.countDocuments();
    const docs = await OF.find().skip(skip).limit(limit);

    res.json({
      documents: docs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Erreur de requête :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});



//  Rechercher un document par numéro OF exact
app.get('/api/document/search', async (req: any, res: any) => {
  try {
    const query = req.query.query as string;
    const numQuery = parseFloat(query);

    const doc = await OF.findOne({ 'Num OF': numQuery });

    res.json(doc);
  } catch (err) {
    console.error('Erreur de recherche :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});



//  Upload d'un fichier et association à un document via le numéro OF
app.post('/api/document/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    const { ofNumber, test } = req.body; // <-- le champ s'appelle "test" dans le formData
    const file = req.file;
    const num = parseFloat(ofNumber);

    const doc = await OF.findOne({ 'Num OF': num });

    if (!doc || !file) {
      return res.status(400).json({ message: 'Document ou fichier manquant' });
    }

    if (test === 'upload') {
      doc.uploadedFile = {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        uploadDate: new Date()
      };
    } else if (test === 'modify') {
      doc.modifyFile = {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        uploadDate: new Date()
      };
    } else {
      return res.status(400).json({ message: 'Type de test invalide' });
    }

    await doc.save();

    res.json({ message: 'Fichier enregistré avec succès' });
  } catch (err) {
    console.error('Erreur de téléversement :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});





//  Recherche avancée par champs multiples avec pagination
app.get('/api/document/full-search', async (req: any, res: any) => {
  const query = req.query as Record<string, any>;

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 30;
  const skip = (page - 1) * limit;

  const searchFilters: Record<string, any> = {};

  // Construction dynamique des filtres de recherche
  for (const key in query) {
    if (key === 'page' || key === 'limit') continue;

    if (query[key]) {
      if (key === 'Num OF') {
        searchFilters[key] = Number(query[key]);
      } else {
        searchFilters[key] = { $regex: query[key], $options: 'i' }; // insensible à la casse
      }
    }
  }

  try {
    const totalCount = await OF.countDocuments(searchFilters);
    const totalPages = Math.ceil(totalCount / limit);

    const docs = await OF.find(searchFilters).skip(skip).limit(limit);

    res.json({
      documents: docs,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error('Erreur lors de la recherche complète :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});



//  Création d’un nouvel utilisateur avec identifiants et rôle
app.post('/api/connexion', async (req: any, res: any) => {
  try {
    const { identifiant, motDePasse, role } = req.body;

    if (!identifiant || !motDePasse || !role) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    const nouvelUtilisateur = new Connexion({ identifiant, motDePasse, role });
    await nouvelUtilisateur.save();

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la création de l utilisateur :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});



//  Vérification des identifiants de connexion
app.post('/api/connexion/verifier', async (req, res) => {
  try {
    const { identifiant, motDePasse, role } = req.body;

    if (!identifiant || !motDePasse || !role) {
      res.status(400).json({ error: 'Champs requis manquants' });
      return;
    }

    const utilisateur = await Connexion.findOne({ identifiant, motDePasse, role });

    res.status(200).json({ existe: !!utilisateur });
  } catch (err) {
    console.error('Erreur lors de la vérification :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



//  Téléchargement du fichier associé à un document via son ID
app.get('/api/document/file/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Paramètre ID manquant' });
    }

    const document = await OF.findById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    if (!document.uploadedFile) {
      return res.status(404).json({ error: 'Aucun fichier associé à ce document' });
    }

    const { buffer, mimetype, originalname, size } = document.uploadedFile;

    res.set({
      'Content-Type': mimetype,
      'Content-Disposition': `attachment; filename="${originalname}"`,
      'Content-Length': size,
    });

    res.send(buffer);
  } catch (err) {
    console.error('Erreur lors de la récupération du fichier :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});



//  Route pour détecter le clic sur "Modifier le document"
app.post('/api/document/modify-click', (req, res) => {
  console.log("Modification du document détectée");
  res.json({ message: "Le bouton Modifier le document a été cliqué !" });
});


// Récupère tous les documents ayant un modifyFile
app.get('/api/document/all-modified', async (req: any, res: any) => {
  try {
    // Ne récupérer que Num OF et modifyFile dans les résultats
    const docsWithModifyFile = await OF.find(
      { modifyFile: { $exists: true, $ne: null } },
      { 'Num OF': 1, modifyFile: 1, _id: 1 } // projection: champs à inclure
    );

    res.json(docsWithModifyFile);
  } catch (err) {
    console.error('Erreur lors de la récupération des fichiers modifiés :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});



// Pour faire que le fichier modifyfile remplace dans uploadedfile
app.post('/api/document/validate-modification', async (req: any, res: any) => {
  try {
    const { ofNumber } = req.body;
    const num = parseFloat(ofNumber);

    const doc = await OF.findOne({ 'Num OF': num });

    if (!doc || !doc.modifyFile) {
      return res.status(404).json({ error: 'Document ou fichier de modification non trouvé.' });
    }

    doc.uploadedFile = { ...doc.modifyFile };
    doc.modifyFile = undefined;

    await doc.save();

    res.json({ message: 'Fichier modifié validé avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la validation de modification :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});



// Pour supprimer le fichier de la base de donnée
app.post('/api/document/reject-modification', async (req: any, res: any) => {
  try {
    const { ofNumber } = req.body;
    const num = parseFloat(ofNumber);

    const doc = await OF.findOne({ 'Num OF': num });

    if (!doc || !doc.modifyFile) {
      return res.status(404).json({ error: 'Document ou champ modifyFile non trouvé.' });
    }

    doc.modifyFile = undefined;
    await doc.save();

    res.json({ message: 'Modification refusée et supprimée avec succès.' });
  } catch (err) {
    console.error('Erreur lors du rejet de la modification :', err);
    res.status(500).json({ error: 'Erreur serveur', details: err });
  }
});


//  Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur backend lancé sur le port ${PORT}`);
});
