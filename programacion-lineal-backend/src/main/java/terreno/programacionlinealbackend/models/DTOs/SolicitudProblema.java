package terreno.programacionlinealbackend.models.DTOs;
import terreno.programacionlinealbackend.models.domain.MetodoTipo;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;
import lombok.Data;

@Data
public class SolicitudProblema {
    private MetodoTipo metodoTipo; // Simplex, BaseArtificial
    private ProblemaPL problema;
}