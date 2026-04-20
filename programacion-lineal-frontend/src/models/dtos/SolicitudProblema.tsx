import type { MetodoTipo } from "../domain/MetodoTipo";
import type { ProblemaPL } from "../domain/ProblemaPL";

export interface SolicitudProblema {
    metodo_tipo: MetodoTipo;
    problema: ProblemaPL;
}
