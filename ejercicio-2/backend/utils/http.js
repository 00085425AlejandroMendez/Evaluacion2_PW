export const error = (res, status, message) => res.status(status).json({ error: message });

export function manejarError(err, req, res, next) {
  const status = err.status === 400 ? 400 : 500;
  error(res, status, status === 400 ? 'JSON inválido' : 'Error del servidor');
}
