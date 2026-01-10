export const Operador = {
  menorIgual: "menorIgual",
  mayorIgual: "mayorIgual",
  igual: "igual",
  menor: "menor",
  mayor: "mayor",
} as const;

export type Operador = typeof Operador[keyof typeof Operador];

export const operadorMappeo: Record<string, Operador> = {
  "<=": Operador.menorIgual,
  "=<": Operador.menorIgual,
  ">=": Operador.mayorIgual,
  "=>": Operador.mayorIgual,
  "=": Operador.igual,
  "<": Operador.menor,
  ">": Operador.mayor,
};
