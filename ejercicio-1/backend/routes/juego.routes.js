import { Router } from 'express';
import { crearControladorJuego } from '../controllers/juego.controller.js';

export function crearRutasJuego(options) {
  const router = Router();
  const juego = crearControladorJuego(options);
  router.post('/guess', juego.intentar);
  router.post('/reset', juego.reiniciar);
  return router;
}
