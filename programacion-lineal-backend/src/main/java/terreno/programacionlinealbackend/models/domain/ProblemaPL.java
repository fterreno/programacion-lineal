package terreno.programacionlinealbackend.models.domain;

import lombok.Data;
import java.util.*;

@Data
public class ProblemaPL {
    private FuncionObjetivo funcion_objetivo;
    private List<Restriccion> restricciones;
    private List<MatrizSimplex> iteraciones;

    public void validar() {
        funcion_objetivo.validar();
        restricciones.forEach(r -> r.validar());
        this.verificarVariables();
    }

    //Se agregan las variables de holgura
    public void agregarVariablesHolgura() {
        // Normalizar VLD de cada restricción
        restricciones.forEach(r -> r.normalizarVld());
        // Identificar y agregar holguras en las restricciones
        int numero = 1;
        List<String> nombres_holgura = new ArrayList<>();
        for (Restriccion r : restricciones) {
            if (r.getOperador() != Operador.IGUAL) {
                String nombre_s = "S" + numero;
                r.variablesHolgura(nombre_s);
                nombres_holgura.add(nombre_s);
                numero++;
            } else {
                throw new IllegalArgumentException("Las restricciones no pueden tener una igualdad. Para ello deberá utilizarse un variable artificial");
            }
        }
        // Informar a la Función Objetivo sobre las nuevas variables
        this.funcion_objetivo.variablesHolgura(nombres_holgura);

        // Homogeneizar todas las restricciones (Asegurar que todas tengan todas las variables)
        Set<String> todas_las_vars = obtenerTodasLasVariables();

        Comparator<Termino> comparador_simplex = (t1, t2) -> {
            boolean t1S = t1.getVariable().startsWith("S");
            boolean t2S = t2.getVariable().startsWith("S");
            if (t1S && !t2S) return 1;
            if (!t1S && t2S) return -1;
            return t1.getVariable().compareTo(t2.getVariable());
        };

        for (Restriccion r : restricciones) {
            todas_las_vars.forEach(r::asegurarVariable);
            r.ordenarTerminos(comparador_simplex);
        }
    }

    // Construye la forma estándar para el Metodo de la M Grande
    // <= agrega holgura Si(+1), >= agrega exceso Si(-1) + artificial Ai(+1), = agrega solo Ai(+1)
    public void agregarVariablesArtificiales() {
        restricciones.forEach(r -> r.normalizarVld());

        int numeroS = 1;
        int numeroA = 1;
        List<String> nombres_holgura = new ArrayList<>();
        List<String> nombres_artificiales = new ArrayList<>();

        for (Restriccion r : restricciones) {
            if (r.getOperador() == Operador.MENOR_IGUAL || r.getOperador() == Operador.MENOR) {
                String nombre_s = "S" + numeroS++;
                r.variablesHolgura(nombre_s);
                nombres_holgura.add(nombre_s);
            } else if (r.getOperador() == Operador.MAYOR_IGUAL || r.getOperador() == Operador.MAYOR) {
                String nombre_s = "S" + numeroS++;
                r.variablesHolgura(nombre_s);
                nombres_holgura.add(nombre_s);
                String nombre_a = "A" + numeroA++;
                r.variablesArtificiales(nombre_a);
                nombres_artificiales.add(nombre_a);
            } else if (r.getOperador() == Operador.IGUAL) {
                String nombre_a = "A" + numeroA++;
                r.variablesArtificiales(nombre_a);
                nombres_artificiales.add(nombre_a);
            }
        }

        this.funcion_objetivo.variablesHolgura(nombres_holgura);
        this.funcion_objetivo.variablesArtificiales(nombres_artificiales, this.funcion_objetivo.getTipo());

        Set<String> todas_las_vars = obtenerTodasLasVariables();

        // Orden: variables originales → holguras/excesos (S) → artificiales (A)
        Comparator<Termino> comparador_m_grande = (t1, t2) -> {
            boolean t1S = t1.getVariable().startsWith("S");
            boolean t1A = t1.getVariable().startsWith("A");
            boolean t2S = t2.getVariable().startsWith("S");
            boolean t2A = t2.getVariable().startsWith("A");
            boolean t1Extra = t1S || t1A;
            boolean t2Extra = t2S || t2A;
            if (t1Extra && !t2Extra) return 1;
            if (!t1Extra && t2Extra) return -1;
            if (t1S && t2A) return -1;
            if (t1A && t2S) return 1;
            return t1.getVariable().compareTo(t2.getVariable());
        };

        for (Restriccion r : restricciones) {
            todas_las_vars.forEach(r::asegurarVariable);
            r.ordenarTerminos(comparador_m_grande);
        }
    }

    private Set<String> obtenerTodasLasVariables() {
        Set<String> vars = new HashSet<>();
        funcion_objetivo.getTermino().forEach(t -> vars.add(t.getVariable()));
        return vars;
    }

    //Todas las variables de la funcion objetivo se deben encontrar en el conjunto de restriccciones
    private void verificarVariables() {
        Set<String> variables_restricciones = new HashSet<>();
        for (Restriccion r : this.getRestricciones()) {
            r.getFuncion_restricciones().forEach(t -> variables_restricciones.add(t.getVariable()));
        }
        for (Termino t : this.getFuncion_objetivo().getTermino()) {
            if (!variables_restricciones.contains(t.getVariable())) {
                throw new IllegalArgumentException("No todas las variables de la funcion objetivo se encuentran en el conjunto restricciones.");
            }
        }
    }

