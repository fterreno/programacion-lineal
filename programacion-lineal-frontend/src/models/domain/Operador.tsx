export const Operador = {
  menor_igual: "menor_igual",
  mayor_igual: "mayor_igual",
  igual: "igual",
  menor: "menor",
  mayor: "mayor",
} as const;

export type Operador = typeof Operador[keyof typeof Operador];

export const mapeo_operador: Record<string, Operador> = {
  "<=": Operador.menor_igual,
  "=<": Operador.menor_igual,
  ">=": Operador.mayor_igual,
  "=>": Operador.mayor_igual,
  "=":  Operador.igual,
  "<":  Operador.menor,
  ">":  Operador.mayor,
};
