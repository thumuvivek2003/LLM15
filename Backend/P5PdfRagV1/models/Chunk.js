// models/Chunk.js
import mongoose from 'mongoose';

function toNumberArray(v) {
  if (Array.isArray(v)) return v.map(Number);
  if (v && typeof v[Symbol.iterator] === 'function') return Array.from(v, Number);
  return v;
}

const ChunkSchema = new mongoose.Schema({
  docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doc', index: true, required: true },
  page: { type: Number, index: true },
  idx: { type: Number }, // position within doc (or within page; consistent is enough)
  text: { type: String },
  embedding: {
    type: [Number],
    index: false,
    set: toNumberArray,
    validate: {
      validator(arr) {
        if (arr == null) return true;
        return Array.isArray(arr) && arr.every((n) => typeof n === 'number' && Number.isFinite(n));
      },
      message: 'embedding must be an array<number>',
    },
  },
});

ChunkSchema.index({ docId: 1, idx: 1 });

export default mongoose.model('Chunk', ChunkSchema);
