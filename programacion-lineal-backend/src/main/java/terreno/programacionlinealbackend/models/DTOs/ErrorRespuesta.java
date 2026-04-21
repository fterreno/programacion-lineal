package terreno.programacionlinealbackend.models.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ErrorRespuesta {
    private String titulo;
    private String descripcion;
}
