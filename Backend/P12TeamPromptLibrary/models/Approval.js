import mongoose from 'mongoose';
const ApprovalSchema = new mongoose.Schema({
    versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromptVersion', index: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    decision: { type: String, enum: ['approved', 'rejected'], required: true },
    comment: String
}, { timestamps: true });
export default mongoose.model('Approval', ApprovalSchema);