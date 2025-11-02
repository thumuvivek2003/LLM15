import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { authUrl, oauth2Client, setTokensForSession, getGmail, listThreads, getMessagePlain } from './gmail.js';
import { buildPrompt, postProcess } from './prompt.js';
import { redactForLLM } from './redact.js';
import { GoogleGenerativeAI } from '@google/generative-ai';


const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 60 }));
app.use(
  session({
    name: 'sid',                 // cookie name
    secret: process.env.SESSION_SECRET || 'my-secret',
    resave: false,
    saveUninitialized: false,    // don’t create empty sessions
    cookie: {
      httpOnly: true,
      sameSite: 'lax',           // OAuth redirects work fine with 'lax'
      secure: false,             // true only behind HTTPS; for localhost keep false
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    }
  })
);


app.get('/health', (_req, res) => res.json({ ok: true }));


// 1) OAuth start
app.get('/auth/login', (_req, res) => { res.redirect(authUrl()); });


// 2) OAuth callback
app.get('/auth/callback', async (req, res) => {
    try {
        const code = req.query.code;
        const { tokens } = await oauth2Client.getToken(code);
        setTokensForSession(req.session, tokens);
        res.send('<script>window.opener && window.opener.postMessage("oauth:ok","*"); window.close();</script>Logged in. You can close this window.');
    } catch (e) {
        res.status(500).send('OAuth error: ' + String(e));
    }
});


// 3) Who am I
app.get('/api/me', async (req, res) => {
    try {
        const gmail = getGmail(req.session);
        if (!gmail) return res.status(401).json({ error: 'Not authed' });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        res.json({ emailAddress: profile.data.emailAddress });
    } catch (e) { res.status(500).json({ error: String(e) }); }
});


// 4) List recent threads (basic metadata)
app.get('/api/gmail/list', async (req, res) => {
    try {
        const gmail = getGmail(req.session); if (!gmail) return res.status(401).json({ error: 'Not authed' });
        const data = await listThreads(gmail, 15);
        res.json(data);
    } catch (e) { res.status(500).json({ error: String(e) }); }
});


// 5) Get a message as plain text (for LLM)
app.get('/api/gmail/message', async (req, res) => {
    try {
        const gmail = getGmail(req.session); if (!gmail) return res.status(401).json({ error: 'Not authed' });
        const id = String(req.query.id || ''); if (!id) return res.status(400).json({ error: 'id required' });
        const msg = await getMessagePlain(gmail, id);
        res.json(msg);
    } catch (e) { res.status(500).json({ error: String(e) }); }
});


// 6) Generate reply with Gemini
app.post('/api/generate-reply', async (req, res) => {
    try {
        console.log('Req',req.session, getGmail(req.session));
        const gmail = getGmail(req.session); if (!gmail) return res.status(401).json({ error: 'Not authed' });
        const { messageId, tone = 'neutral', length = 'medium', bullets = false, rewriteSubject = true, addDisclaimer = true, signature } = req.body || {};
        if (!messageId) return res.status(400).json({ error: 'messageId required' });


        const source = await getMessagePlain(gmail, messageId);


        // PII redaction before sending to LLM
        const { redacted, map } = redactForLLM(source.plain);
        console.log('Redacted',redacted,map);


        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = buildPrompt({ tone, length, bullets, sourceText: redacted, sender: source.fromName || 'the sender', rewriteSubject });
        console.log('Prompt',prompt)


        const resp = await model.generateContent(prompt);
        console.log(resp,'Resp');
        const raw = resp.response.text();
        console.log(raw,'Raw');


        // Post process: unredact placeholders (safe), add signature + disclaimer
        const finalized = postProcess({ draft: raw, map, addDisclaimer, signature });


        res.json({ draft: finalized, meta: { promptChars: prompt.length } });
    } catch (e) { res.status(500).json({ error: String(e) }); }
});


// 7) Create Gmail Draft (not sending)
app.post('/api/gmail/draft', async (req, res) => {
    try {
        const gmail = getGmail(req.session); if (!gmail) return res.status(401).json({ error: 'Not authed' });
        const { threadId, to, subject, body } = req.body || {};
        if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject, body required' });


        const message = [
            `To: ${to}`,
            'Content-Type: text/plain; charset="UTF-8"',
            `Subject: ${subject}`,
            '',
            body
        ].join('\n');
        const raw = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');


        const resp = await gmail.users.drafts.create({ userId: 'me', requestBody: { message: { raw, threadId } } });
        res.json({ ok: true, draftId: resp.data.id });
    } catch (e) { res.status(500).json({ error: String(e) }); }
});


const PORT = Number(process.env.PORT || 5058);
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));