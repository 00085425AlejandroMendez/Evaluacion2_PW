import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'node:url';
import { crearRutasReserva } from './routes/reserva.routes.js';
import { manejarError } from './utils/http.js';

export function createApp(options = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', crearRutasReserva(options));
  app.use(manejarError);
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3002;
  createApp().listen(port, () => {
    console.log(`Servidor disponible en http://localhost:${port}`);
  });
}
