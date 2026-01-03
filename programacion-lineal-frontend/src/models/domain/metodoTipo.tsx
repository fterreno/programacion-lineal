export const MetodoTipo = {
  Simplex: "Simplex",
  BaseArtificial: "BaseArtificial"
} as const;

export type MetodoTipo = typeof MetodoTipo[keyof typeof MetodoTipo];