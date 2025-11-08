import mongoose from 'mongoose';
const MessageSchema = new mongoose.Schema({
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    tokenGuess: { type: Number, default: 0 }
}, { timestamps: true });
MessageSchema.index({ threadId: 1, createdAt: 1 });
export default mongoose.model('Message', MessageSchema);