import { env } from '../config/env.js';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: env.timezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function todayIso() {
  return dateFormatter.format(new Date());
}

export function isoToDisplay(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function isoToDisplayDateTime(value) {
  if (!value) return '—';
  const text = String(value).replace('T', ' ');
  const date = text.slice(0, 10);
  const time = text.slice(11, 16);
  return `${isoToDisplay(date)}${time ? ` ${time}` : ''}`;
}

export function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function lastNDays(count) {
  const today = todayIso();
  return Array.from({ length: count }, (_, index) => {
    const iso = addDaysIso(today, index - (count - 1));
    return { iso, label: isoToDisplay(iso).slice(0, 5) };
  });
}

export function timestampForFile() {
  const now = new Date();
  const pad = (number) => String(number).padStart(2, '0');
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now).replaceAll('-', '');
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: env.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now).replaceAll(':', '');
  return `${date}_${pad(time)}`;
}

export function saleNumber() {
  const now = new Date();
  const stamp = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(now)
    .replaceAll('-', '')
    .replaceAll(', ', '-')
    .replaceAll(':', '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `V-${stamp}-${random}`;
}
