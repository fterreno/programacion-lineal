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
        this.verificarVariables();
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
            else{
                throw new IllegalArgumentException("Las restricciones no pueden tener una igualdad. Para ello deberá utilizarse un variable artificial");
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
    public void agregarRestriccionesNoNegatividad() {
        Set<String> variables = obtenerTodasLasVariables();
        for (String var : variables) {
            boolean yaExiste = false;
            // Verificar si ya existen las restricciones de no negatividad Xi >= 0
            for (Restriccion r : restricciones) {
                if (r.getOperador() == Operador.mayorIgual &&
                        r.getVld() == 0 &&
                        r.getFuncionRestricciones().size() == 1) {
                    Termino t = r.getFuncionRestricciones().get(0);
                    if (t.getVariable().equals(var) && t.getCoeficiente() == 1) {
                        yaExiste = true;
                        break;
                    }
                }
            }
            // Solo agregar las variables de no negatividad si no existen
            if (!yaExiste) {
                Termino termino = new Termino(1, var, 1);
                List<Termino> lista = new ArrayList<>();
                lista.add(termino);
                Restriccion restriccionNoNeg = new Restriccion(lista, Operador.mayorIgual, 0);
                restricciones.add(restriccionNoNeg);
            }
        }
    }

    //Todas las variables de la funcion objetivo se deben encontrar en el conjunto de restriccciones
    private void verificarVariables() {
        Set<String> variablesRestricciones = new HashSet<>();
        for (Restriccion r : this.getRestricciones()) {
            r.getFuncionRestricciones().forEach(t -> variablesRestricciones.add(t.getVariable()));
        }
        for (Termino t : this.getFuncionObjetivo().getTermino()) {
            if (!variablesRestricciones.contains(t.getVariable())) {
                throw new IllegalArgumentException("No todas las variables de la funcion objetivo se encuentran en el conjunto restricciones.");
            }
        }
    }

    public void generarMatrizInicial() {
        // Definir etiquetas, los nombres de las variables (originales + holguras)
        List<String> etiquetas = new ArrayList<>();
        funcionObjetivo.getTermino().forEach(t -> etiquetas.add(t.getVariable()));
        List<Double> cj = funcionObjetivo.obtenerCj(etiquetas);

        // Cargar la matriz de las filas desde las Restricciones
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

        MatrizSimplex matrizInicial = new MatrizSimplex(cj, etiquetas, coeficientes, null, null, cb, base, vld, null, null);
        // El objeto MatrizSimplex se autocompleta
        matrizInicial.calcularSolucionCoste();
        matrizInicial.verificarVectoresUnitarios();

        if (this.iteraciones == null) this.iteraciones = new ArrayList<>();
        this.iteraciones.add(matrizInicial);
    }

    public void variableEntrada() {
        this.getIteraciones().get(this.getIteraciones().size() - 1).variableEntrada(this.getFuncionObjetivo().getTipo());
    }

    public void variableSalida(){
        this.getIteraciones().get(this.getIteraciones().size() - 1).variableSalida();
    }

    public void actualizarMatriz() {
        MatrizSimplex ultima = this.getIteraciones().get(this.getIteraciones().size() - 1);

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
        MatrizSimplex matrizSimplexNueva = new MatrizSimplex(nuevoFCj, nuevoFEtiqueta, nuevaMatriz, null, null,  nuevoCCb, nuevoCBase, nuevoC_vld, null, null);
        matrizSimplexNueva.calcularSolucionCoste();
        this.getIteraciones().add(matrizSimplexNueva);
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