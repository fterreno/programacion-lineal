import type { ProblemaPL } from '../domain/ProblemaPL';

export interface SolicitudRespuesta {
    mensaje: string;
    problema_solucionado: ProblemaPL;
    variables_empatadas?: string[];
    ratios_empatados?: number[];
}
