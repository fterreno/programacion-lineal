package terreno.programacionlinealbackend.models.domain;

import lombok.Data;

import java.sql.ClientInfoStatus;
import java.util.*;

@Data
public class ProblemaPL {
    private FuncionObjetivo funcionObjetivo;
    private List<Restriccion> restricciones;
    private List<MatrizSimplex> iteraciones;

    public void validar() {
        funcionObjetivo.validar();
        restricciones.forEach(r -> r.validar());
    }

    //Se agregan las variables de holgura
    public void agregarVariablesHolgura() {
        // Normalizar VLD de cada restricción
        restricciones.forEach(r -> r.normalizarVld());

        // Identificar y agregar holguras en las restricciones
        int nro = 1;
        List<String> nombresHolgura = new ArrayList<>();
        for (Restriccion r : restricciones) {
            if (r.getOperador() != Operador.igual) { //Se desprecia el igual porque sino deberiamos agregar una variable artificial
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
    //todo REVISAR porque no se en donde se utiliza
    public void agregarVariablesNoNegatividad() { //todo REVISAR
        Restriccion.restriccionNoNegatividad(this.restricciones);
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

    public void variableEntrada() {
        this.getIteraciones().get(this.getIteraciones().size() - 1).variableEntrada(this.getFuncionObjetivo().getTipo());
    }

    public void variableSalida(){
        this.getIteraciones().get(this.getIteraciones().size() - 1).variableSalida();
    }

    public void actualizarMatriz() {
        MatrizSimplex ultima = this.getIteraciones().get(this.getIteraciones().size() - 1);
        MatrizSimplex matrizNueva = new MatrizSimplex();

        // Copiar f_cj y etiquetas y c_cb y c_base y c_vld
        List<Double> nuevoFCj = new ArrayList<>(ultima.getF_cj());
        List<String> nuevoFEtiqueta = new ArrayList<>(ultima.getF_etiqueta());
        List<Double> nuevoCCb = new ArrayList<>(ultima.getC_cb());
        List<String> nuevoCBase = new ArrayList<>(ultima.getC_base());
        List<Double> nuevoC_vld = new ArrayList<>(ultima.getC_vld());

        double[][] nuevaMatriz = new double[ultima.getM_restricciones().length][ultima.getM_restricciones()[0].length];
        for (int i = 0; i < nuevaMatriz.length; i++)
            for (int j = 0; j < nuevaMatriz[0].length; j++)
                nuevaMatriz[i][j] = ultima.getM_restricciones()[i][j];

        // Determinar posiciones pivote
        int columnaPivote = nuevoFEtiqueta.indexOf(ultima.getVariableEntrada());
        int filaPivote = calcularFilaPivote(columnaPivote, nuevaMatriz, nuevoC_vld);

        // Actualizar base
        int posSalida = nuevoCBase.indexOf(ultima.getVariableSalida());
        nuevoCBase.set(posSalida, ultima.getVariableEntrada());
        nuevoCCb.set(posSalida, ultima.getF_cj().get(columnaPivote));

        // Normalizar fila pivote
        double pivote = nuevaMatriz[filaPivote][columnaPivote];
        for (int j = 0; j < nuevaMatriz[0].length; j++)
            nuevaMatriz[filaPivote][j] /= pivote;
        nuevoC_vld.set(filaPivote, nuevoC_vld.get(filaPivote) / pivote);

        // Hacer ceros en columna pivote
        for (int i = 0; i < nuevaMatriz.length; i++) {
            if (i != filaPivote) {
                double factor = nuevaMatriz[i][columnaPivote];
                for (int j = 0; j < nuevaMatriz[0].length; j++)
                    nuevaMatriz[i][j] -= factor * nuevaMatriz[filaPivote][j];
                nuevoC_vld.set(i, nuevoC_vld.get(i) - factor * nuevoC_vld.get(filaPivote));
            }
        }

        // Setear los valores de la nueva matriz
        matrizNueva.setF_cj(nuevoFCj);
        matrizNueva.setF_etiqueta(nuevoFEtiqueta);
        matrizNueva.setC_base(nuevoCBase);
        matrizNueva.setC_vld(nuevoC_vld);
        matrizNueva.setM_restricciones(nuevaMatriz);
        matrizNueva.setC_cb(nuevoCCb);
        matrizNueva.calcularSolucionCoste();

        this.getIteraciones().add(matrizNueva);
    }

    public int calcularFilaPivote(int columnaPivote, double[][] m_restricciones, List<Double> c_vld) {
        double minRazon = Double.POSITIVE_INFINITY;
        int filaPivote = -1;
        for (int i = 0; i < m_restricciones.length; i++) {
            double denominador = m_restricciones[i][columnaPivote];
            if (denominador > 0) { // solo filas válidas
                double razon = c_vld.get(i) / denominador;
                if (razon < minRazon) {
                    minRazon = razon;
                    filaPivote = i;
                }
            }
        }
        if (filaPivote == -1) {
            throw new IllegalStateException("La solución es no acotada");
        }
        return filaPivote;
    }

}