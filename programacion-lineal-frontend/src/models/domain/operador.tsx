export const Operador = {
  menor_igual: "<=",
  mayor_igual: ">=",
  igual: "=",
  menor: "<",
  mayor: ">",
} as const;

export type Operador = typeof Operador[keyof typeof Operador];