import { Router } from 'express';
import { crearControladorReserva } from '../controllers/reserva.controller.js';

export function crearRutasReserva(options) {
  const router = Router();
  const reserva = crearControladorReserva(options);
  router.use(reserva.verificarExpiracion);
  router.get('/menu', reserva.obtenerMenu);
  router.get('/reserva', reserva.obtenerReserva);
  router.get('/pedidos', reserva.obtenerPedidos);
  router.post('/reserva/agregar', reserva.agregar);
  router.put('/reserva/actualizar-porciones/:id', reserva.actualizarPorciones);
  router.delete('/reserva/eliminar/:id', reserva.eliminar);
  router.post('/reserva/confirmar', reserva.confirmar);
  router.post('/reserva/nueva', reserva.nueva);
  return router;
}
