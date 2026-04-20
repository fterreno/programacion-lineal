package terreno.programacionlinealbackend.models.domain;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class MatrizSimplex {
    private List<Double> fila_cj; // Fila de coeficientes de la función objetivo
    private List<String> fila_etiqueta; // Nombre de las columnas

    private double[][] matriz_restricciones; // Matriz de restricciones (ej 5,5,1,0,0)

    private List<Double> fila_zj; // Fila Zj
    private List<Double> fila_cj_zj; // Fila Cj - Zj

    private List<Double> columna_cb; // Coeficiente de las variables base
    private List<String> columna_base; //variables base
    private List<Double> columna_vld; //valores del lado derecho de la restriccion

    private String variable_entrada;
    private String variable_salida;

    //Constructor de la clase MatrizSimplex
    public MatrizSimplex(List<Double> fila_cj, List<String> fila_etiqueta, double[][] matriz_restricciones,
                         List<Double> fila_zj, List<Double> fila_cj_zj, List<Double> columna_cb,
                         List<String> columna_base, List<Double> columna_vld,
                         String variable_entrada, String variable_salida) {
        this.fila_cj = fila_cj;
        this.fila_etiqueta = fila_etiqueta;
        this.matriz_restricciones = matriz_restricciones;
        this.fila_zj = fila_zj;
        this.fila_cj_zj = fila_cj_zj;
        this.columna_cb = columna_cb;
        this.columna_base = columna_base;
        this.columna_vld = columna_vld;
        this.variable_entrada = variable_entrada;
        this.variable_salida = variable_salida;
    }

    public void calcularSolucionCoste() {
        // Calculamos Zj, el producto escalar de CB por las columnas de la matriz
        this.fila_zj = productoEscalar(this.columna_cb, this.matriz_restricciones);
        // Calculamos Cj - Zj, la diferencia para el criterio de optimilidad
        this.fila_cj_zj = calcularCjZj();
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
        for (int i = 0; i < fila_cj.size(); i++) {
            resultado.add(fila_cj.get(i) - fila_zj.get(i));
        }
        return resultado;
    }

    public void verificarVectoresUnitarios() {
        List<String> base = this.getColumna_base();
        double[][] m = this.getMatriz_restricciones();

        for (int i = 0; i < base.size(); i++) {
            String var_base = base.get(i);
            int indice_columna = this.getFila_etiqueta().indexOf(var_base);
            if (indice_columna == -1) {
                throw new IllegalArgumentException("No posee vectores unitarios, utilizar variable artificial");
            }

            for (int fila = 0; fila < m.length; fila++) {
                double valor = m[fila][indice_columna];
                if (fila == i) {
                    if (valor != 1.0) throw new IllegalArgumentException("No posee vectores unitarios, utilizar variable artificial");
                } else {
                    if (valor != 0.0) throw new IllegalArgumentException("No posee vectores unitarios, utilizar variable artificial");
                }
            }
        }
    }

    public void variableEntrada(Tipo tipo) {
        int posicion = -1;
        double condicion_entrada = 0;
        for (int i = 0; i < this.fila_cj_zj.size(); i++) {
            if ((tipo == Tipo.MAX) && (this.fila_cj_zj.get(i) > condicion_entrada)) {
                condicion_entrada = this.fila_cj_zj.get(i);
                posicion = i;
            }
            if ((tipo == Tipo.MIN) && (this.fila_cj_zj.get(i) < condicion_entrada)) {
                condicion_entrada = this.fila_cj_zj.get(i);
                posicion = i;
            }
        }
        if (posicion == -1) {
            throw new IllegalArgumentException("La solución ya es óptima");
        }

        this.variable_entrada = this.fila_etiqueta.get(posicion);
    }

    public void variableSalida() {
        int columna_pivote = this.getFila_etiqueta().indexOf(this.variable_entrada);
        if (columna_pivote == -1) {
            throw new IllegalArgumentException("Error buscando la posicion de etiqueta en MatrizSimplex.variableSalida");
        }
        List<Double> tita = new ArrayList<>();
        for (int i = 0; i < this.columna_vld.size(); i++) {
            double denominador = this.matriz_restricciones[i][columna_pivote];
            if (denominador > 0) {
                tita.add(this.columna_vld.get(i) / denominador);
            } else {
                tita.add(0.0);
            }
        }

        if (tita.stream().allMatch(v -> v <= 0)) {
            throw new IllegalStateException("La solución es no acotada");
        }

        double tita_minimo = Double.POSITIVE_INFINITY;
        int fila_pivote = -1;

        for (int i = 0; i < tita.size(); i++) {
            if ((0 < tita.get(i)) && (tita.get(i) < tita_minimo)) {
                tita_minimo = tita.get(i);
                fila_pivote = i;
            }
        }
        this.variable_salida = this.columna_base.get(fila_pivote);
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