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

    //Validar el ingreso de las restricciones
    public static List<Restriccion> variablesHolgura(ProblemaPL problema) {
        List<Restriccion> restricciones = problema.getRestricciones();
        int nro = 1; // contador de variables de holgura
        List<String> nombresHolgura = new ArrayList<>();

        // Crear holguras según operador
        for (Restriccion r : restricciones) {
            Operador op = r.getOperador();

            // Solo agregar variable de holgura si no es igualdad
            if (op != Operador.igual) {
                Termino holgura = new Termino();
                holgura.setVariable("S" + nro);
                holgura.setExponente(1);

                if (op == Operador.menorIgual || op == Operador.menor) {
                    holgura.setCoeficiente(1.0); // holgura positiva
                } else if (op == Operador.mayorIgual || op == Operador.mayor) {
                    holgura.setCoeficiente(-1.0); // exceso negativa
                }

                r.getFuncionRestricciones().add(holgura);
                nombresHolgura.add("S" + nro);
                nro++;
            }
        }

        // Asegurarse de que todas las restricciones tengan todas las variables de holgura
        List<String> todasVariables = new ArrayList<>();
        // Variables de la función objetivo
        for (Termino t : problema.getFuncionObjetivo().getTermino()) {
            if (!todasVariables.contains(t.getVariable())) {
                todasVariables.add(t.getVariable());
            }
        }
        // Variables de holgura
        todasVariables.addAll(nombresHolgura);

        // Asegurarse que todas las restricciones tengan todas las variables
        for (Restriccion r : restricciones) {
            List<String> varsExistentes = r.getFuncionRestricciones()
                    .stream()
                    .map(Termino::getVariable)
                    .toList();

            for (String var : todasVariables) {
                if (!varsExistentes.contains(var)) {
                    Termino cero = new Termino();
                    cero.setVariable(var);
                    cero.setCoeficiente(0.0);
                    cero.setExponente(1.0);
                    r.getFuncionRestricciones().add(cero);
                }
            }


            // Ordenar los términos: primero variables originales, luego holguras
            r.getFuncionRestricciones().sort((t1, t2) -> {
                boolean t1EsHolgura = t1.getVariable().startsWith("S");
                boolean t2EsHolgura = t2.getVariable().startsWith("S");

                if (t1EsHolgura && !t2EsHolgura) return 1;   // holgura después
                if (!t1EsHolgura && t2EsHolgura) return -1;  // original antes
                return t1.getVariable().compareTo(t2.getVariable()); // mismo tipo: ordenar alfabéticamente
            });
        }
        return restricciones;
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

    // En el caso de que en el vector del lado derecho exista algún valor negativo
    // deberán multiplicarse ambos miembros de la restricción por -1.
    public static List<Restriccion> validarVLDNoNegativo(List<Restriccion> restricciones) {
        for (Restriccion r : restricciones) {
            if (r.getVld() < 0) {
                // Multiplicar cada coeficiente por -1
                for (Termino t : r.getFuncionRestricciones()) {
                    t.setCoeficiente(t.getCoeficiente() * -1);
                }

                // Cambiar el operador si aplica
                switch (r.getOperador()) {
                    case menorIgual:
                        r.setOperador(Operador.mayorIgual);
                        break;
                    case mayorIgual:
                        r.setOperador(Operador.menorIgual);
                        break;
                }
                // Hacer que el VLD sea positivo
                r.setVld(-r.getVld());
            }
        }
        return restricciones;
    }


}
