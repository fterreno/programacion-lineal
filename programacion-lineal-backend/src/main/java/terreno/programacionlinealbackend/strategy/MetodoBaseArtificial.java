package terreno.programacionlinealbackend.strategy;

import org.springframework.stereotype.Component;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;

@Component
public class MetodoBaseArtificial implements MetodosPL {
    @Override
    public SolicitudRespuesta resolver(ProblemaPL problema) {
        SolicitudRespuesta respuesta = new SolicitudRespuesta();
        respuesta.setMensaje("Método Base Artificial ejecutado (pendiente implementación)");
        return respuesta;
    }
}