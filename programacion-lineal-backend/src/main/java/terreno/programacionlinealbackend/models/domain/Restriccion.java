package terreno.programacionlinealbackend.models.domain;

import lombok.Data;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Data
public class Restriccion {
    private List<Termino> funcion_restricciones;  // Matriz de restricciones, vlizquierdo
    private Operador operador; // "<=", ">=", "=", "<", ">"
    private double valor_lado_derecho; // Valores del Lado Derecho de la ecuación. Límite inferior, por ejemplo 200

    public Restriccion(List<Termino> funcion_restricciones, Operador operador, double valor_lado_derecho) {
        this.funcion_restricciones = funcion_restricciones;
        this.operador = operador;
        this.valor_lado_derecho = valor_lado_derecho;
    }

    public void validar() {
        if (Double.isNaN(valor_lado_derecho)) { // Verificar límite válido
            throw new IllegalArgumentException("El límite de la restricción no es válido: " + valor_lado_derecho);
        }

        if (operador == null) { // Verificar operador no nulo
            throw new IllegalArgumentException("El operador de la restricción no puede ser nulo.");
        }

        if (funcion_restricciones == null || funcion_restricciones.isEmpty()) { // Verificar términos
            throw new IllegalArgumentException("La restricción debe tener al menos un término.");
        }

        for (Termino t : funcion_restricciones) { // Validar cada término de la funcionRestricciones
            if (Double.isNaN(t.getCoeficiente())) {
                throw new IllegalArgumentException("Coeficiente inválido en un término de la restricción: " + t);
            }
            if (t.getVariable() == null) {
                throw new IllegalArgumentException("Variable nula en un término de la restricción: " + t);
            }
            if (t.getExponente() < 0) {
                throw new IllegalArgumentException("Exponente negativo en un término de la restricción: " + t);
            }
        }
    }

    // Agrega las holguras o excesos correspondientes
    public void variablesHolgura(String nombre_variable) {
        if (this.operador == Operador.IGUAL) return;

        double coeficiente = (operador == Operador.MENOR_IGUAL || operador == Operador.MENOR) ? 1.0 : -1.0;

        Termino holgura = new Termino(coeficiente, nombre_variable, 1.0);
        this.funcion_restricciones.add(holgura);
    }

    // Agrega una variable artificial con coeficiente +1 para construir el vector unitario base
    public void variablesArtificiales(String nombre_variable) {
        Termino artificial = new Termino(1.0, nombre_variable, 1.0);
        this.funcion_restricciones.add(artificial);
    }

    // Asegura que se encuentren todas las variables (misma cantidad) para la matriz
    public void asegurarVariable(String nombre_variable) {
        boolean existe = funcion_restricciones.stream()
                .anyMatch(t -> t.getVariable().equals(nombre_variable));

        if (!existe) {
            Termino cero = new Termino(0.0, nombre_variable, 1.0);
            this.funcion_restricciones.add(cero);
        }
    }

    // Ordena los terminos primero las variables y luego variebles holgura/excesos
    public void ordenarTerminos(Comparator<Termino> comparador) {
        this.funcion_restricciones.sort(comparador);
    }

    // En el caso de que en el vector del lado derecho exista algún valor negativo deberán multiplicarse ambos miembros de la restricción por -1.
    public void normalizarVld() {
        if (this.valor_lado_derecho < 0) {
            for (Termino t : this.funcion_restricciones) {
                t.setCoeficiente(t.getCoeficiente() * -1);
            }
            invertirOperador();
            this.valor_lado_derecho = -this.valor_lado_derecho;
        }
    }

    // En el caso de que en el vector del lado derecho exista algún valor negativo deberán multiplicarse ambos miembros de la restricción por -1.
    private void invertirOperador() {
        if (operador == Operador.MENOR_IGUAL) operador = Operador.MAYOR_IGUAL;
        else if (operador == Operador.MAYOR_IGUAL) operador = Operador.MENOR_IGUAL;
        else if (operador == Operador.MENOR) operador = Operador.MAYOR;
        else if (operador == Operador.MAYOR) operador = Operador.MENOR;
    }

    public String obtenerBase() {
        return this.funcion_restricciones.stream()
                .filter(t -> (t.getVariable().startsWith("S") || t.getVariable().startsWith("A")) && t.getCoeficiente() == 1.0)
                .map(Termino::getVariable)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No se encontró variable de base válida (holgura o artificial) para esta restricción"));
    }
}
