from typing import List
from entidades.tipo_empate import TipoEmpate


class Empate:
    """
    Señal que emite el algoritmo cuando detecta un empate en el criterio de
    entrada o salida y requiere que el usuario tome una decisión antes de
    continuar con la siguiente iteración.
    """
    def __init__(self, tipo: TipoEmpate, candidatos: List[str]):
        self.tipo       = tipo        # qué criterio generó el empate
        self.candidatos = candidatos  # nombres de las variables empatadas
