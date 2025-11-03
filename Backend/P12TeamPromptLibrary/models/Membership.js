import mongoose from 'mongoose';
const MembershipSchema = new mongoose.Schema({
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], default: 'viewer' }
}, { timestamps: true });
MembershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });
export default mongoose.model('Membership', MembershipSchema);