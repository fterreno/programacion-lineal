package terreno.programacionlinealbackend.models.domain;
import java.util.List;
import lombok.Data;

@Data
public class FuncionObjetivo {
    private Tipo tipo;
    private List<Termino> termino;
}
