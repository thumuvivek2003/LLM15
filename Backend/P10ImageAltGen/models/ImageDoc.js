import mongoose from 'mongoose';


const ImageDocSchema = new mongoose.Schema({
    filename: String, // disk filename
    originalName: String, // original name
    mimeType: String,
    sizeBytes: Number,
    url: String, // served path (e.g., /uploads/xyz.jpg)
    altText: String, // generated or user edited
    caption: String, // optional longer description
    lang: { type: String, default: 'en' },
    status: { type: String, enum: ['new', 'processing', 'ready', 'error'], default: 'new' },
    error: String,
    meta: { // extra fields for audit
        width: Number,
        height: Number
    }
}, { timestamps: true });


export default mongoose.model('ImageDoc', ImageDocSchema);