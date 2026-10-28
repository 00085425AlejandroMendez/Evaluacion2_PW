export const cantidadValida = (cantidad) =>
  Number.isSafeInteger(cantidad) && cantidad > 0;

export function precioCentavos(menu, id) {
  return Math.round(menu.find((plato) => plato.id === id).precio * 100);
}

export function totalCentavos(menu, items) {
  return items.reduce(
    (total, item) => total + precioCentavos(menu, item.id) * item.cantidad,
    0,
  );
}

export function crearPedido(id, fecha, menu, items) {
  return {
    id,
    fecha: new Date(fecha).toISOString(),
    items: items.map((item) => {
      const plato = menu.find((plato) => plato.id === item.id);
      return {
        id: item.id,
        nombre: plato.nombre,
        precio: plato.precio,
        cantidad: item.cantidad,
        subtotal: (precioCentavos(menu, item.id) * item.cantidad) / 100,
      };
    }),
    total: totalCentavos(menu, items) / 100,
  };
}
