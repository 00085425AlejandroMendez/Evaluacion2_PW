import { generarNumero, numeroValido } from '../utils/juego.js';

export function crearControladorJuego({ random = Math.random } = {}) {
  let secreto = generarNumero(random);

  function intentar(req, res) {
    const numero = req.body?.numero;
    if (!numeroValido(numero)) {
      return res.status(400).json({ error: 'Ingresá un número entero entre 1 y 100' });
    }
    const resultado = secreto === numero ? 'correcto' : secreto > numero ? 'mayor' : 'menor';
    return res.json({ resultado });
  }

  function reiniciar(req, res) {
    secreto = generarNumero(random);
    return res.json({ mensaje: 'Nueva partida creada' });
  }

  return { intentar, reiniciar };
}
