import mongoose from 'mongoose';


const PresetSchema = new mongoose.Schema(
{
name: { type: String, required: true, index: true },
systemPrompt: { type: String, default: '' },
userPrompt: { type: String, default: '' },
model: { type: String, default: 'gpt-4o-mini' },
temperature: { type: Number, default: 0.7, min: 0, max: 2 },
top_p: { type: Number, default: 1, min: 0, max: 1 },
tags: { type: [String], default: [] },
notes: { type: String, default: '' }
},
{ timestamps: true }
);


PresetSchema.index({ name: 1, updatedAt: -1 });


export default mongoose.model('Preset', PresetSchema);