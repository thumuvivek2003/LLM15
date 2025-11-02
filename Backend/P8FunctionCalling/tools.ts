import { randomInt } from 'crypto';
import { WeatherArgs, AddArgs, MultiplyArgs, ListEventsArgs, CreateEventArgs, DeleteEventArgs } from './types.ts';


// In-memory calendar
type Event = { id: string; title: string; date: string; time: string; location?: string };
const calendar: Record<string, Event> = {};


function uid() { return Math.random().toString(36).slice(2, 10); }


export async function getWeather(args: WeatherArgs) {
    // deterministic fake weather by hashing location
    const seed = Array.from(args.location).reduce((a, c) => a + c.charCodeAt(0), 0);
    const temp = 18 + (seed % 15); // 18-32 C
    const conds = ['Sunny', 'Cloudy', 'Partly cloudy', 'Rain', 'Thunderstorms'];
    const cond = conds[seed % conds.length];
    const when = args.date || 'today';
    return { location: args.location, when, celsius: temp, condition: cond };
}


export async function add(args: AddArgs) { return { result: args.a + args.b }; }
export async function multiply(args: MultiplyArgs) { return { result: args.a * args.b }; }


export async function listEvents(args: ListEventsArgs) {
    const list = Object.values(calendar).filter(e => !args.date || e.date === args.date);
    return { events: list };
}


export async function createEvent(args: CreateEventArgs) {
    const id = uid();
    const ev = { id, ...args };
    calendar[id] = ev;
    return { ok: true, event: ev };
}


export async function deleteEvent(args: DeleteEventArgs) {
    const ok = !!calendar[args.id];
    delete calendar[args.id];
    return { ok };
}