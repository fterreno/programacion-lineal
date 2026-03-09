package terreno.programacionlinealbackend.controller;

import org.springframework.web.bind.annotation.*;
import terreno.programacionlinealbackend.models.DTOs.SolicitudProblema;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.strategy.*;

@RestController
@RequestMapping("/api/pl") //mapeo de la url
@CrossOrigin(origins = "http://localhost:5173") // React url del FrontEnd
public class ProgramacionLinealController {

    private final MetodoSimplex metodoSimplex;
    private final MetodoBaseArtificial metodoBaseArtificial;

    public ProgramacionLinealController(
            MetodoSimplex metodoSimplex,
            MetodoBaseArtificial metodoBaseArtificial
    ) {
        this.metodoSimplex = metodoSimplex;
        this.metodoBaseArtificial = metodoBaseArtificial;
    }

    @PostMapping("/resolver")
    public SolicitudRespuesta resolver(@RequestBody SolicitudProblema solicitud) {

        return switch (solicitud.getMetodoTipo()) {
            case Simplex -> metodoSimplex.resolver(solicitud.getProblema());
            case BaseArtificial -> metodoBaseArtificial.resolver(solicitud.getProblema());
            default -> {
                SolicitudRespuesta error = new SolicitudRespuesta();
                error.setMensaje("Método no soportado");
                yield error;
            }
        };
    }
}
