import { Type } from '@google/genai';

export const SYSTEM_PROMPT = [
    'You are a careful assistant that can use the following tools:',
    '- web_fetch: fetches webpage contents',
    '- db_query: queries database entries',
    '- email_send: sends plain text emails',
    'Use tools only when required, and keep your explanations concise.',
].join('\n');

export const ALLOWED_TOOLS = new Set(['web_fetch', 'db_query', 'email_send']);

export const functionDeclarations = [
    {
        name: 'web_fetch',
        description: 'Fetches data from a given URL.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                url: { type: Type.STRING, description: 'The URL to fetch content from.' },
                method: {
                    type: Type.STRING,
                    enum: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
                    description: 'HTTP method to use for the fetch request.',
                },
                headers: {
                    type: Type.OBJECT,
                    additionalProperties: { type: Type.STRING },
                    description: 'Optional headers to include.',
                },
            },
            required: ['url'],
        },
    },
    {
        name: 'db_query',
        description: 'Queries MongoDB with filters and optional limit.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                find: { type: Type.OBJECT, description: 'MongoDB-style filter.' },
                limit: { type: Type.NUMBER, description: 'Max documents to return.' },
            },
        },
    },
    {
        name: 'email_send',
        description: 'Sends a plain text email message.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                to: { type: Type.STRING, description: 'Recipient email address.' },
                subject: { type: Type.STRING, description: 'Subject line.' },
                text: { type: Type.STRING, description: 'Email body text.' },
            },
            required: ['to', 'subject', 'text'],
        },
    },
];

export const tools = [{ functionDeclarations }];
