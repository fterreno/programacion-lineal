import type { MetodoTipo } from "../domain/metodoTipo";
import type { ProblemaPL } from "../domain/problemaPL";

export interface SolicitudProblema {
    metodoTipo: MetodoTipo; // "Simplex" | "BaseArtificial"
    problema: ProblemaPL;
}