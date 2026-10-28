import { crearMenu } from '../utils/menu.js';
import { cantidadValida, precioCentavos, totalCentavos, crearPedido } from '../utils/reserva.js';
import { error } from '../utils/http.js';

export function crearControladorReserva({
  now = Date.now,
  durationMs = Number(process.env.RESERVA_MS) || 300000,
} = {}) {
  const menu = crearMenu();
  const pedidos = [];
  let presupuesto = 2500;
  let items = [];
  let estado = 'activa';
  let venceEn = now() + durationMs;

  function reserva() {
    const total = totalCentavos(menu, items);
    return {
      saldo: (presupuesto - (estado === 'activa' ? total : 0)) / 100,
      itemsReservados: items,
      total: total / 100,
      estado,
      venceEn,
      servidorAhora: now(),
    };
  }

  function verificarExpiracion(req, res, next) {
    if (estado === 'activa' && now() >= venceEn) {
      items.forEach((item) => {
        menu.find((plato) => plato.id === item.id).stock += item.cantidad;
      });
      items = [];
      estado = 'expirada';
    }
    next();
  }

  function activa(res) {
    if (estado !== 'activa') {
      error(res, 409, estado === 'expirada'
        ? 'La reserva expiró. Iniciá una nueva reserva.'
        : 'La reserva ya fue confirmada. Iniciá una nueva reserva.');
      return false;
    }
    return true;
  }

  function cambiarCantidad(res, plato, item, cantidad) {
    const diferencia = cantidad - (item?.cantidad || 0);
    if (diferencia > plato.stock) return error(res, 400, 'Stock insuficiente');
    if (totalCentavos(menu, items) + precioCentavos(menu, plato.id) * diferencia > presupuesto) {
      return error(res, 400, 'Saldo insuficiente para esta cantidad');
    }
    plato.stock -= diferencia;
    if (item) item.cantidad = cantidad;
    else items.push({ id: plato.id, cantidad });
    return res.json(reserva());
  }

  const obtenerMenu = (req, res) => res.json(menu);
  const obtenerReserva = (req, res) => res.json(reserva());
  const obtenerPedidos = (req, res) => res.json([...pedidos].reverse());

  function agregar(req, res) {
    if (!activa(res)) return;
    const { alimentoId, cantidad } = req.body || {};
    if (!cantidadValida(alimentoId) || !cantidadValida(cantidad)) {
      return error(res, 400, 'ID y cantidad deben ser enteros positivos');
    }
    const plato = menu.find((plato) => plato.id === alimentoId);
    if (!plato) return error(res, 404, 'Alimento no encontrado');
    const item = items.find((item) => item.id === alimentoId);
    return cambiarCantidad(res, plato, item, (item?.cantidad || 0) + cantidad);
  }

  function actualizarPorciones(req, res) {
    if (!activa(res)) return;
    const id = Number(req.params.id);
    const cantidad = req.body?.cantidad;
    if (!cantidadValida(cantidad)) return error(res, 400, 'La cantidad debe ser un entero positivo');
    const item = items.find((item) => item.id === id);
    if (!item) return error(res, 404, 'Alimento no reservado');
    return cambiarCantidad(res, menu.find((plato) => plato.id === id), item, cantidad);
  }

  function eliminar(req, res) {
    if (!activa(res)) return;
    const id = Number(req.params.id);
    const item = items.find((item) => item.id === id);
    if (!item) return error(res, 404, 'Alimento no reservado');
    menu.find((plato) => plato.id === id).stock += item.cantidad;
    items = items.filter((item) => item.id !== id);
    return res.json(reserva());
  }

  function confirmar(req, res) {
    if (!activa(res)) return;
    if (!items.length) return error(res, 400, 'Agregá un alimento antes de confirmar');
    const pedido = crearPedido(pedidos.length + 1, now(), menu, items);
    presupuesto -= totalCentavos(menu, items);
    estado = 'confirmada';
    pedidos.push(pedido);
    return res.json(reserva());
  }

  function nueva(req, res) {
    if (estado === 'activa') return error(res, 409, 'La reserva actual sigue activa');
    items = [];
    estado = 'activa';
    venceEn = now() + durationMs;
    return res.json(reserva());
  }

  return {
    verificarExpiracion, obtenerMenu, obtenerReserva, obtenerPedidos,
    agregar, actualizarPorciones, eliminar, confirmar, nueva,
  };
}
