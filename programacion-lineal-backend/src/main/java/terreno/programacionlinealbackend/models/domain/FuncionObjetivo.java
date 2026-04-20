package terreno.programacionlinealbackend.models.domain;

import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class FuncionObjetivo {
    private Tipo tipo;
    private List<Termino> termino;

    public void validar() {
        if (termino == null || termino.isEmpty()) {
            throw new IllegalArgumentException("La función objetivo debe tener al menos un término.");
        }
        for (Termino t : termino) {
            if (Double.isNaN(t.getCoeficiente())) {
                throw new IllegalArgumentException("Coeficiente inválido en un término: " + t);
            }
            if (t.getVariable() == null) {
                throw new IllegalArgumentException("Variable nula en un término: " + t);
            }
            if (t.getExponente() < 0) {
                throw new IllegalArgumentException("Exponente negativo en un término: " + t);
            }
        }
    }

    // Agrega variables de holgura/exceso
    public void variablesHolgura(List<String> nombres_holgura) {
        if (this.termino == null) {
            this.termino = new ArrayList<>();
        }
        for (String nombre : nombres_holgura) {
            boolean existe = this.termino.stream().anyMatch(t -> t.getVariable().equals(nombre));
            if (!existe) {
                Termino holgura = new Termino(0.0, nombre, 1.0);
                this.termino.add(holgura);
            }
        }
    }

    public List<Double> obtenerCj(List<String> etiquetas) {
        List<Double> fila_cj = new ArrayList<>();
        for (String var : etiquetas) { fila_cj.add(obtenerCoeficienteDe(var)); }
        return fila_cj;
    }

    // FuncionObjetivo es la única que sabe cuánto vale una variable.
    public double obtenerCoeficienteDe(String variable) {
        return this.termino.stream()
                .filter(t -> t.getVariable().equals(variable))
                .findFirst()
                .map(Termino::getCoeficiente)
                .orElseThrow(() -> new IllegalArgumentException("La variable '" + variable + "' no existe en la función objetivo"));
    }
}
