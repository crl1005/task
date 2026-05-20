import { CalEvent, PALETTE, START_HOUR, END_HOUR, HOUR_HEIGHT } from "./types";

const PH_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getPHDateParts(date: Date) {
  const ph = new Date(date.getTime() + PH_OFFSET_MS);
  return {
    year: ph.getUTCFullYear(),
    month: ph.getUTCMonth(),
    day: ph.getUTCDate(),
    dow: ph.getUTCDay(),
    hours: ph.getUTCHours(),
    minutes: ph.getUTCMinutes(),
    seconds: ph.getUTCSeconds(),
  };
}

export function getWeekStart(date: Date): Date {
  const parts = getPHDateParts(date);
  const sundayUtc = Date.UTC(parts.year, parts.month, parts.day, 0, 0, 0) - PH_OFFSET_MS - parts.dow * DAY_MS;
  return new Date(sundayUtc);
}

export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * DAY_MS);
}

export function toDateStr(date: Date): string {
  const parts = getPHDateParts(date);
  return `${parts.year}-${String(parts.month + 1).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function fromDateStr(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - PH_OFFSET_MS);
}

export function fmtHour(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const disp = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${disp}${min ? ":" + String(min).padStart(2, "0") : ""} ${ampm}`;
}

export function computeLayout(dayEvents: CalEvent[]): Map<string, { left: number; width: number }> {
  const map = new Map<string, { left: number; width: number }>();
  dayEvents.forEach((ev) => {
    const group = dayEvents.filter((o) => o.startHour < ev.endHour && o.endHour > ev.startHour);
    const slot = group.indexOf(ev);
    map.set(ev.id, { left: slot / group.length, width: 1 / group.length });
  });
  return map;
}

export function makeSampleEvents(weekStart: Date): CalEvent[] {
  const events: CalEvent[] = [];
  let counter = 0;
  function add(dow: number, title: string, start: number, end: number, pi: number) {
    events.push({ id: `s${counter++}`, title, startHour: start, endHour: end, color: PALETTE[pi].bg, lightColor: PALETTE[pi].light, date: toDateStr(addDays(weekStart, dow)) });
  }
  for (let d = 1; d <= 5; d++) {
    add(d, "Yoga with Adriene", 6.5, 7.5, 0);
    add(d, "Shower · Reading · Breakfast", 7.5, 9, 1);
    add(d, "Lunch", 12, 13, 2);
    add(d, "Break", 15, 15.5, 2);
    add(d, "Daily Wind Down", 16, 16.75, 5);
  }
  for (const d of [1, 2, 4, 5]) add(d, "Email & Slack", 9, 9.5, 2);
  add(1, "Team Meeting", 9.5, 10.5, 3); add(1, "Focus cdTime", 10.5, 12, 4); add(1, "Collaboration Time", 13, 15, 1);
  add(2, "Focus Time", 9.5, 11, 4); add(2, "1:1", 11, 12, 0); add(2, "Place Swag Order", 13, 13.5, 2); add(2, "Performance Review", 13.5, 14.5, 3);
  add(3, "Weekly Standup", 9.5, 10.25, 1); add(3, "Admin", 11, 12, 2); add(3, "Focus Time", 13, 15, 4);
  add(4, "Content Planning", 9.5, 10.25, 3); add(4, "Collaboration Time", 10.25, 11.5, 1); add(4, "1:1", 13, 14, 0); add(4, "All-Hands", 14, 15, 3);
  add(5, "Collaboration Time", 10, 12, 1); add(5, "1:1", 13, 13.5, 0);
  add(6, "Pure Barre", 16.33, 17.33, 5);
  return events;
}

export const STORAGE_KEY = "schedule_events_v1";

export function loadEventsFromStorage(): CalEvent[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CalEvent[];
  } catch { return null; }
}

export function saveEventsToStorage(events: CalEvent[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch {}
}

export function getHourOptions(): number[] {
  return Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => START_HOUR + i * 0.5);
}