export function chunkText(str, size = Number(process.env.CHUNK_CHARS || 1200), overlap = Number(process.env.CHUNK_OVERLAP || 150)) {
    const s = (str || '').trim(); if (!s) return []; const out = []; for (let i = 0; i < s.length; i += (size - overlap)) out.push(s.slice(i, i + size)); return out;
}