package terreno.programacionlinealbackend.controller;

import org.springframework.web.bind.annotation.*;
import terreno.programacionlinealbackend.models.DTOs.EmpateSeleccion;
import terreno.programacionlinealbackend.models.DTOs.SolicitudProblema;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.models.domain.MetodoTipo;
import terreno.programacionlinealbackend.strategy.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pl")
@CrossOrigin(origins = {"http://localhost:5173", "https://fterreno.github.io"})
public class ProgramacionLinealController {

    private final Map<MetodoTipo, MetodosPL> estrategias;

    public ProgramacionLinealController(
            MetodoSimplex metodoSimplex,
            MetodoBaseArtificial metodoBaseArtificial
    ) {
        this.estrategias = Map.of(
                MetodoTipo.SIMPLEX,          metodoSimplex,
                MetodoTipo.BASE_ARTIFICIAL,  metodoBaseArtificial
        );
    }

    @PostMapping("/resolver")
    public SolicitudRespuesta resolver(@RequestBody SolicitudProblema solicitud) {
        MetodosPL estrategia = estrategias.get(solicitud.getMetodo_tipo());
        if (estrategia == null) throw new IllegalArgumentException("Método no soportado: " + solicitud.getMetodo_tipo());
        return estrategia.resolver(solicitud.getProblema());
    }

    @PostMapping("/empateVariableSalida")
    public SolicitudRespuesta empateVariableSalida(@RequestBody EmpateSeleccion seleccion) {
        MetodosPL estrategia = estrategias.get(seleccion.getMetodo_tipo());
        if (estrategia == null) throw new IllegalArgumentException("Método no soportado: " + seleccion.getMetodo_tipo());
        return estrategia.resolverDesdeEmpate(seleccion.getProblema_parcial(), seleccion.getVariable_salida_elegida());
    }
}
