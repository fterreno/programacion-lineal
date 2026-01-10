package terreno.programacionlinealbackend.models.domain;

import lombok.Data;
import java.util.List;

@Data
public class MatrizSimplex {
    private List<String> columBase; // Vector de nombres de variables básicas
    private List<Double> columCoefVariablesBasicas; // Vector de coeficientes de las variables básicas
    private List<Double> filaCoefFuncionObjetivo; // Fila de coeficientes de la función objetivo
    private List<Double> columVLD; // Vector del lado derecho (VLD)
    private double[][] matrizRestricciones; // Matriz de restricciones (coeficientes)
    private List<Double> filaZj;  // Fila Zj
    private List<Double> filaCjZj; // Fila Cj - Zj
}