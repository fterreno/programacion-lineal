import type { Tipo } from "./Tipo";
import type { Termino } from "./Termino";

export interface FuncionObjetivo {
    tipo: Tipo;
    termino: Termino[];
}