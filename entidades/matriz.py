from typing import List
from entidades.tipo import Tipo

_TOLERANCIA_EMPATE = 1e-9  # margen para considerar dos valores como iguales en el criterio de empate


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

    def calcular_candidatos_entrada(self, tipo: Tipo) -> List[str]:
        """
        Retorna todas las variables que empatan en el criterio de entrada.
        Para MAX: las de mayor Cj-Zj positivo.
        Para MIN: las de menor Cj-Zj negativo.
        Lanza ValueError si la solución ya es óptima (no hay candidatos).
        """
        mejor = 0.0
        candidatos: List[str] = []
        for i, valor in enumerate(self.fila_cj_zj):
            if tipo == Tipo.MAX:
                if valor > mejor + _TOLERANCIA_EMPATE:
                    mejor = valor
                    candidatos = [self.fila_etiqueta[i]]
                elif candidatos and abs(valor - mejor) <= _TOLERANCIA_EMPATE:
                    candidatos.append(self.fila_etiqueta[i])
            elif tipo == Tipo.MIN:
                if valor < mejor - _TOLERANCIA_EMPATE:
                    mejor = valor
                    candidatos = [self.fila_etiqueta[i]]
                elif candidatos and abs(valor - mejor) <= _TOLERANCIA_EMPATE:
                    candidatos.append(self.fila_etiqueta[i])
        if not candidatos:
            raise ValueError("La solución ya es óptima.")
        return candidatos

    def calcular_variable_entrada(self, tipo: Tipo) -> None:
        """Selecciona el primer candidato (sin gestión de empates)."""
        self.variable_entrada = self.calcular_candidatos_entrada(tipo)[0]

    def calcular_candidatos_salida(self) -> List[str]:
        """
        Retorna todas las variables de la base que empatan en el mínimo cociente θ.
        Solo considera filas con denominador > 0 y θ > 0 (igual que el algoritmo original).
        Lanza ValueError si la solución es no acotada.
        """
        columna_pivote = self.fila_etiqueta.index(self.variable_entrada) if self.variable_entrada in self.fila_etiqueta else -1
        if columna_pivote == -1:
            raise ValueError(f"Variable de entrada '{self.variable_entrada}' no encontrada en las etiquetas.")
        tita_minima = float("inf")
        candidatos: List[str] = []
        for i in range(len(self.columna_vld)):
            denominador = self.matriz_restricciones[i][columna_pivote]
            if denominador > 0:
                t = self.columna_vld[i] / denominador
                if t >= 0:  # θ=0 (pivot degenerado) es válido en simplex estándar
                    if t < tita_minima - _TOLERANCIA_EMPATE:
                        tita_minima = t
                        candidatos = [self.columna_base[i]]
                    elif abs(t - tita_minima) <= _TOLERANCIA_EMPATE:
                        candidatos.append(self.columna_base[i])
        if not candidatos:
            raise ValueError("La solución es no acotada.")
        return candidatos

    def calcular_variable_salida(self) -> None:
        """Selecciona el primer candidato (sin gestión de empates)."""
        self.variable_salida = self.calcular_candidatos_salida()[0]