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

    public void generarMatrizInicial() {
        MatrizSimplex matriz = new MatrizSimplex();

        // Determinar todas las variables (originales + holguras)
        Set<String> todasVariables = new LinkedHashSet<>();
        for (Termino t : this.getFuncionObjetivo().getTermino()) {
            todasVariables.add(t.getVariable());
        }
        for (Restriccion r : this.getRestricciones()) {
            for (Termino t : r.getFuncionRestricciones()) {
                todasVariables.add(t.getVariable());
            }
        }
        List<String> variables = new ArrayList<>(todasVariables); // Solo variables
        matriz.setF_etiqueta(variables); // etiquetas solo de variables

        // Coeficientes de la función objetivo (f_cj)
        List<Double> f_cj = new ArrayList<>();
        for (String var : variables) {
            Optional<Termino> termino = this.funcionObjetivo.getTermino().stream()
                    .filter(t -> t.getVariable().equals(var))
                    .findFirst();
            f_cj.add(termino.map(Termino::getCoeficiente).orElse(0.0));
        }
        matriz.setF_cj(f_cj);

        // Variables base (c_base), coef CB y VLD
        List<String> c_base = new ArrayList<>();
        List<Double> c_cb = new ArrayList<>();
        List<Double> c_vld = new ArrayList<>();

        for (Restriccion r : this.getRestricciones()) {
            // Se asume que la base inicial son las variables de holgura
            Optional<Termino> baseTerm = r.getFuncionRestricciones().stream()
                    .filter(t -> t.getVariable().startsWith("S") && t.getCoeficiente() == 1.0)
                    .findFirst();

            if (baseTerm.isPresent()) {
                c_base.add(baseTerm.get().getVariable());
                c_cb.add(0.0);
            } else {
                // Si no hay holgura, tomamos la primera variable como base
                Termino t = r.getFuncionRestricciones().get(0);
                c_base.add(t.getVariable());
                int idx = variables.indexOf(t.getVariable());
                c_cb.add(f_cj.get(idx));
            }

            c_vld.add(r.getVld());
        }

        matriz.setC_base(c_base);
        matriz.setC_cb(c_cb);
        matriz.setC_vld(c_vld);

        // Construir matriz de restricciones (solo columnas de variables)
        int filas = this.getRestricciones().size();
        int cols = variables.size();
        double[][] m_restricciones = new double[filas][cols];

        for (int i = 0; i < filas; i++) {
            Restriccion r = this.getRestricciones().get(i);
            for (Termino t : r.getFuncionRestricciones()) {
                int colIndex = variables.indexOf(t.getVariable());
                if (colIndex >= 0) {
                    m_restricciones[i][colIndex] = t.getCoeficiente();
                }
            }
        }

        matriz.setM_restricciones(m_restricciones);

        calcularZjCj(matriz);
        if (this.iteraciones == null) {
            this.iteraciones = new ArrayList<>();
        }
        matriz.verificarVectoresUnitarios();
        this.iteraciones.add(matriz);
    }

    public void calcularZjCj(MatrizSimplex matriz) {
        int columnas = matriz.getF_etiqueta().size();
        int filas = matriz.getC_base().size();

        List<Double> f_zj = new ArrayList<>();
        List<Double> f_cjZj = new ArrayList<>();

        for (int j = 0; j < columnas; j++) {
            double zj = 0.0;
            // Zj = sumatoria de CB_i * a_ij
            for (int i = 0; i < filas; i++) {
                double cb = matriz.getC_cb().get(i);
                double aij = matriz.getM_restricciones()[i][j];
                zj += cb * aij;
            }
            f_zj.add(zj);

            // Cj - Zj
            double cj = matriz.getF_cj().get(j);
            f_cjZj.add(cj - zj);
        }

        matriz.setF_zj(f_zj);
        matriz.setF_cjZj(f_cjZj);
    }
}