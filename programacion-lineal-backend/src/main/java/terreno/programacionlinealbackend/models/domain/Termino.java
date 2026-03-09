package terreno.programacionlinealbackend.models.domain;
import lombok.Data;

@Data
public class Termino {
    private double coeficiente;
    private String variable;
    private double exponente;

    //Creo un constructor de la clase
    public Termino(double coeficiente, String variable, double exponente) {
        this.coeficiente = coeficiente;
        this.variable = variable;
        this.exponente = exponente;
    }

}