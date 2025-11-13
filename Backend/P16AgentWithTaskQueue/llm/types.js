import { z } from 'zod';

// 🌐 web_fetch
export const webFetchArgs = z.object({
    url: z.string().url().describe('The URL to fetch content from.'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']).default('GET'),
    headers: z.record(z.string()).optional(),
});

// 🗄️ db_query
export const dbQueryArgs = z.object({
    find: z.record(z.any()).optional(),
    limit: z.number().min(1).max(50).default(5),
});

// 📧 email_send
export const emailSendArgs = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    text: z.string().min(1),
});
