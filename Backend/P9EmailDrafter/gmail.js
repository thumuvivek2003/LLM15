import { google } from 'googleapis';
import { htmlToText } from 'html-to-text';


const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose'
];


export const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);


export function authUrl() {
    return oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
}


export function setTokensForSession(sess, tokens) { sess.tokens = tokens; }


export function getGmail(sess) {
    if (!sess?.tokens) return null;
    oauth2Client.setCredentials(sess.tokens);
    return google.gmail({ version: 'v1', auth: oauth2Client });
}


export async function listThreads(gmail, maxResults = 10) {
    const r = await gmail.users.threads.list({ userId: 'me', maxResults });
    const threads = r.data.threads || [];
    const detailed = [];
    for (const t of threads) {
        const tr = await gmail.users.threads.get({ userId: 'me', id: t.id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date', 'To'] });
        const msg = tr.data.messages?.[tr.data.messages.length - 1];
        const headers = Object.fromEntries((msg.payload.headers || []).map(h => [h.name, h.value]));
        detailed.push({ threadId: t.id, messageId: msg.id, subject: headers.Subject, from: headers.From, date: headers.Date, snippet: msg.snippet });
    }
    return detailed;
}


export async function getMessagePlain(gmail, id) {
    const r = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
    const msg = r.data;
    const headers = Object.fromEntries((msg.payload.headers || []).map(h => [h.name, h.value]));
    const from = headers.From || '';
    const fromName = from.split('<')[0].trim();


    function decodePart(part) {
        const body = part.body || {};
        if (body.data) {
            const b64 = body.data.replace(/-/g, '+').replace(/_/g, '/');
            return Buffer.from(b64, 'base64').toString('utf8');
        }
        return '';
    }


    let html = '', text = '';
    const payload = msg.payload;
    if (payload.mimeType === 'text/plain') text = decodePart(payload);
    if (payload.mimeType === 'text/html') html = decodePart(payload);
    if (payload.mimeType?.startsWith('multipart/')) {
        for (const p of (payload.parts || [])) {
            if (p.mimeType === 'text/plain') text += decodePart(p);
            if (p.mimeType === 'text/html') html += decodePart(p);
        }
    }
    if (!text && html) text = htmlToText(html, { wordwrap: false });


    return { id, plain: text.trim(), subject: headers.Subject || '(no subject)', from, fromName, threadId: msg.threadId };
}