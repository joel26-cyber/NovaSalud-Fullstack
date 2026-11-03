import multer from 'multer';
import { HttpError } from '../utils/http.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Ruta de la API no encontrada.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen supera el tamaño máximo de 2 MB.'
      : 'No se pudo procesar el archivo enviado.';
    return res.status(422).json({ message });
  }

  if (error?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos. Verifica el código o número de lote.' });
  }

  if (error?.code === 'ER_NO_REFERENCED_ROW_2' || error?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'El registro está relacionado con otros datos y no se puede completar la operación.' });
  }

  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) {
    console.error('[API]', error);
  }

  const message = status >= 500
    ? 'Ocurrió un error interno. Inténtalo nuevamente.'
    : error.message;

  return res.status(status).json({
    message,
    ...(error.details ? { details: error.details } : {}),
  });
}
