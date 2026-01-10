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

    public static FuncionObjetivo variablesHolgura(FuncionObjetivo funcionObjetivo) {
        List<Termino> terminos = funcionObjetivo.getTermino();
        List<Termino> holguras = new ArrayList<>(); // Lista temporal para nuevas variables
        int nro = 1;

        for (Termino t : terminos) {
            if (t.getVariable() != null && !t.getVariable().isEmpty()) {
                Termino holgura = new Termino();
                holgura.setCoeficiente(0);
                holgura.setVariable("S" + nro);
                holgura.setExponente(1);
                holguras.add(holgura);
                nro++;
            }
        }

        terminos.addAll(holguras); // Agregamos las holguras al final
        funcionObjetivo.setTermino(terminos);

        return funcionObjetivo;
    }

}
