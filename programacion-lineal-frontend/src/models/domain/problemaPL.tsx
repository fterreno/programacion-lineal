import type { FuncionObjetivo } from "./funcionObjetivo";
import type { Restriccion } from "./restriccion";
import type { MatrizSimplex } from "./matrizSimplex";

export interface ProblemaPL {
    funcionObjetivo: FuncionObjetivo;
    restricciones: Restriccion[];
    iteraciones?: MatrizSimplex[];
}
