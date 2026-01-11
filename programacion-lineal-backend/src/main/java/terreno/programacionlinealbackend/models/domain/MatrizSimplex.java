package terreno.programacionlinealbackend.models.domain;

import lombok.Data;
import java.util.List;

@Data
public class MatrizSimplex {
    private List<Double> f_cj; // Fila de coeficientes de la función objetivo
    private List<String> f_etiqueta; // Nombre de las columnas

    private List<Double> f_zj;  // Fila Zj
    private List<Double> f_cjZj; // Fila Cj - Zj

    private double[][] m_restricciones; // Matriz de restricciones (ej 5,5,1,0,0)
    private List<Double> c_cb; // Coeficiente de las variables base
    private List<String> c_base; //variables base
    private List<Double> c_vld; //valores del lado derecho de la restriccion

}
//────────────────────────────────────────────────────────────────────
//        |      |        |   8    |    6   |    0   |   0    |   0     //f_cfo
//────────────────────────────────────────────────────────────────────
//   CB   | Base |  VLD   |    x1  |   x2   |   S1   |   S2   |   S3    //f_etiqueta
// ────────────────────────────────────────────────────────────────────
//   0    |  S1  |  300   |    5   |   5    |   1    |   0    |   0     //c_cb,c_base,c_vld,m_restricciones
//   0    |  S2  |  400   |    4   |   8    |   0    |   1    |   0     //c_cb,c_base,c_vld,m_restricciones
//   0    |  S3  |  320   |    6   |   4    |   0    |   0    |   1     //c_cb,c_base,c_vld,m_restricciones
//────────────────────────────────────────────────────────────────────
//        | Zj   |   0    |    0   |   0    |   0    |   0    |   0     //f_zj
//────────────────────────────────────────────────────────────────────
//        | Cj-Zj|        |    8   |   6    |   0    |   0    |   0     //f_cjZj
//────────────────────────────────────────────────────────────────────