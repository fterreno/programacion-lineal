package terreno.programacionlinealbackend.models.domain;
import lombok.Data;
import java.util.List;

@Data
public class ProblemaPL {
    private FuncionObjetivo funcionObjetivo;
    private List<Restriccion> restricciones;
    //private List<Iteraciones> iteraciones;
}