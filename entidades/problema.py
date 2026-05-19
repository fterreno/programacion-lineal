from typing import List
from entidades.funcion_objetivo import FuncionObjetivo
from entidades.metodo_tipo import MetodoTipo
from entidades.restriccion import Restriccion
from entidades.matriz import MatrizSimplex

class Problema:
    def __init__(
        self,
        metodo_tipo: MetodoTipo,
        funcion_objetivo: FuncionObjetivo,
        restricciones: List[Restriccion],
        iteraciones: List[MatrizSimplex] = None
    ):
        self.metodo_tipo = metodo_tipo  # Simplex, BaseArtificial
        self.funcion_objetivo = funcion_objetivo
        self.restricciones = restricciones
        self.iteraciones = iteraciones