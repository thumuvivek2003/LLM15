// api.js — frontend API helpers aligned with the new backend

const BASE =  'http://localhost:5050';

// ---- Docs ----

export async function listDocs() {
  const r = await fetch(`${BASE}/api/docs`);
  if (!r.ok) throw new Error(`List failed: ${r.status}`);
  return r.json();
}

/**
 * NOTE: Backend currently does NOT implement DELETE /api/docs/:id.
 * This will 404 unless you add that route.
 */
export async function deleteDoc(id) {
  const r = await fetch(`${BASE}/api/docs/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`Delete failed: ${await r.text()}`);
  return r.json();
}

export async function uploadPdf(file, { chunkSize = 800, overlap = 120 } = {}) {
  const fd = new FormData();
  fd.append('file', file);
  const url = new URL(`${BASE}/api/docs/ingest`);
  url.searchParams.set('chunkSize', String(chunkSize));
  url.searchParams.set('overlap', String(overlap));

  const r = await fetch(url, { method: 'POST', body: fd });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/** Debug/preview helper to see indexed chunks */
export async function getChunks(docId, limit = 20) {
  const url = new URL(`${BASE}/api/docs/${docId}/chunks`);
  url.searchParams.set('limit', String(limit));
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Get chunks failed: ${r.status}`);
  return r.json();
}

// ---- QA ----

/**
 * Ask a question against all docs or a specific doc.
 * @param {string} question
 * @param {object} [opts]
 * @param {string} [opts.docId] - optional: restrict to a single doc
 * @param {number} [opts.k=6]   - how many chunks to feed the LLM
 */
export async function ask(question, { docId, k = 6 } = {}) {
  const body = { query: question, k };
  if (docId) body.docId = docId;

  const r = await fetch(`${BASE}/api/qa/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
