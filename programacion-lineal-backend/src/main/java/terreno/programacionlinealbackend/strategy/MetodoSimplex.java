package terreno.programacionlinealbackend.strategy;

import org.springframework.stereotype.Component;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.models.domain.MatrizSimplex;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;
import terreno.programacionlinealbackend.models.domain.Tipo;

@Component
public class MetodoSimplex implements MetodosPL {
    @Override
    public SolicitudRespuesta resolver(ProblemaPL problema) {
        problema.validar();
        primeraFase(problema); //Identificación de una solución factible básica.
        while (!esSolucion(problema)) {
            segundaFase(problema);
        }
        SolicitudRespuesta respuesta = new SolicitudRespuesta();
        respuesta.setMensaje("Método Simplex: " + problema);
        respuesta.setProblemaSolucionado(problema);
        return respuesta;
    }

    public void primeraFase(ProblemaPL problema){
        problema.agregarVariablesHolgura(); // Convertir el modelo a su forma estándar.
        problema.generarMatrizInicial(); // Corroborar que tenga m vectores unitarios, si existe una igualdad se utiliza una variable artificial
    }

    public void segundaFase(ProblemaPL problema){
        //segunda fase iterativa
        problema.variableEntrada();
        problema.variableSalida();
        problema.actualizarMatriz();

    }

    public boolean esSolucion(ProblemaPL problema){
        MatrizSimplex ultima = problema.getIteraciones().get(problema.getIteraciones().size() - 1);
        if (problema.getFuncionObjetivo().getTipo() == Tipo.MAX) {
            return ultima.getF_cjZj().stream().allMatch(valor -> valor <= 0); //Condicion de Maximizacion: si Z es de Maximización: (cj-zj) =< 0;
        } else {
            return ultima.getF_cjZj().stream().allMatch(valor -> valor >= 0); //Condicion de Minimizacion: si Z es de Minimización: (cj-zj) => 0;
        }
    }

}
