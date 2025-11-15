# 🚀 LLM 25 - Don't forget to star repo ⭐⭐⭐⭐⭐

1. **Clone the repo**

   ```bash
   git clone https://github.com/thumuvivek2003/LLM15
   cd LLM15
   ```

2. **Create `.env`**

   ```bash
   cp .example.env .env
   ```

   Add your Google API key or GPT API keys and other env variables here.

3. **Select the frontend project**
   Edit `Frontend/App.tsx`

   * Comment out the current import and render.
   * Uncomment the project you want to run.

4. **Select the backend project**
   Edit `Backend/index.js`

   * Comment out the current import.
   * Uncomment the required backend file.

5. **Start frontend**

   ```bash
   npm run dev
   ```

6. **Start backend**

   ```bash
   nodemon index.js
   ```

   or

   ```bash
   node index.js
   ```

---

Short, clean, and to the point.





| S.No | Topic                     | Description                                                                                 | Learning Outcomes                                                                   |
| ---: | ------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
|    1 | Chat UI “Hello LLM”       | Minimal React chatbox calling an LLM API via a Node/Express proxy.                          | API keys & proxies, fetch with streaming (SSE), React state, basic prompt design.   |
|    2 | Prompt Playground         | Web app to tweak system/user prompts and temperature/top-p; save presets in MongoDB.        | Prompt engineering basics, schema for experiments, form handling, persistence.      |
|    3 | Summarize Webpage         | Paste a URL → server fetches HTML, cleans text, LLM summarizes with bullet options.         | Server-side scraping, text cleaning, token budgeting, concise prompting.            |
|    4 | Markdown Notes TL;DR      | Upload .md/.txt; chunk and summarize; produce meeting minutes or briefs.                    | Chunking, map-reduce prompts, file uploads, secure storage, rate limiting.          |
|    5 | Q&A Over PDF (RAG v1)     | Upload PDFs; build simple embeddings store in MongoDB; answer questions with cite snippets. | Embeddings, cosine similarity, retrieval → prompt injection defense, citations UX.  |
|    6 | Semantic Search UI        | Search bar over your uploaded docs with “semantic” results + highlights.                    | Vector indexes, scoring, pagination, React results list, eval of retrieval quality. |
|    7 | Multi-doc Chat (RAG v2)   | Chat that references multiple docs, sources panel, follow-up questions.                     | Query rewriting, multi-hop retrieval, conversation memory, streaming UI polish.     |
|    8 | Function Calling Demo     | Let the model call weather/math/calendar functions exposed by Express.                      | JSON tool schemas, validation (Zod/TypeScript), safe tool execution, guardrails.    |
|    9 | Email Draft Assistant     | OAuth to a demo Gmail account; generate replies with style/length toggles.                  | OAuth flows, PII handling, few-shot style prompts, post-processing & disclaimers.   |
|   10 | Image Alt-Text Generator  | Upload images, get alt text & captions; store results for reuse.                            | Multimodal prompting, batching jobs, accessibility focus, Mongo schema design.      |
|   11 | Chat with Postgres Data   | Mirror some tabular data to Mongo + pgvector (or Atlas Vector); natural-language SQL.       | Hybrid retrieval (text + table), structured outputs, SQL safety, latency tuning.    |
|   12 | Team Prompt Library       | Workspace, roles, shared prompts/snippets with versioning and approvals.                    | Multi-user auth (JWT), RBAC, schema versioning, audit logs, org-level UX.           |
|   13 | RAG with Re-rankers       | Add a cross-encoder/LLM re-rank step; compare NDCG/Recall in a small eval page.             | Two-stage retrieval, eval metrics, A/B testing, cost/latency trade-offs.            |
|   14 | Guardrails & Moderation   | Pipeline for toxicity/PII checks, prompt/response sanitization, red-teaming page.           | Policy prompts, deterministic filters, retry strategies, incident logging.          |
|   15 | Long-Context Chat         | Sliding-window memory with conversation summary notes stored per thread.                    | Summarization memory, token windows, recap prompts, UX for memory visibility.       |