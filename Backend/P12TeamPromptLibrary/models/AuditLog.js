import mongoose from 'mongoose';
const AuditLogSchema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    entity: String,
    entityId: String,
    data: Object
}, { timestamps: true });
export default mongoose.model('AuditLog', AuditLogSchema);