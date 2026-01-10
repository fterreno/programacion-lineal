import type { Termino } from "./termino";
import type { Operador } from "./operador";

export interface Restriccion {
    vld: number;       // Límite inferior, por ejemplo 200
    operador: Operador;   // "<=", ">=", "="
    funcionRestricciones: Termino[];       // Valores del Lado Derecho de la ecuación
}