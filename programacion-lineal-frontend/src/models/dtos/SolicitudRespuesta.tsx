import type { ProblemaPL } from '../domain/ProblemaPL';

export interface SolicitudRespuesta {
    mensaje: string;
    problema_solucionado: ProblemaPL;
}
