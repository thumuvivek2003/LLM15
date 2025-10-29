// utils/chunk.js

/** naive splitter by characters; swap for token-based if you prefer */
export function splitIntoChunks(text, size = 800, overlap = 120) {
  const parts = [];
  if (!text) return parts;
  let i = 0, idx = 0;
  while (i < text.length) {
    const slice = text.slice(i, i + size);
    parts.push({ idx: idx++, text: slice });
    i += Math.max(1, size - overlap);
  }
  return parts;
}
