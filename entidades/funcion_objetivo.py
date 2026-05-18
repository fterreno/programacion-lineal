from typing import List
from entidades.tipo import Tipo
from entidades.termino import Termino

class FuncionObjetivo:
    def __init__(self, tipo: Tipo, termino: List[Termino]):
        self.tipo = tipo
        self.termino = termino