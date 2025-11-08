import mongoose from 'mongoose';
const ThreadSchema = new mongoose.Schema({
    title: { type: String, default: 'Untitled thread' }
}, { timestamps: true });
export default mongoose.model('Thread', ThreadSchema);