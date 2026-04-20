package terreno.programacionlinealbackend.models.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.AllArgsConstructor;

@Getter
@AllArgsConstructor
public enum Operador {
    @JsonProperty("menor_igual") MENOR_IGUAL("<="),
    @JsonProperty("mayor_igual") MAYOR_IGUAL(">="),
    @JsonProperty("igual")       IGUAL("="),
    @JsonProperty("menor")       MENOR("<"),
    @JsonProperty("mayor")       MAYOR(">");

    private final String simbolo;
}
