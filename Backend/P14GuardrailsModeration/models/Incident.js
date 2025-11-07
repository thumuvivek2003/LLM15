import mongoose from 'mongoose';
const IncidentSchema = new mongoose.Schema({
    stage: { type: String, enum: ['pre', 'post'] },
    category: [String],
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    messageHash: String,
    messagePreview: String,
    model: String,
    action: String, // block | redact | transform | allow
    details: Object
}, { timestamps: true });
IncidentSchema.index({ createdAt: -1 });
export default mongoose.model('Incident', IncidentSchema);