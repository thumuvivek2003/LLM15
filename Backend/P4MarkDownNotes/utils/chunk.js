// Very rough token estimate: ~4 chars ≈ 1 token
const MAX_CHARS = 3500 * 4; // ~3.5k tokens target


export function chunkText(text) {
    if (!text) return [];
    // Prefer splitting on headings first
    const blocks = text.split(/\n(?=#[^\n]*\n)|\n\n+/);
    const chunks = [];
    let buf = '';


    for (const b of blocks) {
        const piece = b.trim();
        if (!piece) continue;
        if ((buf + '\n\n' + piece).length > MAX_CHARS) {
            if (buf) chunks.push(buf.trim());
            if (piece.length > MAX_CHARS) {
                for (let i = 0; i < piece.length; i += MAX_CHARS) {
                    chunks.push(piece.slice(i, i + MAX_CHARS));
                }
                buf = '';
            } else {
                buf = piece;
            }
        } else {
            buf = buf ? buf + '\n\n' + piece : piece;
        }
    }
    if (buf) chunks.push(buf.trim());
    return chunks;
}