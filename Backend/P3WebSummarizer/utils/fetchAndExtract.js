import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { decode } from 'html-entities';


export async function fetchAndExtract(url) {
    const resp = await fetch(url, { headers: { 'User-Agent': 'WebSummarizer/1.0' } });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const html = await resp.text();


    // Basic protection: bail on extremely small pages
    if (!html || html.length < 200) return { title: url, text: '' };


    const dom = new JSDOM(html, { url });
    const document = dom.window.document;


    // Remove noisy nodes before Readability
    const selectors = ['script', 'style', 'noscript', 'iframe', 'header nav', 'footer', 'form', 'aside', '.advert', '.ad', '.promo'];
    selectors.forEach(sel => document.querySelectorAll(sel).forEach(n => n.remove()));


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