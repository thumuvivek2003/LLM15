export function chunkText(str, chunkChars = Number(process.env.CHUNK_CHARS || 1200), overlap = Number(process.env.CHUNK_OVERLAP || 150)) {
    const text = (str || '').trim();
    if (!text) return [];
    const out = [];
    for (let i = 0; i < text.length; i += (chunkChars - overlap)) {
        out.push(text.slice(i, i + chunkChars));
    }
    return out;
}