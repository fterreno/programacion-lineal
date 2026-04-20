import type { FuncionObjetivo } from "./FuncionObjetivo";
import type { Restriccion } from "./Restriccion";
import type { MatrizSimplex } from "./MatrizSimplex";

export interface ProblemaPL {
    funcion_objetivo: FuncionObjetivo;
    restricciones: Restriccion[];
    iteraciones?: MatrizSimplex[];
}
