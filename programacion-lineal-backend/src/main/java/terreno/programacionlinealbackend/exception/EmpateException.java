package terreno.programacionlinealbackend.exception;

import java.util.List;

public class EmpateException extends RuntimeException {

    private final List<String> variablesEmpatadas;
    private final List<Double> ratiosEmpatados;

    public EmpateException(List<String> variablesEmpatadas, List<Double> ratiosEmpatados) {
        super("Empate en la variable de salida");
        this.variablesEmpatadas = variablesEmpatadas;
        this.ratiosEmpatados = ratiosEmpatados;
    }

    public List<String> getVariablesEmpatadas() {
        return variablesEmpatadas;
    }

    public List<Double> getRatiosEmpatados() {
        return ratiosEmpatados;
    }
}
