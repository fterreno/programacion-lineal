package terreno.programacionlinealbackend.strategy;

import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;

public interface MetodosPL {
    SolicitudRespuesta resolver(ProblemaPL problema);
}
