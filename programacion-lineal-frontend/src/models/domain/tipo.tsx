export const Tipo = {
  MAX: "MAX",
  MIN: "MIN"
} as const;

export type Tipo = typeof Tipo[keyof typeof Tipo];