import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Col,
  ListGroup,
  ListGroupItem,
  Row,
  UncontrolledAlert,
} from "reactstrap";
import { api } from "./services/api";
import HistorialPedidos from "./components/HistorialPedidos";

const dinero = (value) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(
    value,
  );
export default function App() {
  const [menu, setMenu] = useState([]);
  const [reserva, setReserva] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [reloj, setReloj] = useState(Date.now());
  const [desfase, setDesfase] = useState(0);
  const ocupado = useRef(false);
  const consultaInicialPedidos = useRef(null);

  async function actualizarPedidos() {
    setCargandoPedidos(true);
    setErrorPedidos("");
    try {
      setPedidos(await api("/api/pedidos"));
    } catch (err) {
      setErrorPedidos(`No se pudo actualizar el historial: ${err.message}`);
    } finally {
      setCargandoPedidos(false);
    }
  }

  useEffect(() => {
    let montado = true;
    // StrictMode repite el efecto en desarrollo; ambos montajes comparten la petición.
    consultaInicialPedidos.current ??= api("/api/pedidos");
    consultaInicialPedidos.current
      .then((historial) => {
        if (montado) setPedidos(historial);
      })
      .catch((err) => {
        if (montado)
          setErrorPedidos(`No se pudo cargar el historial: ${err.message}`);
      })
      .finally(() => {
        if (montado) setCargandoPedidos(false);
      });
    return () => {
      montado = false;
    };
  }, []);

  async function refrescar() {
    const [platos, actual] = await Promise.all([
      api("/api/menu"),
      api("/api/reserva"),
    ]);
    setMenu(platos);
    setReserva(actual);
    setDesfase(actual.servidorAhora - Date.now());
  }
  async function operar(path, method, body) {
    if (ocupado.current) return;
    ocupado.current = true;
    setCargando(true);
    setError(null);
    try {
      if (path) {
        await api(path, method, body);
        if (path === "/api/reserva/confirmar") await actualizarPedidos();
      }
      await refrescar();
    } catch (err) {
      setError({ texto: err.message, id: Date.now() });
      try {
        await refrescar();
      } catch {
        /* Se conserva el error original. */
      }
    } finally {
      ocupado.current = false;
      setCargando(false);
    }
  }

  useEffect(() => {
    let montado = true;
    async function consultar() {
      if (!montado || ocupado.current) return;
      ocupado.current = true;
      try {
        await refrescar();
      } catch (err) {
        if (montado) setError({ texto: err.message, id: Date.now() });
      } finally {
        ocupado.current = false;
      }
    }
    consultar();
    const poll = setInterval(consultar, 2000);
    const tick = setInterval(() => setReloj(Date.now()), 250);
    return () => {
      montado = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  const segundos = reserva
    ? Math.max(0, Math.ceil((reserva.venceEn - reloj - desfase) / 1000))
    : 0;
  const activa = reserva?.estado === "activa" && segundos > 0;
  const bloqueado = cargando || !activa;

  return (
    <>
      <main className="food-shell">
        <header className="masthead">
          <div>
            <span className="eyebrow">FOOD DEI S.A. DE R.L.</span>
            <h1>
              Tu pausa.
              <br />
              <em>Tu menú.</em>
            </h1>
            <p>Almuerzos frescos, porciones limitadas. Reservá a tiempo.</p>
          </div>

          <div className="brand-mark" aria-hidden="true">
            FD<span>HECHO PARA TU DÍA</span>
          </div>
        </header>

        <Alert color="info" className="balance-bar">
          <span>
            Saldo disponible <strong>{dinero(reserva?.saldo || 0)}</strong>
          </span>
          <span>
            Total de tu reserva{" "}
            <Badge color="dark" pill>
              {dinero(reserva?.total || 0)}
            </Badge>
          </span>
          <span>
            Tiempo restante{" "}
            <strong>
              {activa
                ? `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`
                : "—"}
            </strong>
          </span>
        </Alert>

        {error && (
          <UncontrolledAlert key={error.id} color="warning">
            {error.texto}
          </UncontrolledAlert>
        )}

        <div className="status" role="status">
          {cargando
            ? "Cargando..."
            : !reserva
              ? "Conectando con la cocina..."
              : reserva.estado === "confirmada"
                ? "¡Reserva confirmada! Tus porciones están aseguradas."
                : !activa
                  ? "La reserva expiró. Tus porciones se liberaron. Iniciá una nueva reserva."
                  : "Elegí tus platos y confirmá antes de que termine el tiempo."}
        </div>

        {(!reserva || !activa) && (
          <Button
            className="mb-4"
            color="primary"
            disabled={cargando}
            onClick={() =>
              reserva ? operar("/api/reserva/nueva", "POST") : operar()
            }
          >
            {reserva ? "Iniciar nueva reserva" : "Reintentar conexión"}
          </Button>
        )}
        <div className="food-layout">
          <section>
            <div className="section-title">
              <h2>El menú del día</h2>
              <span>{menu.length} opciones</span>
            </div>
            <Row>
              {menu.map((plato) => (
                <Col xs="12" md="4" key={plato.id}>
                  <Card className="mb-3 menu-card">
                    <CardBody>
                      <span className="category">{plato.categoria}</span>
                      <h3>{plato.nombre}</h3>
                      <Badge color="success">{dinero(plato.precio)}</Badge>
                      <p className="stock">
                        {plato.stock} porciones disponibles
                      </p>
                      <Button
                        color={plato.stock === 0 ? "secondary" : "primary"}
                        disabled={bloqueado || plato.stock === 0}
                        onClick={() =>
                          operar("/api/reserva/agregar", "POST", {
                            alimentoId: plato.id,
                            cantidad: 1,
                          })
                        }
                      >
                        {plato.stock === 0 ? "Agotado" : "Añadir a la Reserva"}
                      </Button>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </section>

          <div>
            <aside className="tray">
              <h2>Tu bandeja</h2>
              <p className="text-secondary">El almuerzo a tu medida.</p>
              <ListGroup flush>
                {reserva?.itemsReservados.map((item) => {
                  const plato = menu.find((plato) => plato.id === item.id);
                  if (!plato) return null;
                  return (
                    <ListGroupItem key={item.id}>
                      <h3>{plato.nombre}</h3>
                      <p>
                        {dinero(plato.precio)} × {item.cantidad} ={" "}
                        <strong>{dinero(plato.precio * item.cantidad)}</strong>
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        <ButtonGroup size="sm">
                          <Button
                            aria-label={`Disminuir ${plato.nombre}`}
                            disabled={bloqueado || item.cantidad <= 1}
                            onClick={() =>
                              operar(
                                `/api/reserva/actualizar-porciones/${item.id}`,
                                "PUT",
                                { cantidad: item.cantidad - 1 },
                              )
                            }
                          >
                            −
                          </Button>
                          <span className="quantity">{item.cantidad}</span>
                          <Button
                            aria-label={`Aumentar ${plato.nombre}`}
                            disabled={bloqueado}
                            onClick={() =>
                              operar(
                                `/api/reserva/actualizar-porciones/${item.id}`,
                                "PUT",
                                { cantidad: item.cantidad + 1 },
                              )
                            }
                          >
                            +
                          </Button>
                        </ButtonGroup>
                        <Button
                          color="danger"
                          outline
                          size="sm"
                          disabled={bloqueado}
                          onClick={() =>
                            operar(`/api/reserva/eliminar/${item.id}`, "DELETE")
                          }
                        >
                          Quitar
                        </Button>
                      </div>
                    </ListGroupItem>
                  );
                })}
              </ListGroup>
              {!reserva?.itemsReservados.length && (
                <p className="empty">
                  Tu bandeja está vacía.
                  <br />
                  Añadí algo rico para comenzar.
                </p>
              )}
              <div className="tray-total">
                <span>Total</span>
                <strong>{dinero(reserva?.total || 0)}</strong>
              </div>
              <Button
                className="w-100"
                color="primary"
                disabled={
                  bloqueado ||
                  cargandoPedidos ||
                  !reserva?.itemsReservados.length
                }
                onClick={() => operar("/api/reserva/confirmar", "POST")}
              >
                Confirmar reserva
              </Button>
            </aside>
            <HistorialPedidos
              pedidos={pedidos}
              cargando={cargandoPedidos}
              error={errorPedidos}
            />
          </div>
        </div>
        <footer>
          UCA · Programación Web · Inventario y reservas administrados por
          Express
        </footer>
      </main>
    </>
  );
}
