from typing import List
from entidades.funcion_objetivo import FuncionObjetivo
from entidades.retriccion import Restriccion
from entidades.matriz import MatrizSimplex

class ProblemaPL:
    def __init__(
        self,
        funcion_objetivo: FuncionObjetivo,
        restricciones: List[Restriccion],
        iteraciones: List[MatrizSimplex]
    ):
        self.funcion_objetivo = funcion_objetivo
        self.restricciones = restricciones
        self.iteraciones = iteraciones