// models/Doc.js
import mongoose from 'mongoose';

const DocSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    filename: { type: String, required: true },
    pages: { type: Number, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Doc', DocSchema);
