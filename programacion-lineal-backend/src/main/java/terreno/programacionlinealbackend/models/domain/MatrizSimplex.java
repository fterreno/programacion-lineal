package terreno.programacionlinealbackend.models.domain;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class MatrizSimplex {
    private List<Double> f_cj; // Fila de coeficientes de la función objetivo
    private List<String> f_etiqueta; // Nombre de las columnas

    private double[][] m_restricciones; // Matriz de restricciones (ej 5,5,1,0,0)

    private List<Double> f_zj;  // Fila Zj
    private List<Double> f_cjZj; // Fila Cj - Zj

    private List<Double> c_cb; // Coeficiente de las variables base
    private List<String> c_base; //variables base
    private List<Double> c_vld; //valores del lado derecho de la restriccion

    public void calcularSolucionCoste() {
        // Calculamos Zj, el producto escalar de CB por las columnas de la matriz
        this.f_zj = productoEscalar(this.c_cb, this.m_restricciones);
        // Calculamos Cj - Zj, la diferencia para el criterio de optimilidad
        this.f_cjZj = calcularCjZj();
    }

    public static List<Double> productoEscalar(List<Double> a, double[][] B) {
        int filas = B.length;
        int columnas = B[0].length;
        if (a.size() != filas) {
            throw new IllegalArgumentException("El tamaño del vector debe coincidir con las filas de la matriz");
        }
        List<Double> resultado = new ArrayList<>(columnas);

        for (int j = 0; j < columnas; j++) {
            double suma = 0.0;
            for (int i = 0; i < filas; i++) {
                suma += a.get(i) * B[i][j];
            }
            resultado.add(suma);
        }

        return resultado;
    }

    private List<Double> calcularCjZj() {
        List<Double> resultado = new ArrayList<>();
        for (int i = 0; i < f_cj.size(); i++) {
            resultado.add(f_cj.get(i) - f_zj.get(i));
        }
        return resultado;
    }

    public void verificarVectoresUnitarios() {
        List<String> base = this.getC_base();
        double[][] m = this.getM_restricciones();

        for (int i = 0; i < base.size(); i++) {
            String varBase = base.get(i);
            int colIndex = this.getF_etiqueta().indexOf(varBase);
            if (colIndex == -1) {
                throw new IllegalArgumentException("No posee vectores unitarios, utilizar variable artificial");
            }

            for (int fila = 0; fila < m.length; fila++) {
                double valor = m[fila][colIndex];
                if (fila == i) {
                    if (valor != 1.0) throw new IllegalArgumentException("No posee vectores unitarios, utilizar variable artificial");
                } else {
                    if (valor != 0.0) throw new IllegalArgumentException("No posee vectores unitarios, utilizar variable artificial");
                }
            }
        }
    }

}
//────────────────────────────────────────────────────────────────────
//        |      |        |   8    |    6   |    0   |   0    |   0     //f_cj
//────────────────────────────────────────────────────────────────────
//   CB   | Base |  VLD   |    x1  |   x2   |   S1   |   S2   |   S3    //f_etiqueta (sin cb, base y vld)
// ────────────────────────────────────────────────────────────────────
//   0    |  S1  |  300   |    5   |   5    |   1    |   0    |   0     //c_cb,c_base,c_vld,m_restricciones
//   0    |  S2  |  400   |    4   |   8    |   0    |   1    |   0     //c_cb,c_base,c_vld,m_restricciones
//   0    |  S3  |  320   |    6   |   4    |   0    |   0    |   1     //c_cb,c_base,c_vld,m_restricciones
//────────────────────────────────────────────────────────────────────
//        | Zj   |   0    |    0   |   0    |   0    |   0    |   0     //f_zj
//────────────────────────────────────────────────────────────────────
//        | Cj-Zj|        |    8   |   6    |   0    |   0    |   0     //f_cjZj
//────────────────────────────────────────────────────────────────────