    public void generarMatrizInicial() {
        // Definir etiquetas, los nombres de las variables (originales + holguras)
        List<String> etiquetas = new ArrayList<>();
        funcion_objetivo.getTermino().forEach(t -> etiquetas.add(t.getVariable()));
        List<Double> cj = funcion_objetivo.obtenerCj(etiquetas);

        // Cargar la matriz de las filas desde las Restricciones
        int n = restricciones.size();
        int m = etiquetas.size();
        double[][] coeficientes = new double[n][m];
        List<String> base = new ArrayList<>();
        List<Double> cb = new ArrayList<>();
        List<Double> vld = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            Restriccion r = restricciones.get(i);
            vld.add(r.getValor_lado_derecho());

            // Llenar matriz de coeficientes
            for (Termino t : r.getFuncion_restricciones()) {
                int col = etiquetas.indexOf(t.getVariable());
                coeficientes[i][col] = t.getCoeficiente();
            }
            // Lógica de Base, la restricción decide cuál es su variable de holgura
            String var_base = r.obtenerBase();
            base.add(var_base);
            cb.add(this.funcion_objetivo.obtenerCoeficienteDe(var_base));
        }

        MatrizSimplex matriz_inicial = new MatrizSimplex(cj, etiquetas, coeficientes, null, null, cb, base, vld, null, null);
        // El objeto MatrizSimplex se autocompleta
        matriz_inicial.calcularSolucionCoste();
        matriz_inicial.verificarVectoresUnitarios();

        if (this.iteraciones == null) this.iteraciones = new ArrayList<>();
        this.iteraciones.add(matriz_inicial);
    }

    public void variableEntrada() {
        this.getIteraciones().get(this.getIteraciones().size() - 1).variableEntrada(this.getFuncion_objetivo().getTipo());
    }

    public void variableSalida() {
        this.getIteraciones().get(this.getIteraciones().size() - 1).variableSalida();
    }

    public void actualizarMatriz() {
        MatrizSimplex ultima = this.getIteraciones().get(this.getIteraciones().size() - 1);
        // Copiar f_cj y etiquetas y c_cb y c_base y c_vld
        List<Double> nuevo_fila_cj = new ArrayList<>(ultima.getFila_cj());
        List<String> nuevo_fila_etiqueta = new ArrayList<>(ultima.getFila_etiqueta());
        List<Double> nuevo_columna_cb = new ArrayList<>(ultima.getColumna_cb());
        List<String> nuevo_columna_base = new ArrayList<>(ultima.getColumna_base());
        List<Double> nuevo_columna_vld = new ArrayList<>(ultima.getColumna_vld());

        double[][] nueva_matriz = new double[ultima.getMatriz_restricciones().length][ultima.getMatriz_restricciones()[0].length];
        for (int i = 0; i < nueva_matriz.length; i++)
            for (int j = 0; j < nueva_matriz[0].length; j++)
                nueva_matriz[i][j] = ultima.getMatriz_restricciones()[i][j];
        // Determinar posiciones pivote
        int columna_pivote = nuevo_fila_etiqueta.indexOf(ultima.getVariable_entrada());
        int fila_pivote = calcularFilaPivote(columna_pivote, nueva_matriz, nuevo_columna_vld);
        // Actualizar base
        int posicion_salida = nuevo_columna_base.indexOf(ultima.getVariable_salida());
        nuevo_columna_base.set(posicion_salida, ultima.getVariable_entrada());
        nuevo_columna_cb.set(posicion_salida, ultima.getFila_cj().get(columna_pivote));
        // Normalizar fila pivote
        double pivote = nueva_matriz[fila_pivote][columna_pivote];
        for (int j = 0; j < nueva_matriz[0].length; j++)
            nueva_matriz[fila_pivote][j] /= pivote;
        nuevo_columna_vld.set(fila_pivote, nuevo_columna_vld.get(fila_pivote) / pivote);
        // Hacer ceros en columna pivote
        for (int i = 0; i < nueva_matriz.length; i++) {
            if (i != fila_pivote) {
                double factor = nueva_matriz[i][columna_pivote];
                for (int j = 0; j < nueva_matriz[0].length; j++)
                    nueva_matriz[i][j] -= factor * nueva_matriz[fila_pivote][j];
                nuevo_columna_vld.set(i, nuevo_columna_vld.get(i) - factor * nuevo_columna_vld.get(fila_pivote));
            }
        }
        // Setear los valores de la nueva matriz
        MatrizSimplex nueva_matriz_simplex = new MatrizSimplex(nuevo_fila_cj, nuevo_fila_etiqueta, nueva_matriz, null, null, nuevo_columna_cb, nuevo_columna_base, nuevo_columna_vld, null, null);
        nueva_matriz_simplex.calcularSolucionCoste();
        this.getIteraciones().add(nueva_matriz_simplex);
    }

    public int calcularFilaPivote(int columna_pivote, double[][] matriz_restricciones, List<Double> columna_vld) {
        double min_razon = Double.POSITIVE_INFINITY;
        int fila_pivote = -1;
        for (int i = 0; i < matriz_restricciones.length; i++) {
            double denominador = matriz_restricciones[i][columna_pivote];
            if (denominador > 0) {
                double razon = columna_vld.get(i) / denominador;
                if (razon < min_razon) {
                    min_razon = razon;
                    fila_pivote = i;
                }
            }
        }
        if (fila_pivote == -1) {
            throw new IllegalStateException("La solución es no acotada");
        }
        return fila_pivote;
    }
}
