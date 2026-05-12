package terreno.programacionlinealbackend.models.DTOs;

import lombok.Data;
import terreno.programacionlinealbackend.models.domain.MetodoTipo;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;

@Data
public class EmpateSeleccion {
    private MetodoTipo metodo_tipo;
    private ProblemaPL problema_parcial;
    private String variable_salida_elegida;
}
