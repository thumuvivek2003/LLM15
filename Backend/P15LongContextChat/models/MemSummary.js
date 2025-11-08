import mongoose from 'mongoose';
const MemSummarySchema = new mongoose.Schema({
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', unique: true },
    include: { type: Boolean, default: true },
    notes: { type: String, default: '' }, // running summary notes
    highlights: { type: [String], default: [] }, // important facts/IDs
    lastUpdateTurn: { type: Number, default: 0 } // count of messages when last summarized
}, { timestamps: true });
export default mongoose.model('MemSummary', MemSummarySchema);