export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function requiredString(value, field, { min = 1, max = 255 } = {}) {
  const text = String(value ?? '').trim();
  if (text.length < min || text.length > max) {
    throw new HttpError(422, `El campo ${field} es obligatorio o no tiene una longitud válida.`);
  }
  return text;
}

export function optionalString(value, max = 255) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (text.length > max) {
    throw new HttpError(422, 'Uno de los campos de texto supera la longitud permitida.');
  }
  return text;
}

export function parseInteger(value, field, { min = null, max = null } = {}) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(422, `El campo ${field} debe ser un número entero.`);
  }
  if (min !== null && parsed < min) {
    throw new HttpError(422, `El campo ${field} debe ser mayor o igual a ${min}.`);
  }
  if (max !== null && parsed > max) {
    throw new HttpError(422, `El campo ${field} debe ser menor o igual a ${max}.`);
  }
  return parsed;
}

export function parseNumber(value, field, { min = null, max = null } = {}) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    throw new HttpError(422, `El campo ${field} debe ser un número válido.`);
  }
  if (min !== null && parsed < min) {
    throw new HttpError(422, `El campo ${field} debe ser mayor o igual a ${min}.`);
  }
  if (max !== null && parsed > max) {
    throw new HttpError(422, `El campo ${field} debe ser menor o igual a ${max}.`);
  }
  return parsed;
}

export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function optionalIsoDate(value, field) {
  if (!value) return null;
  if (!isValidIsoDate(value)) {
    throw new HttpError(422, `El campo ${field} debe tener formato AAAA-MM-DD.`);
  }
  return value;
}
