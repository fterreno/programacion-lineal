package terreno.programacionlinealbackend.models.domain;

import lombok.Data;

import java.util.*;

@Data
public class ProblemaPL {
    private FuncionObjetivo funcionObjetivo;
    private List<Restriccion> restricciones;
    private List<MatrizSimplex> iteraciones;

    public void validar() {
        funcionObjetivo.validar();
        restricciones.forEach(Restriccion::validar);
    }

    //Se agregan las variables de holgura
    public void agregarVariablesHolgura() {
        this.restricciones = Restriccion.validarVLDNoNegativo(this.restricciones);
        this.restricciones = Restriccion.variablesHolgura(this);
        this.funcionObjetivo = FuncionObjetivo.variablesHolgura(this);
    }

    public List<String> agregarVariablesNoNegatividad() {
        List<String> variablesNoNegatividad = Restriccion.restriccionNoNegatividad(this.restricciones);
        return variablesNoNegatividad;
    }

    //Todas las variables de la funcion objetivo se deben encontrar en el conjunto de restriccciones
    public boolean verificarVariables(ProblemaPL problema) {
        // Conjunto de variables presentes en las restricciones
        Set<String> variablesRestricciones = new HashSet<>();
        for (Restriccion restriccion : problema.getRestricciones()) {
            for (Termino termino : restriccion.getFuncionRestricciones()) {
                variablesRestricciones.add(termino.getVariable());
            }
        }
        // Verificar que todas las variables de la función objetivo estén en las restricciones
        for (Termino terminoFObj : problema.getFuncionObjetivo().getTermino()) {
            if (!variablesRestricciones.contains(terminoFObj.getVariable())) {
                return false;
            }
        }
        return true;
    }

//    public void generarMatrizInicial(ProblemaPL problema){
//        MatrizSimplex matriz = new MatrizSimplex();
//
//        //Construir lista de variables de la función objetivo (orden fijo) con coeficientes y etiquetas
//        List<String> etiquetas = new ArrayList<>();
//        List<Double> f_cfo = new ArrayList<>();
//        etiquetas.add("CB");
//        etiquetas.add("Base");
//        etiquetas.add("VLD");
//        for (Termino t : problema.getFuncionObjetivo().getTermino()) {
//            etiquetas.add(t.getVariable());
//            f_cfo.add(t.getCoeficiente());
//        }
//        matriz.setF_etiqueta(etiquetas);
//        matriz.setF_cfo(f_cfo);
//
//        //obtener variables y coeficientes base de las variables de holgura
//        List<Double> c_cb = new ArrayList<>();
//        List<String> c_base = new ArrayList<>();
//        List<Double> c_vld = new ArrayList<>();
//
//         for (Restriccion r : problema.getRestricciones()){
//             for (Termino t : r.getFuncionRestricciones()){
//                 if(t.getVariable().startsWith("S")){
//                     c_base.add(t.getVariable());
//                     c_cb.add(t.getCoeficiente());
//                 }
//             }
//             c_vld.add(r.getVld());
//         }
//
//        int cantRestricciones = problema.getRestricciones().size();
//        int numVariables = etiquetas.size();
//        double[][] m_restricciones = new double[cantRestricciones][numVariables];
//
//        for (int i = 0; i < cantRestricciones; i++) {
//            Restriccion restriccion = problema.getRestricciones().get(i);
//
//            // Llenar fila con coeficientes, ordenados según etiquetas (variables)
//            for (Termino t : restriccion.getFuncionRestricciones()) {
//                int colIndex = etiquetas.indexOf(t.getVariable());
//                if (colIndex >= 0) {
//                    m_restricciones[i][colIndex] = t.getCoeficiente();
//                }
//            }
//        }
//    }




}