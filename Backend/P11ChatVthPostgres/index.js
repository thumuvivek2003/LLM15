import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 60 }));


const pool = new Pool({ connectionString: process.env.PG_URL });
function capLimit(sql) {
    const lim = Number(process.env.ROW_LIMIT || 500);
    const hasLimit = /\blimit\s+\d+/i.test(sql);
    if (!hasLimit) return sql + `\nLIMIT ${lim}`;
    return sql.replace(/limit\s+(\d+)/i, (_, n) => `LIMIT ${Math.min(Number(n), lim)}`);
}


function isSafeReadOnly(sql) {
    const s = sql.trim().toLowerCase();
    if (s.includes(';')) return false; // single statement only
    const banned = ['insert', 'update', 'delete', 'alter', 'drop', 'truncate', 'create', 'grant', 'revoke', 'copy', 'vacuum', 'analyze'];
    if (banned.some(k => s.startsWith(k) || s.includes(` ${k} `))) return false;
    if (!s.startsWith('select')) return false;
    return true;
}

// Basic schema introspection (public tables)
async function getSchema() {
    const client = await pool.connect();
    try {
        const tbls = await client.query(`
select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'
`);
        const tables = [];
        for (const row of tbls.rows) {
            const cols = await client.query(`
select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1
`, [row.table_name]);
            tables.push({ table: row.table_name, columns: cols.rows });
        }
        return tables;
    } finally { client.release(); }
}


app.get('/health', (_req, res) => res.json({ ok: true }));


app.get('/api/schema', async (_req, res) => {
    try { res.json({ tables: await getSchema() }); }
    catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

// NL -> SQL
const AskPayload = z.object({ question: z.string().min(3).max(2000) });
app.post('/api/ask', async (req, res) => {
    try {
        const { question } = AskPayload.parse(req.body || {});


        const schema = await getSchema();

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: process.env.GEN_MODEL || 'gemini-2.0-flash' });


        const responseSchema = {
            type: 'OBJECT',
            properties: {
                sql: { type: 'STRING' },
                params: { type: 'ARRAY', items: { type: 'STRING' } },
                rationale: { type: 'STRING' }
            },
            required: ['sql']
        };


        const prompt = [
            'You convert natural language questions into **safe, parameterized SQL** for PostgreSQL.',
            'Rules:',
            '- Return ONLY a JSON object as per the response schema (no extra text).',
            '- Use **SELECT** only. No writes or DDL. Single statement. No semicolons.',
            '- Prefer explicit column lists and aliases. Use WHERE with parameters like $1, $2, ...',
            `Schema (public):\n${JSON.stringify(schema, null, 2)}`,
            `Question: ${question}`,
            'Respond with fields: sql, params (strings for each $n), rationale.'
        ].join('\n');


        const resp = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema
            }
        });


        let out;
        try { out = JSON.parse(resp.response.text()); } catch { throw new Error('Model did not return JSON'); }


        let sql = String(out.sql || '').trim();
        if (!isSafeReadOnly(sql)) throw new Error('Unsafe SQL rejected');
        sql = capLimit(sql);


        const params = Array.isArray(out.params) ? out.params : [];


        const t0 = Date.now();
        const r = await pool.query(sql, params);
        const ms = Date.now() - t0;


        res.json({
            ok: true,
            sql,
            params,
            rationale: out.rationale || '',
            timeMs: ms,
            rows: r.rows
        });
    } catch (e) {
        res.status(400).json({ error: String(e.message || e) });
    }
});





app.post('/api/search', async (req, res) => {
    try {
        const { q, k = 10 } = SearchPayload.parse(req.body || {});
        const qv = await embed(q);
        const lit = toVectorLiteral(qv);


        const client = await pool.connect();
        try {
            // Vector similarity (cosine) and keyword ILIKE
            const vec = await client.query(
                `SELECT id, name, category, price, 1 - (embedding <=> $1::vector) AS score
                FROM products
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> $1::vector
                LIMIT $2`, [lit, Math.min(k, 50)]
            );


            const kw = await client.query(
                `SELECT id, name, category, price, 0.5 AS score
                FROM products
                WHERE name ILIKE '%' || $1 || '%' OR category ILIKE '%' || $1 || '%'
                LIMIT $2`, [q, Math.min(k, 50)]
            );


            // Merge & dedupe by id, keep max score
            const map = new Map();
            for (const row of [...vec.rows, ...kw.rows]) {
                const prev = map.get(row.id);
                if (!prev || row.score > prev.score) map.set(row.id, row);
            }
            const items = [...map.values()].sort((a, b) => b.score - a.score).slice(0, k);
            res.json({ ok: true, items });
        } finally { client.release(); }
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
});


// Semantic + keyword hybrid search over products
const SearchPayload = z.object({ q: z.string().min(1), k: z.number().optional() });


function toVectorLiteral(arr) {
    if (!Array.isArray(arr)) throw new Error('embed must return number[]');
    const nums = arr.map((n) => {
        if (!Number.isFinite(n)) throw new Error(`Non-finite number: ${n}`);
        return Number(n); // normalize
    });
    return `[${nums.join(',')}]`;
}


async function embed(text) {
    const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);
    const r = await genAI.models.embedContent({
        model: process.env.EMBED_MODEL || 'gemini-embedding-001',
        contents: text,
        config: {
            outputDimensionality: 1536,
        },
    });
    return r.embeddings[0].values;
}

// Admin: embed all product rows (concat text fields)
app.post('/api/admin/embed', async (_req, res) => {
    try {
        const client = await pool.connect();
        try {
            const rows = await client.query(
                `SELECT id, COALESCE(name, '') || ' ' || COALESCE(category, '') AS text
   FROM products`
            );

            let updated = 0;
            for (const r of rows.rows) {
                const v = await embed(r.text);
                const lit = toVectorLiteral(v);
                await client.query('UPDATE products SET embedding = $1 WHERE id = $2', [lit, r.id]);
                updated++;
            }
            res.json({ ok: true, updated });
        } finally { client.release(); }
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


const PORT = Number(process.env.PORT || 5060);
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));