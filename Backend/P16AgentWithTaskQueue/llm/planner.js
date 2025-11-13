import { GoogleGenAI } from '@google/genai';
import { ALLOWED_TOOLS, SYSTEM_PROMPT, tools } from './guardrails.js';
import { webFetchArgs, dbQueryArgs, emailSendArgs } from './types.js';
import * as impl from './tools.js';

// ──────────────────────────────────────────────
// 1️⃣ Initialize Gemini
// ──────────────────────────────────────────────
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// ──────────────────────────────────────────────
// 2️⃣ Config: attach tools and temperature
// ──────────────────────────────────────────────
const config = {
  tools,
  generationConfig: { temperature: 0 },
};

// ──────────────────────────────────────────────
// 3️⃣ Zod validators per tool
// ──────────────────────────────────────────────
const validators = {
  web_fetch: webFetchArgs,
  db_query: dbQueryArgs,
  email_send: emailSendArgs,
};

// ──────────────────────────────────────────────
// 4️⃣ Execute tool safely (with validation + timeout)
// ──────────────────────────────────────────────
async function execTool(name, args) {
  if (!ALLOWED_TOOLS.has(name)) throw new Error('Tool not allowed');
  const schema = validators[name];
  if (!schema) throw new Error('No validator for tool');
  const parsed = schema.parse(args);
  const fn = impl[name];

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 5000); // 5s safety guard

  try {
    const res = await fn({ args: parsed });
    return res;
  } finally {
    clearTimeout(to);
  }
}

// ──────────────────────────────────────────────
// 5️⃣ Main Runner Function
// ──────────────────────────────────────────────
export async function planWithGemini(messages) {
  console.log(messages);
  // Convert to Gemini contents
  const contents = messages.goal;

  const toolLog = [];
  const currentContents = [...contents];

  // ── First model response ─────────────────────
  const firstResponse = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config,
  });
  console.log(firstResponse);
  return firstResponse;

  const cand = firstResponse.candidates?.[0];
  const parts = cand?.content?.parts || [];
  const calls = parts.map(p => p.functionCall).filter(Boolean);
  const txt = parts
    .filter(p => typeof p?.text === 'string')
    .map(p => p.text)
    .join('');

  // ── If Gemini called a tool ──────────────────
  if (calls?.length) {
    for (const call of calls) {
      const name = call.name;
      const args = call.args || {};
      let result;
      try {
        result = await execTool(name, args);
      } catch (e) {
        result = { error: String(e.message || e) };
      }
      toolLog.push({ name, args, result });
    }

    // Prepare tool responses for Gemini
    const toolResponses = toolLog.map(t => ({
      role: 'tool',
      parts: [
        {
          functionResponse: {
            name: t.name,
            response: t.result,
          },
        },
      ],
    }));

    // Add both the model’s function call and tool responses to context
    currentContents.push({ role: 'model', parts: parts.filter(p => p.functionCall) });
    currentContents.push(...toolResponses);

    // ── Second Gemini response (after tool results) ─────────────
    const secondResponse = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: currentContents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const finalTxt =
      secondResponse?.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';

    return { text: finalTxt, tools: toolLog };
  }

  // ── No tools used ─────────────────────────────
  return { text: txt, tools: toolLog };
}
