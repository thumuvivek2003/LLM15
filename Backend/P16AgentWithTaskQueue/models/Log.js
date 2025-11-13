import mongoose from 'mongoose';
const LogSchema = new mongoose.Schema({
    jobId: { type: String, index: true },
    ts: { type: Date, default: () => new Date() },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    event: String,
    data: Object
});
export default mongoose.model('Log', LogSchema);