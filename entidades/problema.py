from entidades.metodo_tipo import MetodoTipo
from entidades.problema_pl import ProblemaPL

class Problema:
    def __init__(self, metodo_tipo: MetodoTipo, problema: ProblemaPL):
        self.metodo_tipo = metodo_tipo  # Simplex, BaseArtificial
        self.problema = problema