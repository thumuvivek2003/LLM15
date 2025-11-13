import fetch from 'node-fetch';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

// ─────────── web_fetch ───────────
export async function web_fetch({ args }) {
    const { url, method = 'GET', headers = {} } = args;
    const res = await fetch(url, { method, headers });
    const text = await res.text();
    return { kind: 'web', status: res.status, preview: text.slice(0, 400), length: text.length };
}

// ─────────── db_query ───────────
const DemoSchema = new mongoose.Schema({ email: String, name: String, lastOrderTotal: Number }, { collection: 'demo_users' });
const Demo = mongoose.models.Demo || mongoose.model('Demo', DemoSchema);

export async function db_query({ args }) {
    const { find = {}, limit = 5 } = args;
    const rows = await Demo.find(find).limit(Math.min(50, limit));
    return { kind: 'db', count: rows.length, rows: rows.map(r => r.toObject()) };
}

// ─────────── email_send ───────────
const transport = nodemailer.createTransport({ jsonTransport: true });

export async function email_send({ args }) {
    const { to, subject, text } = args;
    const info = await transport.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to,
        subject,
        text,
    });
    return { kind: 'email', id: info.messageId || 'stub', preview: `${to} · ${subject}` };
}
