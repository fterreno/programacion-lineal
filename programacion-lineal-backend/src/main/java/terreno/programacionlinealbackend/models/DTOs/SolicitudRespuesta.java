package terreno.programacionlinealbackend.models.DTOs;

import lombok.Data;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;
import java.util.List;

@Data
public class SolicitudRespuesta {
    public String mensaje;
    public ProblemaPL problema_solucionado;
    // Presentes solo cuando hay empate en la variable de salida
    public List<String> variables_empatadas;
    public List<Double> ratios_empatados;
}
