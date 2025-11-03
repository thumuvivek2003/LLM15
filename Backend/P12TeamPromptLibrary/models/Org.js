import mongoose from 'mongoose';
const OrgSchema = new mongoose.Schema({ name: { type: String, required: true } }, { timestamps: true });
export default mongoose.model('Org', OrgSchema);