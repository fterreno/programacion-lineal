package terreno.programacionlinealbackend.models.domain;
import lombok.Data;
import java.util.List;

@Data
public class Restriccion {
    private double limite;         // Límite inferior, por ejemplo 200
    private Operador operador;          // "<=", ">=", "=", "<", ">"
    private List<Termino> vld;    // Valores del Lado Derecho de la ecuación
}
