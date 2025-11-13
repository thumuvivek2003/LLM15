import { Type } from '@google/genai';
import mongoose from 'mongoose';
import { z } from 'zod';

// ------------------------------
// MongoDB Schema & Model
// ------------------------------
const DemoSchema = new mongoose.Schema(
  { email: String, name: String, lastOrderTotal: Number },
  { collection: 'demo_users' }
);
const Demo = mongoose.models.Demo || mongoose.model('Demo', DemoSchema);

// ------------------------------
// Tool Implementation
// ------------------------------
export async function tool_dbQuery({ args }) {
  const { find = {}, limit = 5 } = args;

  // Cap limit at 50 to prevent over-fetching
  const rows = await Demo.find(find).limit(Math.min(50, limit));

  return {
    kind: 'db',
    count: rows.length,
    rows: rows.map(r => ({
      email: r.email,
      name: r.name,
      lastOrderTotal: r.lastOrderTotal,
    })),
  };
}

// ------------------------------
// Zod Schemas
// ------------------------------
export const dbQuerySchema = z.object({
  find: z
    .record(z.any())
    .optional()
    .describe('MongoDB-style query filter object used to find documents.'),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(5)
    .describe('Maximum number of documents to return (1–50). Default: 5.'),
});

export const dbResponseSchema = z.object({
  kind: z.literal('db').describe('Indicates this result is from the database query tool.'),
  count: z.number().describe('Number of documents returned.'),
  rows: z
    .array(
      z.object({
        email: z.string().nullable(),
        name: z.string().nullable(),
        lastOrderTotal: z.number().nullable(),
      })
    )
    .describe('Array of retrieved database rows.'),
});

// ------------------------------
// Gemini Function Declaration
// ------------------------------
export const dbQueryFunctionDeclaration = {
  name: 'db_query',
  description: 'Performs a database lookup with optional filters and limit.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      find: {
        type: Type.OBJECT,
        description: 'MongoDB-style query filter object used to find documents.',
      },
      limit: {
        type: Type.NUMBER,
        description: 'Maximum number of documents to return (1–50). Default: 5.',
      },
    },
    required: [],
  },
};
