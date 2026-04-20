package terreno.programacionlinealbackend.controller;

import org.springframework.web.bind.annotation.*;
import terreno.programacionlinealbackend.models.DTOs.SolicitudProblema;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.strategy.*;

@RestController
@RequestMapping("/api/pl")
@CrossOrigin(origins = "http://localhost:5173")
public class ProgramacionLinealController {

    private final MetodoSimplex metodo_simplex;
    private final MetodoBaseArtificial metodo_base_artificial;

    public ProgramacionLinealController(
            MetodoSimplex metodo_simplex,
            MetodoBaseArtificial metodo_base_artificial
    ) {
        this.metodo_simplex = metodo_simplex;
        this.metodo_base_artificial = metodo_base_artificial;
    }

    @PostMapping("/resolver")
    public SolicitudRespuesta resolver(@RequestBody SolicitudProblema solicitud) {

        return switch (solicitud.getMetodo_tipo()) {
            case SIMPLEX -> metodo_simplex.resolver(solicitud.getProblema());
            case BASE_ARTIFICIAL -> metodo_base_artificial.resolver(solicitud.getProblema());
            default -> {
                SolicitudRespuesta error = new SolicitudRespuesta();
                error.setMensaje("Método no soportado");
                yield error;
            }
        };
    }
}
