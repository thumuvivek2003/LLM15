import {  GoogleGenAI } from '@google/genai';
import { ALLOWED_TOOLS, SYSTEM_PROMPT, tools } from './guardrails.ts';
import { WeatherArgs, AddArgs, MultiplyArgs, ListEventsArgs, CreateEventArgs, DeleteEventArgs } from './types.ts';
import * as impl from './tools.ts';
import { z } from 'zod';


const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const config = {
    tools,
    generationConfig: { temperature: 0 },
};



// Zod validators per tool
const validators: Record<string, z.ZodTypeAny> = {
    getWeather: WeatherArgs,
    add: AddArgs,
    multiply: MultiplyArgs,
    listEvents: ListEventsArgs,
    createEvent: CreateEventArgs,
    deleteEvent: DeleteEventArgs
};


// Execute a single tool call safely
async function execTool(name: string, args: unknown) {
    if (!ALLOWED_TOOLS.has(name)) throw new Error('Tool not allowed');
    const schema = validators[name];
    if (!schema) throw new Error('No validator for tool');
    const parsed = schema.parse(args);
    const fn = (impl as any)[name];
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 5_000); // 5s guard
    try {
        const res = await fn(parsed);
        return res;
    } finally { clearTimeout(to); }
}


export async function runWithTools(messages: { role: 'user' | 'model' | 'tool'; content: string }[]) {

    // Convert messages to Gemini "contents" format
    // Roles need to be 'user' or 'model' for the first generateContent call
    const contents = [
        // System instructions are best handled via the systemInstruction parameter
        // If SYSTEM_PROMPT is meant as a user message, keep it this way
        ...messages.map(m => ({
            role: (m.role === 'model' || m.role === 'tool') ? 'model' : 'user', // Map roles correctly for the initial prompt
            parts: [{ text: m.content }]
        }))
    ];

    let toolLog: any[] = [];
    let currentContents = [...contents]; // Keep track of conversation history

    // One or two rounds generally suffice for this demo
    const firstResponse = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config,
    });


    const cand = firstResponse.candidates?.[0];
    const parts = cand?.content?.parts || [];
    const calls = parts.map((p: any) => p.functionCall).filter(Boolean);
    const txt = parts
        .filter((p: any) => typeof p?.text === 'string')
        .map((p: any) => p.text as string)
        .join('');


    if (calls?.length) {
        // Model requested a tool call
        for (const call of calls) {
            const name = call.name as string;
            const args = call.args || {};
            let result: any;
            try {
                result = await execTool(name, args);
            } catch (e: any) {
                result = { error: String(e.message || e) };
            }
            toolLog.push({ name, args, result });
        }

        // Prepare the tool responses in the correct format for the next turn
        const toolResponses = toolLog.map(t => ({
            role: 'tool',
            parts: [{
                functionResponse: {
                    name: t.name,
                    response: t.result
                }
            }]
        }));

        // Add the model's function call and the tool's response to the history
        currentContents.push({ role: 'model', parts: parts.filter((p: any) => p.functionCall) });
        currentContents.push(...toolResponses as any);

        // Call the model again with the updated history
        const secondResponse = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: currentContents,
            config: {
                systemInstruction: SYSTEM_PROMPT,
            }
        });
        const txt = secondResponse?.candidates?.[0]?.content?.parts?.map(p => p.text ?? "").join("") ?? "";
        return { text: txt, tools: toolLog };
    }

    // No tool calls, just text
    return { text: txt, tools: toolLog };
}