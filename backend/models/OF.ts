import mongoose from 'mongoose';

const OFSchema = new mongoose.Schema({
  'Num OF': Number,
  'Produit': String,
  'Lieu': String,
  'Libellé Lieu': String,
  'INDREF': String,
  'Date Cre': String,
  'Date sold': String,
  'TYPOF': String,
  // adapte les champs à ceux de ta collection Specification

  uploadedFile: {
    originalname: String,
    mimetype: String,
    size: Number,
    buffer: Buffer,
    uploadDate: Date
  }

});

// Change le nom de la collection ici (3e argument = 'specifications')
export default mongoose.model('OF', OFSchema, 'OF');
