import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Form,
  Input,
  Label,
} from "reactstrap";
import { api } from "./services/api";

export default function App() {
  const [numero, setNumero] = useState("");
  const [historial, setHistorial] = useState([]);
  const [fallidos, setFallidos] = useState(0);
  const [mensaje, setMensaje] = useState(
    "El servidor eligió un número. ¡Descubrilo!",
  );
  const [victoria, setVictoria] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  async function intentar(event) {
    event.preventDefault();
    if (cargando || victoria) return;
    setCargando(true);
    setError("");
    try {
      const intento = Number(numero);
      const { resultado } = await api("/guess", "POST", { numero: intento });
      setHistorial((prev) => [...prev, { numero: intento, resultado }]);
      setVictoria(resultado === "correcto");
      if (resultado !== "correcto") setFallidos((prev) => prev + 1);
      setMensaje(
        resultado === "correcto"
          ? "¡Acertaste! Encontraste el número."
          : `El número oculto es ${resultado} que ${intento}.`,
      );
      setNumero("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }
  async function reiniciar() {
    if (cargando) return;
    setCargando(true);
    setError("");
    try {
      await api("/reset", "POST");
      setNumero("");
      setHistorial([]);
      setFallidos(0);
      setVictoria(false);
      setMensaje("Nueva partida. ¡Probá otra vez!");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }
  return (
    <main className="game-shell">
      <header>
        <span className="eyebrow">UCA · PROGRAMACIÓN WEB</span>
        <h1>
          Un número.
          <br />
          <em>Cien posibilidades.</em>
        </h1>
        <p>Seguí las pistas y encontrá el número del 1 al 100.</p>
      </header>
      <Card>
        <CardBody>
          <div className="d-flex justify-content-between mb-4">
            <Badge color="dark" pill>
              {fallidos} intentos fallidos
            </Badge>
            <span>01 — 100</span>
          </div>
          <Alert color={victoria ? "success" : "info"} aria-live="polite">
            {mensaje}
          </Alert>
          {error && (
            <Alert color="warning" role="alert">
              {error}
            </Alert>
          )}
          <Form onSubmit={intentar}>
            <Label for="numero">Tu siguiente intento</Label>
            <div className="d-flex gap-2">
              <Input
                id="numero"
                type="number"
                min="1"
                max="100"
                step="1"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                disabled={cargando || victoria}
                placeholder="Ej. 50"
              />
              <Button color="primary" disabled={cargando || victoria}>
                {cargando ? "Cargando..." : "Probar"}
              </Button>
            </div>
          </Form>
          <Button
            color="secondary"
            outline
            className="mt-3"
            onClick={reiniciar}
            disabled={cargando}
          >
            Reiniciar partida
          </Button>
          <hr />
          <h2>
            Tu recorrido <span>({historial.length})</span>
          </h2>
          {historial.length === 0 ? (
            <p className="text-secondary">Tus intentos aparecerán aquí.</p>
          ) : (
            <ol className="history">
              {historial.map((item, index) => (
                <li key={index}>
                  <strong>{item.numero}</strong>
                  <span>
                    {item.resultado === "correcto"
                      ? "✓ Correcto"
                      : `Buscá uno ${item.resultado}`}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
      <footer>
        Las pistas se calculan en Express. El secreto se queda en el servidor.
      </footer>
    </main>
  );
}
