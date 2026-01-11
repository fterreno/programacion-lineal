package terreno.programacionlinealbackend.models.domain;

import lombok.Data;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
public class ProblemaPL {
    private FuncionObjetivo funcionObjetivo;
    private List<Restriccion> restricciones;

    public void validar(){
        funcionObjetivo.validar();
        restricciones.forEach(Restriccion::validar);
    }

    //Se agregan las variables de holgura
    public void agregarVariablesHolgura() {
        this.restricciones = Restriccion.validarVLDNoNegativo(this.restricciones);
        this.restricciones = Restriccion.variablesHolgura(this.restricciones);
        this.funcionObjetivo = FuncionObjetivo.variablesHolgura(this);
    }

    public List<String> agregarVariablesNoNegatividad(){
        List<String> variablesNoNegatividad = Restriccion.restriccionNoNegatividad(this.restricciones);
        return variablesNoNegatividad;
    }

    //Todas las variables de la funcion objetivo se deben encontrar en el conjunto de restriccciones
    public boolean verificarVariables(ProblemaPL problema) {
        // Conjunto de variables presentes en las restricciones
        Set<String> variablesRestricciones = new HashSet<>();
        for (Restriccion restriccion : problema.getRestricciones()) {
            for (Termino termino : restriccion.getFuncionRestricciones()) {
                variablesRestricciones.add(termino.getVariable());
            }
        }
        // Verificar que todas las variables de la función objetivo estén en las restricciones
        for (Termino terminoFObj : problema.getFuncionObjetivo().getTermino()) {
            if (!variablesRestricciones.contains(terminoFObj.getVariable())) {
                return false;
            }
        }
        return true;
    }

}