package terreno.programacionlinealbackend.strategy;

import org.springframework.stereotype.Component;
import terreno.programacionlinealbackend.models.DTOs.SolicitudRespuesta;
import terreno.programacionlinealbackend.models.domain.FuncionObjetivo;
import terreno.programacionlinealbackend.models.domain.ProblemaPL;
import terreno.programacionlinealbackend.models.domain.Restriccion;

import java.util.ArrayList;
import java.util.List;

@Component
public class MetodoSimplex implements MetodosPL {
    @Override
    public SolicitudRespuesta resolver(ProblemaPL problema) {

        problema.getFuncionObjetivo().validar();
        problema.getRestricciones().forEach(Restriccion::validar);

        //Identificación de una solución factible básica.
        primeraFase(problema);

        //segundaFase
        // Criterio de detención

        SolicitudRespuesta respuesta = new SolicitudRespuesta();
        respuesta.setMensaje("Método Simplex: " + problema);
        return respuesta;
    }

    public void primeraFase(ProblemaPL problema){
        // Convertir el modelo a su forma estándar.

        //Se agregan las restricciones de holgura. VLD sin numeros negativos
        problema.setRestricciones(Restriccion.validarVLDNoNegativo(problema.getRestricciones()));
        problema.setRestricciones(Restriccion.variablesHolgura(problema.getRestricciones()));
        //Se agregarn las variables de holgura en la funcion objetivo
        problema.setFuncionObjetivo(FuncionObjetivo.variablesHolgura(problema.getFuncionObjetivo()));
        //Se guardan las restricciones de no negatividad
        List<String> variablesNoNegatividad = Restriccion.restriccionNoNegatividad(problema.getRestricciones());
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
