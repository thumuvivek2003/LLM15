// routes/chatRoutes.js
import { Router } from 'express';
import { startConversation, streamChat } from '../controllers/chatController.js';

const r = Router();

r.post('/start', startConversation);
r.post('/stream', streamChat);

export default r;
