import type { Termino } from "./Termino";
import type { Operador } from "./Operador";

export interface Restriccion {
    valor_lado_derecho: number;
    operador: Operador;
    funcion_restricciones: Termino[];
}
