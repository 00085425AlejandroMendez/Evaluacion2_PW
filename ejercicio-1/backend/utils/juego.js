export const generarNumero = (random) => Math.floor(random() * 100) + 1;

export const numeroValido = (numero) =>
  Number.isInteger(numero) && numero >= 1 && numero <= 100;
