import mongoose from 'mongoose';
const PromptSchema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', index: true },
    title: { type: String, required: true },
    folder: { type: String, default: '/' },
    tags: { type: [String], default: [] },
    variables: { type: [String], default: [] },
    currentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromptVersion' },
    status: { type: String, enum: ['draft', 'pending', 'published', 'rejected'], default: 'draft' }
}, { timestamps: true });
export default mongoose.model('Prompt', PromptSchema);