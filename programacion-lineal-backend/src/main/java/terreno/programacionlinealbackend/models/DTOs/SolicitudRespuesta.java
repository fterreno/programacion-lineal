package terreno.programacionlinealbackend.models.DTOs;

import lombok.Data;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;

@Data
public class SolicitudRespuesta {
    public String mensaje;
    public ProblemaPL problemaSolucionado;
}
