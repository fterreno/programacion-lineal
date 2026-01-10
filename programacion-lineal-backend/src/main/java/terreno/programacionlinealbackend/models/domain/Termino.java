package terreno.programacionlinealbackend.models.domain;
import lombok.Data;

@Data
public class Termino {
    private double coeficiente;
    private String variable;
    private double exponente;
}