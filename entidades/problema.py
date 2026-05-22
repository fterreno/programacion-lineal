from typing import List
from entidades.funcion_objetivo import FuncionObjetivo
from entidades.metodo_tipo import MetodoTipo
from entidades.operador import Operador
from entidades.restriccion import Restriccion
from entidades.matriz import Matriz

class Problema:
    def __init__(
        self,
        metodo_tipo: MetodoTipo,
        funcion_objetivo: FuncionObjetivo,
        restricciones: List[Restriccion],
        iteraciones: List[Matriz] = None
    ):
        self.metodo_tipo = metodo_tipo  # Simplex, BaseArtificial
        self.funcion_objetivo = funcion_objetivo
        self.restricciones = restricciones
        self.iteraciones = iteraciones
    
    ## VALIDAR ------------------------------------------------------------------------------------------------

    def validar(self) -> None:
        self.funcion_objetivo.validar()
        for r in self.restricciones:
            r.validar()
        self.verificar_variables()
    

    def verificar_variables(self) -> None:
        variables_restricciones = {
            t.variable
            for r in self.restricciones
            for t in r.funcion_restricciones
        }
        for t in self.funcion_objetivo.termino:
            if t.variable not in variables_restricciones:
                raise ValueError("No todas las variables de la función objetivo se encuentran en el conjunto de restricciones.")
            

    def agregar_variables_holgura(self) -> None:
        # Normalizar VLD de cada restricción
        for r in self.restricciones:
            r.normalizar_vld()

        # Identificar y agregar holguras en las restricciones
        numero = 1
        nombres_holgura = []

        for r in self.restricciones:
            if r.operador != Operador.IGUAL:
                nombre_s = f"S{numero}"
                r.variables_holgura(nombre_s)
                nombres_holgura.append(nombre_s)
                numero += 1
            else:
                raise ValueError("Las restricciones no pueden tener una igualdad. Para ello deberá utilizarse una variable artificial.")

        # Informar a la Función Objetivo sobre las nuevas variables
        self.funcion_objetivo.variables_holgura(nombres_holgura)

        # Homogeneizar todas las restricciones (asegurar que todas tengan todas las variables)
        todas_las_vars = self.obtener_todas_las_variables()

        def comparador_simplex(t):
            es_s = t.variable.startswith("S")
            return (1 if es_s else 0, t.variable)

        for r in self.restricciones:
            for var in todas_las_vars:
                r.asegurar_variable(var)
            r.ordenar_terminos(key=comparador_simplex)
    

    def obtener_todas_las_variables(self) -> set:
        return {t.variable for t in self.funcion_objetivo.termino}
    
    def agregar_variables_artificiales(self) -> None:
        # Construye la forma estándar para el Método de la M Grande
        # <= agrega holgura Si(+1), >= agrega exceso Si(-1) + artificial Ai(+1), = agrega solo Ai(+1)
        for r in self.restricciones:
            r.normalizar_vld()

        numero_s = 1
        numero_a = 1
        nombres_holgura = []
        nombres_artificiales = []

        for r in self.restricciones:
            if r.operador in (Operador.MENOR_IGUAL, Operador.MENOR):
                nombre_s = f"S{numero_s}"
                r.variables_holgura(nombre_s)
                nombres_holgura.append(nombre_s)
                numero_s += 1

            elif r.operador in (Operador.MAYOR_IGUAL, Operador.MAYOR):
                nombre_s = f"S{numero_s}"
                r.variables_holgura(nombre_s)
                nombres_holgura.append(nombre_s)
                numero_s += 1
                nombre_a = f"A{numero_a}"
                r.variables_artificiales(nombre_a)
                nombres_artificiales.append(nombre_a)
                numero_a += 1

            elif r.operador == Operador.IGUAL:
                nombre_a = f"A{numero_a}"
                r.variables_artificiales(nombre_a)
                nombres_artificiales.append(nombre_a)
                numero_a += 1

        self.funcion_objetivo.variables_holgura(nombres_holgura)
        self.funcion_objetivo.variables_artificiales(nombres_artificiales, self.funcion_objetivo.tipo)

        todas_las_vars = self._obtener_todas_las_variables()

        # Orden: variables originales → holguras/excesos (S) → artificiales (A)
        def comparador_m_grande(t):
            es_s = t.variable.startswith("S")
            es_a = t.variable.startswith("A")
            es_extra = es_s or es_a
            orden_extra = 1 if es_extra else 0
            orden_tipo  = 1 if es_a else 0  # S antes que A
            return (orden_extra, orden_tipo, t.variable)

        for r in self.restricciones:
            for var in todas_las_vars:
                r.asegurar_variable(var)
            r.ordenar_terminos(key=comparador_m_grande)
    
    ## PASO 1 ------------------------------------------------------------------------------------------------

    def generar_matriz_inicial(self) -> None:
        # Definir etiquetas, los nombres de las variables (originales + holguras)
        etiquetas = [t.variable for t in self.funcion_objetivo.termino]
        cj = self.funcion_objetivo.obtener_cj(etiquetas)

        # Cargar la matriz de las filas desde las Restricciones
        n = len(self.restricciones)
        m = len(etiquetas)
        coeficientes = [[0.0] * m for _ in range(n)]
        base = []
        cb = []
        vld = []

        for i, r in enumerate(self.restricciones):
            vld.append(r.valor_lado_derecho)

            # Llenar matriz de coeficientes
            for t in r.funcion_restricciones:
                col = etiquetas.index(t.variable)
                coeficientes[i][col] = t.coeficiente

            # Lógica de Base, la restricción decide cuál es su variable de holgura
            var_base = r.obtener_base()
            base.append(var_base)
            cb.append(self.funcion_objetivo.obtener_coeficiente_de(var_base))

        matriz_inicial = Matriz(cj, etiquetas, coeficientes, None, None, cb, base, vld, None, None)

        # El objeto Matriz se autocompleta
        matriz_inicial.calcular_solucion_coste()
        matriz_inicial.verificar_vectores_unitarios()

        if self.iteraciones is None:
            self.iteraciones = []
        self.iteraciones.append(matriz_inicial)


    def variable_entrada(self) -> None:
        self.iteraciones[-1].variable_entrada(self.funcion_objetivo.tipo)

    def variable_salida(self) -> None:
        self.iteraciones[-1].variable_salida()

    def actualizar_matriz(self) -> None:
        ultima = self.iteraciones[-1]

        # Copiar fila_cj, etiquetas, columna_cb, columna_base, columna_vld
        nuevo_fila_cj       = list(ultima.fila_cj)
        nuevo_fila_etiqueta = list(ultima.fila_etiqueta)
        nuevo_columna_cb    = list(ultima.columna_cb)
        nuevo_columna_base  = list(ultima.columna_base)
        nuevo_columna_vld   = list(ultima.columna_vld)

        # Copiar matriz de restricciones
        nueva_matriz = [fila[:] for fila in ultima.matriz_restricciones]

        # Determinar posiciones pivote
        columna_pivote = nuevo_fila_etiqueta.index(ultima.variable_entrada)
        fila_pivote = self.calcular_fila_pivote(columna_pivote, nueva_matriz, nuevo_columna_vld)

        # Actualizar base
        posicion_salida = nuevo_columna_base.index(ultima.variable_salida)
        nuevo_columna_base[posicion_salida] = ultima.variable_entrada
        nuevo_columna_cb[posicion_salida]   = ultima.fila_cj[columna_pivote]

        # Normalizar fila pivote
        pivote = nueva_matriz[fila_pivote][columna_pivote]
        nueva_matriz[fila_pivote] = [v / pivote for v in nueva_matriz[fila_pivote]]
        nuevo_columna_vld[fila_pivote] /= pivote

        # Hacer ceros en columna pivote
        for i in range(len(nueva_matriz)):
            if i != fila_pivote:
                factor = nueva_matriz[i][columna_pivote]
                nueva_matriz[i] = [
                    nueva_matriz[i][j] - factor * nueva_matriz[fila_pivote][j]
                    for j in range(len(nueva_matriz[0]))
                ]
                nuevo_columna_vld[i] -= factor * nuevo_columna_vld[fila_pivote]

        # Crear y registrar la nueva MatrizSimplex
        nueva_matriz_simplex = Matriz(nuevo_fila_cj, nuevo_fila_etiqueta, nueva_matriz, None, None, nuevo_columna_cb, nuevo_columna_base, nuevo_columna_vld, None, None)
        nueva_matriz_simplex.calcular_solucion_coste()
        self.iteraciones.append(nueva_matriz_simplex)


    def calcular_fila_pivote(self, columna_pivote: int, matriz_restricciones: List[List[float]], columna_vld: List[float]) -> int:
        min_razon = float("inf")
        fila_pivote = -1

        for i in range(len(matriz_restricciones)):
            denominador = matriz_restricciones[i][columna_pivote]
            if denominador > 0:
                razon = columna_vld[i] / denominador
                if razon < min_razon:
                    min_razon = razon
                    fila_pivote = i

        if fila_pivote == -1:
            raise ValueError("La solución es no acotada.")

        return fila_pivote