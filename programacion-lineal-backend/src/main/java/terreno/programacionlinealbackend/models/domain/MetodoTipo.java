package terreno.programacionlinealbackend.models.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum MetodoTipo {
    @JsonProperty("simplex")         SIMPLEX,
    @JsonProperty("base_artificial") BASE_ARTIFICIAL
}
