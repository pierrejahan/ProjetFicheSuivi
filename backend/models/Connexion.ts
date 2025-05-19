import mongoose from 'mongoose';

const ConnexionSchema = new mongoose.Schema({
  identifiant: String,
  motDePasse: String,
  role: {
    type: String,
    enum: ['admin', 'opérateur'],
  },
});

export default mongoose.model('Connexion', ConnexionSchema, 'Connexion');