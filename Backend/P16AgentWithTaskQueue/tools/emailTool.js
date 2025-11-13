import { Type } from '@google/genai';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// ------------------------------
// Email Transport Setup
// ------------------------------
// In production: replace with real SMTP settings
const transport = nodemailer.createTransport({ jsonTransport: true });

// ------------------------------
// Tool Implementation
// ------------------------------
export async function tool_sendEmail({ args }) {
  const { to, subject, text } = args;
  const msg = { from: process.env.EMAIL_FROM || 'noreply@example.com', to, subject, text };

  const info = await transport.sendMail(msg);

  return {
    kind: 'email',
    id: info.messageId || 'stub',
    preview: `${to} · ${subject}`,
  };
}

// ------------------------------
// Zod Schemas
// ------------------------------
export const emailSendSchema = z.object({
  to: z.string().email().describe('Recipient email address.'),
  subject: z.string().min(1).describe('Subject line of the email.'),
  text: z.string().min(1).describe('Plain text body of the email message.'),
});

export const emailResponseSchema = z.object({
  kind: z.literal('email').describe('Indicates this result is from an email tool.'),
  id: z.string().describe('Unique ID of the sent email message.'),
  preview: z
    .string()
    .describe('Short preview string showing the recipient and subject.'),
});

// ------------------------------
// Gemini Function Declaration
// ------------------------------
export const emailSendFunctionDeclaration = {
  name: 'email_send',
  description:
    'Sends a plain text email to a recipient with a specified subject and message body.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      to: {
        type: Type.STRING,
        description: 'Recipient email address.',
      },
      subject: {
        type: Type.STRING,
        description: 'Subject line of the email.',
      },
      text: {
        type: Type.STRING,
        description: 'Plain text body of the email message.',
      },
    },
    required: ['to', 'subject', 'text'],
  },
};
