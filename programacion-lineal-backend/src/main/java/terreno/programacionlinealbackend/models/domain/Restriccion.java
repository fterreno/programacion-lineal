package terreno.programacionlinealbackend.models.domain;
import lombok.Data;

import java.util.ArrayList;
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

    //Validar el ingreso de las restricciones
    public static List<Restriccion> variablesHolgura(List<Restriccion> restricciones) {
        // menorIgual: Variable Holgura se suma
        // mayorIgual: Variable Holgura se resta
        // igual: No existe variable de holgura

        int nro = 1; // contador de variables de holgura/exceso
        for (Restriccion restriccion : restricciones) {
            Operador op = restriccion.getOperador();
            if (op == Operador.menorIgual || op == Operador.menor) {
                // agregar variable de holgura positiva
                Termino holgura = new Termino();
                holgura.setCoeficiente(1);
                holgura.setVariable("S" + nro);
                holgura.setExponente(1);
                restriccion.getFuncionRestricciones().add(holgura);
                nro++;
            } else if (op == Operador.mayorIgual || op == Operador.mayor) {
                // agregar variable de exceso negativa
                Termino exceso = new Termino();
                exceso.setCoeficiente(-1);
                exceso.setVariable("S" + nro);
                exceso.setExponente(1);
                restriccion.getFuncionRestricciones().add(exceso);
                nro++;
            }
        }
        return restricciones;
    }

    // Nos ubica en el cuadrante uno de los ejes de coordenadas
    public static List<String> restriccionNoNegatividad(List<Restriccion> restricciones) {
        List<String> variables = new ArrayList<>();
        for (Restriccion restriccion : restricciones) {
            for (Termino termino : restriccion.getFuncionRestricciones()) {
                String var = termino.getVariable();
                if (!variables.contains(var)) {variables.add(var);}
            }
        }
        return variables;
    }

    // En el caso de que en el vector del lado derecho exista algún valor negativo
    // deberán multiplicarse ambos miembros de la restricción por -1.
    public static List<Restriccion> validarVLDNoNegativo(List<Restriccion> restricciones) {
        for (Restriccion r : restricciones) {
            if (r.getVld() < 0) {
                // Multiplicar cada coeficiente por -1
                for (Termino t : r.getFuncionRestricciones()) {t.setCoeficiente(t.getCoeficiente() * -1);}

                // Cambiar el operador si aplica
                switch (r.getOperador()) {
                    case menorIgual: r.setOperador(Operador.mayorIgual); break;
                    case mayorIgual: r.setOperador(Operador.menorIgual); break;
                }
                // Hacer que el VLD sea positivo
                r.setVld(-r.getVld());
            }
        }
        return restricciones;
    }


}
