import { z } from 'zod';


export const WeatherArgs = z.object({
    location: z.string().min(2).max(80),
    date: z.string().optional() // ISO date or "today"
});
export type WeatherArgs = z.infer<typeof WeatherArgs>;


export const AddArgs = z.object({ a: z.number(), b: z.number() });
export type AddArgs = z.infer<typeof AddArgs>;


export const MultiplyArgs = z.object({ a: z.number(), b: z.number() });
export type MultiplyArgs = z.infer<typeof MultiplyArgs>;


export const ListEventsArgs = z.object({ date: z.string().optional() });
export type ListEventsArgs = z.infer<typeof ListEventsArgs>;


export const CreateEventArgs = z.object({
    title: z.string().min(1).max(140),
    date: z.string(), // YYYY-MM-DD
    time: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
    location: z.string().max(120).optional()
});
export type CreateEventArgs = z.infer<typeof CreateEventArgs>;


export const DeleteEventArgs = z.object({ id: z.string().min(1) });
export type DeleteEventArgs = z.infer<typeof DeleteEventArgs>;


export type ToolName = 'getWeather' | 'add' | 'multiply' | 'listEvents' | 'createEvent' | 'deleteEvent';