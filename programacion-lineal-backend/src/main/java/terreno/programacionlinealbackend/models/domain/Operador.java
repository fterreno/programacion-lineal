package terreno.programacionlinealbackend.models.domain;

import lombok.Getter;
import lombok.AllArgsConstructor;

@Getter
@AllArgsConstructor
public enum Operador {
    menorIgual("<="),
    mayorIgual(">="),
    igual("="),
    menor("<"),
    mayor(">");

    private final String simbolo;
}