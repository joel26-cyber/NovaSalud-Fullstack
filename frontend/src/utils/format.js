export const CURRENCY = 'S/';

export function money(value) {
  const number = Number(value || 0);
  return `${CURRENCY} ${number.toFixed(2)}`;
}

export function number(value) {
  return new Intl.NumberFormat('es-PE').format(Number(value || 0));
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

export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function firstDayOfMonth() {
  return `${todayIso().slice(0, 8)}01`;
}

export function ucfirst(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

export function methodLabel(value) {
  return ucfirst(value || 'efectivo');
}
