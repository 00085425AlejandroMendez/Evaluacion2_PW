export function manejarError(err, req, res, next) {
  const status = err.status === 400 ? 400 : 500;
  res.status(status).json({ error: status === 400 ? 'JSON inválido' : 'Error del servidor' });
}
