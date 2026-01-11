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
        // Normalizar VLD de cada restricción
        restricciones.forEach(Restriccion::normalizarVld);

        // Identificar y agregar holguras en las restricciones
        int nro = 1;
        List<String> nombresHolgura = new ArrayList<>();
        for (Restriccion r : restricciones) {
            if (r.getOperador() != Operador.igual) {
                String nombreS = "S" + nro;
                r.variablesHolgura(nombreS);
                nombresHolgura.add(nombreS);
                nro++;
            }
        }

        // Informar a la Función Objetivo sobre las nuevas variables
        this.funcionObjetivo.variablesHolgura(nombresHolgura);

        // Homogeneizar todas las restricciones (Asegurar que todas tengan todas las variables)
        Set<String> todasLasVars = obtenerTodasLasVariables();

        Comparator<Termino> comparadorSimplex = (t1, t2) -> {
            boolean t1S = t1.getVariable().startsWith("S");
            boolean t2S = t2.getVariable().startsWith("S");
            if (t1S && !t2S) return 1;
            if (!t1S && t2S) return -1;
            return t1.getVariable().compareTo(t2.getVariable());
        };

        for (Restriccion r : restricciones) {
            todasLasVars.forEach(r::asegurarVariable);
            r.ordenarTerminos(comparadorSimplex);
        }
    }

    private Set<String> obtenerTodasLasVariables() {
        Set<String> vars = new HashSet<>();
        funcionObjetivo.getTermino().forEach(t -> vars.add(t.getVariable()));
        return vars;
    }

    // Me impiden salir del cuadarante positivo del eje cartesiano
    public List<String> agregarVariablesNoNegatividad() {
        return Restriccion.restriccionNoNegatividad(this.restricciones);
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

    public void generarMatrizInicial() {
        MatrizSimplex matriz = new MatrizSimplex();

        // Definir etiquetas, los nombres de las variables (originales + holguras)
        List<String> etiquetas = new ArrayList<>();
        funcionObjetivo.getTermino().forEach(t -> etiquetas.add(t.getVariable()));
        matriz.setF_etiqueta(etiquetas);

        // Definir los coeficientes Cj desde la FuncionObjetivo
        matriz.setF_cj(this.funcionObjetivo.obtenerCj(etiquetas));

        // Cargar la matriz de las filas desde las Restricciones
        configurarMatrizRestricciones(matriz, etiquetas);

        // El objeto MatrizSimplex se autocompleta
        matriz.calcularSolucionCoste();
        matriz.verificarVectoresUnitarios();

        if (this.iteraciones == null) this.iteraciones = new ArrayList<>();
        this.iteraciones.add(matriz);
    }

    private void configurarMatrizRestricciones(MatrizSimplex matriz, List<String> etiquetas) {
        int n = restricciones.size();
        int m = etiquetas.size();

        double[][] coeficientes = new double[n][m];
        List<String> base = new ArrayList<>();
        List<Double> cb = new ArrayList<>();
        List<Double> vld = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            Restriccion r = restricciones.get(i);
            vld.add(r.getVld());

            // Llenar matriz de coeficientes
            for (Termino t : r.getFuncionRestricciones()) {
                int col = etiquetas.indexOf(t.getVariable());
                coeficientes[i][col] = t.getCoeficiente();
            }

            // Lógica de Base, la restricción decide cuál es su variable de holgura
            String varBase = r.obtenerBase();
            base.add(varBase);
            cb.add(this.funcionObjetivo.obtenerCoeficienteDe(varBase));
        }

        matriz.setM_restricciones(coeficientes);
        matriz.setC_base(base);
        matriz.setC_cb(cb);
        matriz.setC_vld(vld);
    }
}