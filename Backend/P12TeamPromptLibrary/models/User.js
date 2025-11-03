import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    name: String,
    passwordHash: String
}, { timestamps: true });
export default mongoose.model('User', UserSchema);