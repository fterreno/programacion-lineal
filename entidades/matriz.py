from typing import List

from entidades.tipo import Tipo

class Matriz:
    def __init__(
        self,
        fila_cj:                List[float],                # Coeficientes de la función objetivo
        fila_etiqueta:          List[str],                  # Nombre de las columnas
        matriz_restricciones:   List[List[float]],          # Matriz de restricciones (ej 5,5,1,0,0)
        fila_zj:                List[float],                # Fila Zj
        fila_cj_zj:             List[float],                # Fila Cj - Zj
        columna_cb:             List[float],                # Coeficiente de las variables base
        columna_base:           List[str],                  # Variables base
        columna_vld:            List[float],                # Valores del lado derecho de la restricción
        variable_entrada:       str,
        variable_salida:        str
    ):
        self.fila_cj = fila_cj
        self.fila_etiqueta = fila_etiqueta
        self.matriz_restricciones = matriz_restricciones
        self.fila_zj = fila_zj
        self.fila_cj_zj = fila_cj_zj
        self.columna_cb = columna_cb
        self.columna_base = columna_base
        self.columna_vld = columna_vld
        self.variable_entrada = variable_entrada
        self.variable_salida = variable_salida
    

    ## PASO 1 ------------------------------------------------------------------------------------------------

    def calcular_solucion_coste(self) -> None:
        # Calculamos Zj, el producto escalar de CB por las columnas de la matriz
        self.fila_zj = self.producto_escalar(self.columna_cb, self.matriz_restricciones)
        # Calculamos Cj - Zj, la diferencia para el criterio de optimalidad
        self.fila_cj_zj = self._calcular_cj_zj()

    @staticmethod
    def producto_escalar(a: List[float], B: List[List[float]]) -> List[float]:
        filas = len(B)
        columnas = len(B[0])
        if len(a) != filas:
            raise ValueError("El tamaño del vector debe coincidir con las filas de la matriz.")
        resultado = []
        for j in range(columnas):
            suma = 0.0
            for i in range(filas):
                suma += a[i] * B[i][j]
            resultado.append(suma)
        return resultado


    def _calcular_cj_zj(self) -> List[float]:
        return [cj - zj for cj, zj in zip(self.fila_cj, self.fila_zj)]


    def verificar_vectores_unitarios(self) -> None:
        base = self.columna_base
        m = self.matriz_restricciones
        for i, var_base in enumerate(base):
            indice_columna = self.fila_etiqueta.index(var_base) if var_base in self.fila_etiqueta else -1
            if indice_columna == -1:
                raise ValueError("No posee vectores unitarios, utilizar variable artificial.")
            for fila in range(len(m)):
                valor = m[fila][indice_columna]
                if fila == i:
                    if valor != 1.0:
                        raise ValueError("No posee vectores unitarios, utilizar variable artificial.")
                else:
                    if valor != 0.0:
                        raise ValueError("No posee vectores unitarios, utilizar variable artificial.")


    ## PASO 2 ------------------------------------------------------------------------------------------------

    def variable_entrada(self, tipo: Tipo) -> None:
        posicion = -1
        condicion_entrada = 0.0
        for i, valor in enumerate(self.fila_cj_zj):
            if tipo == Tipo.MAX and valor > condicion_entrada:
                condicion_entrada = valor
                posicion = i
            if tipo == Tipo.MIN and valor < condicion_entrada:
                condicion_entrada = valor
                posicion = i
        if posicion == -1:
            raise ValueError("La solución ya es óptima.")
        self.variable_entrada = self.fila_etiqueta[posicion]


    def variable_salida(self) -> None:
        columna_pivote = self.fila_etiqueta.index(self.variable_entrada) if self.variable_entrada in self.fila_etiqueta else -1
        if columna_pivote == -1:
            raise ValueError(f"Error buscando la posicion de etiqueta en variable_salida: {self.variable_salida}")
        tita = []
        for i in range(len(self.columna_vld)):
            denominador = self.matriz_restricciones[i][columna_pivote]
            if denominador > 0:
                tita.append(self.columna_vld[i] / denominador)
            else:
                tita.append(0.0)
        if all(v <= 0 for v in tita):
            raise ValueError("La solución es no acotada.")
        tita_minimo = float("inf")
        fila_pivote = -1
        for i, valor in enumerate(tita): # si hay dos titas o mas que tienen el mismo valor o estan empatados hay q devolver eso
            if 0 < valor < tita_minimo:
                tita_minimo = valor
                fila_pivote = i
        self.variable_salida = self.columna_base[fila_pivote]