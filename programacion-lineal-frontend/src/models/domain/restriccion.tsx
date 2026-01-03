import type { Termino } from "./termino";
import type { Operador } from "./operador";

export interface Restriccion {
    limite: number;       // Límite inferior, por ejemplo 200
    operador: Operador;   // "<=", ">=", "="
    vld: Termino[];       // Valores del Lado Derecho de la ecuación
}