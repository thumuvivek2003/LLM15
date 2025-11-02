import mongoose from 'mongoose';
const ChunkSchema = new mongoose.Schema({
    docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doc', index: true },
    docTitle: { type: String, index: true },
    page: Number,
    idx: Number,
    text: String,
    embedding: { type: [Number] }
});
ChunkSchema.index({ docId: 1, idx: 1 });
export default mongoose.model('Chunk', ChunkSchema);