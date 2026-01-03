import type { FuncionObjetivo } from "./funcionObjetivo";
import type { Restriccion } from "./restriccion";

export interface ProblemaPL {
    funcionObjetivo: FuncionObjetivo;
    restricciones: Restriccion[];
    // iteraciones?: Iteraciones[];
}
