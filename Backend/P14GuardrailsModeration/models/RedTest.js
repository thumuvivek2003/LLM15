import mongoose from 'mongoose';
const RedTestSchema = new mongoose.Schema({
    name: String,
    category: String, // jailbreak, pii, hate, sexual, self-harm, malware, etc.
    prompt: String,
    expected: String // "block" | "allow"
}, { timestamps: true });
export default mongoose.model('RedTest', RedTestSchema);