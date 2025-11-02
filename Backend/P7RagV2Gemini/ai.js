import { GoogleGenAI } from "@google/genai";

// Create a single client object
const ai = new GoogleGenAI({apiKey:process.env.GOOGLE_API_KEY,});
export default ai;

// // Access API methods through services on the client object
// const response = await ai.models.generateContent(...);
// const chat = ai.chats.create(...);
// const uploadedFile = await ai.files.upload(...);
// const cache = await ai.caches.create(...);
