package terreno.programacionlinealbackend.strategy;

import org.springframework.stereotype.Component;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;

@Component
public class MetodoSimplex implements MetodosPL {
    @Override
    public SolicitudRespuesta resolver(ProblemaPL problema) {
        problema.validar();
        primeraFase(problema); //Identificación de una solución factible básica.

        //segundaFase
        // Criterio de detención

        SolicitudRespuesta respuesta = new SolicitudRespuesta();
        respuesta.setMensaje("Método Simplex: " + problema);
        return respuesta;
    }

    public void primeraFase(ProblemaPL problema){
        problema.agregarVariablesHolgura(); // Convertir el modelo a su forma estándar.

        if (!problema.verificarVariables(problema)) {
            System.out.println("Variables en función objetivo:");
            problema.getFuncionObjetivo().getTermino().forEach(t -> System.out.println(t.getVariable()));

            System.out.println("Variables en restricciones:");
            problema.getRestricciones().forEach(r ->r.getFuncionRestricciones().forEach(t -> System.out.println(t.getVariable()))
            );
            throw new IllegalArgumentException("Todas las variables de la función objetivo deben aparecer en al menos una restricción.");
        }
        problema.agregarVariablesNoNegatividad();
        // Corroborar que tenga m vectores unitarios, si existe una igualdad se utiliza una variable artificial
        problema.generarMatrizInicial();

    }

    public void segundaFase(){
        //segunda fase iterativa
        //Análisis de la solución: investigar si la solución encontrada se puede mejorar, para ello analizar las diferencias cj-zj.
        //Variable de entrada: Si Z es de Maximización, ingresa la variable que verifica mayor diferencia marginal (cj-zj) > 0. Si Z es de Minimización, ingresa la variable que verifica menor diferencia marginal  (cj-zj) < 0.
        // Variable de salida: para determinar la variable que sale de la base, se selecciona aquella que tenga el menor cociente entre su valor en la solución actual ( lmbdai ) y el coeficiente ik (siendo k la variable que entra) siempre y cuando dicho coeficiente sea estrictamente positivo
        //  Actualización: se debe actualizar la tabla, mediante operaciones elementales en filas.

        //cada vez que se hace el pivoteo tener en cuenta que no se pasa de las restricciones no limitantes!!!

    }

    public void criterioDetencion(){

    }

}
