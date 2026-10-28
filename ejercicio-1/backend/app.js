import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'node:url';
import { crearRutasJuego } from './routes/juego.routes.js';
import { manejarError } from './utils/http.js';

export function createApp(options = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(crearRutasJuego(options));
  app.use(manejarError);
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3001;
  createApp().listen(port, () => {
    console.log(`Servidor disponible en http://localhost:${port}`);
  });
}
