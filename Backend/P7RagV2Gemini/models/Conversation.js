import mongoose from 'mongoose';
const ConvSchema = new mongoose.Schema({
    title: { type: String, default: 'Untitled chat' },
    docFilterIds: { type: [mongoose.Schema.Types.ObjectId], default: [] } // empty = all docs
}, { timestamps: true });
export default mongoose.model('Conversation', ConvSchema);