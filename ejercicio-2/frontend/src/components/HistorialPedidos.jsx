import { Alert, ListGroup, ListGroupItem } from "reactstrap";

const dinero = (valor) =>
  new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
  }).format(valor);

const fecha = (valor) =>
  new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(valor));

export default function HistorialPedidos({ pedidos, cargando, error }) {
  return (
    <aside className="tray last-orders" aria-label="Historial de pedidos">
      <h2>Tus últimos pedidos</h2>
      <p className="text-secondary">
        Tus reservas confirmadas, más recientes primero.
      </p>
      {cargando && <p role="status">Cargando pedidos...</p>}
      {error && <Alert color="warning">{error}</Alert>}
      {!cargando && !error && pedidos.length === 0 && (
        <p className="empty">Todavía no tenés pedidos confirmados.</p>
      )}
      <ListGroup flush>
        {pedidos.map((pedido) => (
          <ListGroupItem key={pedido.id}>
            <h3>Pedido #{pedido.id}</h3>
            <p className="text-secondary">
              <time dateTime={pedido.fecha}>{fecha(pedido.fecha)}</time>
            </p>
            {pedido.items.map((item) => (
              <p key={item.id}>
                {item.nombre}
                <br />
                {dinero(item.precio)} × {item.cantidad} ={" "}
                <strong>{dinero(item.subtotal)}</strong>
              </p>
            ))}
            <div className="tray-total">
              <span>Total del pedido</span>
              <strong>{dinero(pedido.total)}</strong>
            </div>
          </ListGroupItem>
        ))}
      </ListGroup>
    </aside>
  );
}
