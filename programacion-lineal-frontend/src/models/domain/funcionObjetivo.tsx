import type { Tipo } from "./tipo";
import type { Termino } from "./termino";

export interface FuncionObjetivo {
    tipo: Tipo;
    termino: Termino[];
}