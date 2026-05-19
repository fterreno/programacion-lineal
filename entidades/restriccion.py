from typing import List
from entidades.termino import Termino
from entidades.operador import Operador

class Restriccion:
    def __init__(self, funcion_restricciones: List[Termino], operador: Operador, valor_lado_derecho: float):
        self.funcion_restricciones = funcion_restricciones  # Matriz de restricciones, vl izquierdo
        self.operador = operador                            # "<=", ">=", "=", "<", ">"
        self.valor_lado_derecho = valor_lado_derecho        # Límite, ej: 200