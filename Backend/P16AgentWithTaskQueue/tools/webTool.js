// ------------------------------
// Imports
// ------------------------------
import { Type } from '@google/genai';
import fetch from 'node-fetch';
import { z } from 'zod';

// ------------------------------
// Tool Implementation
// ------------------------------
export async function tool_webFetch({ args }) {
    const { url, method = 'GET', headers = {} } = args;

    const response = await fetch(url, {
        method,
        headers: {
            'User-Agent': 'AgentDemo/1.0',
            ...headers,
        },
    });

    const text = await response.text();
    const preview = text.slice(0, 400);

    return {
        kind: 'web',
        status: response.status,
        preview,
        length: text.length,
    };
}

// ------------------------------
// Zod Schemas
// ------------------------------
export const webQuerySchema = z.object({
    url: z.string().url().describe('The URL to fetch content from.'),
    method: z
        .enum(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'])
        .default('GET')
        .describe('HTTP method to use for the fetch request.'),
    headers: z
        .record(z.string())
        .optional()
        .describe('Optional HTTP headers to include with the request.'),
});

export const webResponseSchema = z.object({
    kind: z.literal('web').describe('Indicates this is a web fetch result.'),
    status: z.number().describe('HTTP status code returned by the fetch request.'),
    preview: z.string().describe('First 400 characters of the fetched page content.'),
    length: z.number().describe('Total length of the fetched text in characters.'),
});

// ------------------------------
// Google GenAI Function Declaration
// ------------------------------
export const webFetchFunctionDeclaration = {
    name: 'web_fetch',
    description: 'Fetches data from a given URL, optionally with HTTP method and headers.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            url: {
                type: Type.STRING,
                description: 'The URL to fetch content from.',
            },
            method: {
                type: Type.STRING,
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
                description: 'HTTP method to use for the fetch request (default: GET).',
            }
        },
        required: ['url'],
    },
};
