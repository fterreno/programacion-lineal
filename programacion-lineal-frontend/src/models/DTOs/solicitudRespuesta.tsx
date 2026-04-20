import type { ProblemaPL } from '../domain/problemaPL';

export interface SolicitudRespuesta {
    mensaje: string;
    problemaSolucionado: ProblemaPL;
}