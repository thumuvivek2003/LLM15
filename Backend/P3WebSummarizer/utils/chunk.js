// chunk.js
// Rough token budgeting: ~4 chars ≈ 1 token (very approximate)

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { decode } from 'html-entities';

// You can tweak this based on your downstream model limits
export const DEFAULT_MAX_CHARS_PER_CHUNK = 6000;

/**
 * Fetch a URL and extract a cleaned article body + title.
 */
export async function fetchAndExtract(url) {
    const resp = await fetch(url, { headers: { 'User-Agent': 'WebSummarizer/1.0' } });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);

    const html = await resp.text();

    // Basic protection: bail on extremely small pages
    if (!html || html.length < 200) return { title: url, text: '' };

    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Remove noisy nodes before Readability
    const selectors = [
        'script',
        'style',
        'noscript',
        'iframe',
        'header nav',
        'footer',
        'form',
        'aside',
        '.advert',
        '.ad',
        '.promo',
    ];
    selectors.forEach(sel =>
        document.querySelectorAll(sel).forEach(n => n.remove())
    );

    const reader = new Readability(document);
    const article = reader.parse();

    let title = article?.title || document.title || url;
    let content = article?.textContent || document.body?.textContent || '';

    // Normalize whitespace & entities
    content = decode(content)
        .replace(/\u00a0/g, ' ')
        .replace(/[\t\r]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Very long pages sometimes include cookie / nav leftovers
    // Keep only lines with some letters and at least 30 chars
    const lines = content.split('\n').map(l => l.trim());
    const filtered = lines.filter(l => /[A-Za-z]/.test(l) && l.length >= 30);
    const text = filtered.join('\n\n');

    return { title, text };
}

/**
 * Chunk long text into roughly model-sized pieces.
 * Splits on paragraph boundaries when possible, and falls back to
 * hard slicing for very long paragraphs.
 */
export function chunkText(text, maxCharsPerChunk = DEFAULT_MAX_CHARS_PER_CHUNK) {
    if (!text) return [];

    const paras = text
        .split(/\n{2,}/)       // paragraphs separated by blank lines
        .map(p => p.trim())
        .filter(Boolean);

    const chunks = [];
    let buf = '';

    for (const p of paras) {
        if (p.length > maxCharsPerChunk) {
            // Flush any existing buffer as a chunk
            if (buf) {
                chunks.push(buf.trim());
                buf = '';
            }
            // Hard-slice this oversized paragraph
            for (let i = 0; i < p.length; i += maxCharsPerChunk) {
                chunks.push(p.slice(i, i + maxCharsPerChunk));
            }
            continue;
        }

        if (!buf) {
            buf = p;
            continue;
        }

        // If adding this paragraph exceeds the limit, push the buffer first
        if (buf.length + 2 + p.length > maxCharsPerChunk) {
            chunks.push(buf.trim());
            buf = p;
        } else {
            buf = `${buf}\n\n${p}`;
        }
    }

    if (buf) chunks.push(buf.trim());
    return chunks;
}
