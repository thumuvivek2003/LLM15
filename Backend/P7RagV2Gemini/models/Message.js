import mongoose from 'mongoose';
const MsgSchema = new mongoose.Schema({
    convId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: String,
    citations: [{ doc: String, page: Number, snippet: String }]
}, { timestamps: true });
export default mongoose.model('Message', MsgSchema);