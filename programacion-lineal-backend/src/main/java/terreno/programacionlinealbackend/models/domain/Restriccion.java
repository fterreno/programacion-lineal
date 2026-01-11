package terreno.programacionlinealbackend.models.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Data
public class Restriccion {
    private List<Termino> funcionRestricciones;    // Matriz de restricciones, vlizquierdo
    private Operador operador;          // "<=", ">=", "=", "<", ">"
    private double vld;         // Valores del Lado Derecho de la ecuación. Límite inferior, por ejemplo 200

    public void validar() {
        // Verificar límite válido
        if (Double.isNaN(vld)) {
            throw new IllegalArgumentException("El límite de la restricción no es válido: " + vld);
        }

        // Verificar operador no nulo
        if (operador == null) {
            throw new IllegalArgumentException("El operador de la restricción no puede ser nulo.");
        }

        // Verificar términos
        if (funcionRestricciones == null || funcionRestricciones.isEmpty()) {
            throw new IllegalArgumentException("La restricción debe tener al menos un término.");
        }

        // Validar cada término de la funcionRestricciones
        for (Termino t : funcionRestricciones) {
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
    public void variablesHolgura(String nombreVariable) {
        if (this.operador == Operador.igual) return;

        double coeficiente = (operador == Operador.menorIgual || operador == Operador.menor) ? 1.0 : -1.0;

        Termino holgura = new Termino();
        holgura.setVariable(nombreVariable);
        holgura.setExponente(1.0);
        holgura.setCoeficiente(coeficiente);

        this.funcionRestricciones.add(holgura);
    }

    // Asegura que se encuentren todas las variables (misma cantidad) para la matriz
    public void asegurarVariable(String nombreVariable) {
        boolean existe = funcionRestricciones.stream()
                .anyMatch(t -> t.getVariable().equals(nombreVariable));

        if (!existe) {
            Termino cero = new Termino();
            cero.setVariable(nombreVariable);
            cero.setCoeficiente(0.0);
            cero.setExponente(1.0);
            this.funcionRestricciones.add(cero);
        }
    }

    // Ordena los terminos primero las variables y luego variebles holgura/excesos
    public void ordenarTerminos(Comparator<Termino> comparador) {
        this.funcionRestricciones.sort(comparador);
    }

    // En el caso de que en el vector del lado derecho exista algún valor negativo deberán multiplicarse ambos miembros de la restricción por -1.
    public void normalizarVld() {
        if (this.vld < 0) {
            for (Termino t : this.funcionRestricciones) {
                t.setCoeficiente(t.getCoeficiente() * -1);
            }
            invertirOperador();
            this.vld = -this.vld;
        }
    }

    // En el caso de que en el vector del lado derecho exista algún valor negativo deberán multiplicarse ambos miembros de la restricción por -1.
    private void invertirOperador() {
        if (operador == Operador.menorIgual) operador = Operador.mayorIgual;
        else if (operador == Operador.mayorIgual) operador = Operador.menorIgual;
        else if (operador == Operador.menor) operador = Operador.mayor;
        else if (operador == Operador.mayor) operador = Operador.menor;
    }

    // Nos ubica en el cuadrante uno de los ejes de coordenadas
    public static List<String> restriccionNoNegatividad(List<Restriccion> restricciones) {
        List<String> variables = new ArrayList<>();
        for (Restriccion restriccion : restricciones) {
            for (Termino termino : restriccion.getFuncionRestricciones()) {
                String var = termino.getVariable();
                if (!variables.contains(var)) {
                    variables.add(var);
                }
            }
        }
        return variables;
    }
}
