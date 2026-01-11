package terreno.programacionlinealbackend.models.domain;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    public static FuncionObjetivo variablesHolgura(ProblemaPL problema) {

        FuncionObjetivo funcionObjetivo = problema.getFuncionObjetivo();
        List<Termino> nuevosTerminos = new ArrayList<>(funcionObjetivo.getTermino());

        int nro = 1;

        for (Restriccion restriccion : problema.getRestricciones()) {
            if (restriccion.getOperador() != Operador.igual){
                Termino holgura = new Termino();
                holgura.setCoeficiente(0);
                holgura.setVariable("S" + nro);
                holgura.setExponente(1);

                nuevosTerminos.add(holgura);
                nro++;
            }
        }

        funcionObjetivo.setTermino(nuevosTerminos);
        return funcionObjetivo;
    }

}
