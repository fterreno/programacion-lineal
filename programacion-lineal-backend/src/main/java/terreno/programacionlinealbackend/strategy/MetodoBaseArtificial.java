package terreno.programacionlinealbackend.strategy;

import org.springframework.stereotype.Component;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.models.domain.MatrizSimplex;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;
import terreno.programacionlinealbackend.models.domain.Tipo;

@Component
public class MetodoBaseArtificial implements MetodosPL {

    private static final double TOLERANCIA = 1e-8;

    @Override
    public SolicitudRespuesta resolver(ProblemaPL problema) {
        problema.validar();
        primeraFase(problema);
        while (!esSolucion(problema)) {
            segundaFase(problema);
        }
        verificarFactibilidad(problema);

        SolicitudRespuesta respuesta = new SolicitudRespuesta();
        respuesta.setMensaje("Método Base Artificial: " + problema);
        respuesta.setProblema_solucionado(problema);
        return respuesta;
    }

    // Construye la base inicial con variables artificiales en lugar de solo holguras
    public void primeraFase(ProblemaPL problema) {
        problema.agregarVariablesArtificiales();
        problema.generarMatrizInicial();
    }

    public void segundaFase(ProblemaPL problema) {
        problema.variableEntrada();
        problema.variableSalida();
        problema.actualizarMatriz();
    }

    public boolean esSolucion(ProblemaPL problema) {
        MatrizSimplex ultima = problema.getIteraciones().get(problema.getIteraciones().size() - 1);
        if (problema.getFuncion_objetivo().getTipo() == Tipo.MAX) {
            return ultima.getFila_cj_zj().stream().allMatch(valor -> valor <= 0);
        } else {
            return ultima.getFila_cj_zj().stream().allMatch(valor -> valor >= 0);
        }
    }

    // Si alguna variable artificial permanece en la base con valor > 0, el problema es infactible
    public void verificarFactibilidad(ProblemaPL problema) {
        MatrizSimplex ultima = problema.getIteraciones().get(problema.getIteraciones().size() - 1);
        for (int i = 0; i < ultima.getColumna_base().size(); i++) {
            String var_base = ultima.getColumna_base().get(i);
            double valor = ultima.getColumna_vld().get(i);
            if (var_base.startsWith("A") && Math.abs(valor) > TOLERANCIA) {
                throw new IllegalStateException(
                    "El problema no tiene solución factible: la variable artificial "
                    + var_base + " permanece en la base con valor " + valor
                );
            }
        }
    }
}
