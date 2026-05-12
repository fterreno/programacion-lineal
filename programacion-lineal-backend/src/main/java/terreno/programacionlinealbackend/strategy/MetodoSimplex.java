package terreno.programacionlinealbackend.strategy;

import org.springframework.stereotype.Component;
import terreno.programacionlinealbackend.exception.EmpateException;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.models.domain.MatrizSimplex;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;
import terreno.programacionlinealbackend.models.domain.Tipo;

@Component
public class MetodoSimplex implements MetodosPL {
    @Override
    public SolicitudRespuesta resolver(ProblemaPL problema) {
        problema.validar();
        primeraFase(problema);
        try {
            while (!esSolucion(problema)) {
                segundaFase(problema);
            }
        } catch (EmpateException e) {
            return buildRespuestaEmpate(problema, e);
        }
        SolicitudRespuesta respuesta = new SolicitudRespuesta();
        respuesta.setMensaje("Método Simplex: " + problema);
        respuesta.setProblema_solucionado(problema);
        return respuesta;
    }

    @Override
    public SolicitudRespuesta resolverDesdeEmpate(ProblemaPL problema, String variableElegida) {
        problema.variableSalidaElegida(variableElegida);
        problema.actualizarMatrizConSalidaForzada();
        try {
            while (!esSolucion(problema)) {
                segundaFase(problema);
            }
        } catch (EmpateException e) {
            return buildRespuestaEmpate(problema, e);
        }
        SolicitudRespuesta respuesta = new SolicitudRespuesta();
        respuesta.setMensaje("Método Simplex: " + problema);
        respuesta.setProblema_solucionado(problema);
        return respuesta;
    }

    private SolicitudRespuesta buildRespuestaEmpate(ProblemaPL problema, EmpateException e) {
        SolicitudRespuesta respuesta = new SolicitudRespuesta();
        respuesta.setMensaje("Empate en la variable de salida");
        respuesta.setProblema_solucionado(problema);
        respuesta.setVariables_empatadas(e.getVariablesEmpatadas());
        respuesta.setRatios_empatados(e.getRatiosEmpatados());
        return respuesta;
    }

    public void primeraFase(ProblemaPL problema) {
        problema.agregarVariablesHolgura();  // Convertir el modelo a su forma estándar.
        problema.generarMatrizInicial();// Corroborar que tenga m vectores unitarios, si existe una igualdad se utiliza una variable artificial
    }

    public void segundaFase(ProblemaPL problema) {
        problema.variableEntrada();
        problema.variableSalida();
        problema.actualizarMatriz();
    }

    public boolean esSolucion(ProblemaPL problema) {
        MatrizSimplex ultima = problema.getIteraciones().get(problema.getIteraciones().size() - 1);
        if (problema.getFuncion_objetivo().getTipo() == Tipo.MAX) {
            return ultima.getFila_cj_zj().stream().allMatch(valor -> valor <= 0);//Condicion de Maximizacion: si Z es de Maximización: (cj-zj) =< 0;
        } else {
            return ultima.getFila_cj_zj().stream().allMatch(valor -> valor >= 0); //Condicion de Minimizacion: si Z es de Minimización: (cj-zj) => 0;
        }
    }
}
