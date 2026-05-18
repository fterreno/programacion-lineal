from typing import List

class MatrizSimplex:
    def __init__(
        self,
        fila_cj: List[float],               # Coeficientes de la función objetivo
        fila_etiqueta: List[str],            # Nombre de las columnas
        matriz_restricciones: List[List[float]],  # Matriz de restricciones (ej 5,5,1,0,0)
        fila_zj: List[float],               # Fila Zj
        fila_cj_zj: List[float],            # Fila Cj - Zj
        columna_cb: List[float],            # Coeficiente de las variables base
        columna_base: List[str],            # Variables base
        columna_vld: List[float],           # Valores del lado derecho de la restricción
        variable_entrada: str,
        variable_salida: str
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