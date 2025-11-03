import mongoose from 'mongoose';
const PromptVersionSchema = new mongoose.Schema({
    promptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prompt', index: true },
    number: { type: Number, index: true },
    body: { type: String, required: true },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    state: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' }
}, { timestamps: true });
PromptVersionSchema.index({ promptId: 1, number: 1 }, { unique: true });
export default mongoose.model('PromptVersion', PromptVersionSchema);