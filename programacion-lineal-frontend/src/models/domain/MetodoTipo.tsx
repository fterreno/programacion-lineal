export const MetodoTipo = {
  simplex:         "simplex",
  base_artificial: "base_artificial",
} as const;

export type MetodoTipo = typeof MetodoTipo[keyof typeof MetodoTipo];
