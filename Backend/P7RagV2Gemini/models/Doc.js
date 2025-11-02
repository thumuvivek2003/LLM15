import mongoose from 'mongoose';
const DocSchema = new mongoose.Schema({
    title: String,
    filename: String,
    pages: Number,
    sizeBytes: Number
}, { timestamps: true });
export default mongoose.model('Doc', DocSchema);