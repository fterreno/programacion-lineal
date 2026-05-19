from entidades.problema import Problema
from entidades.metodo_tipo import MetodoTipo
from strategy.generador_base_artificial import MetodoBaseArtificial
from strategy.generador_metodo import GeneradorMetodo
from strategy.generador_simplex import MetodoSimplex

class ResolutorPL:

    def __init__(self):
        self.estrategias: dict[MetodoTipo, GeneradorMetodo] = {
            MetodoTipo.SIMPLEX:         MetodoSimplex(),
            MetodoTipo.BASE_ARTIFICIAL: MetodoBaseArtificial()
        }

    def resolver(self, problema: Problema):
        estrategia = self.estrategias.get(problema.metodo_tipo)

        if estrategia is None:
            raise ValueError(f"Método no soportado: {problema.metodo_tipo}")

        return estrategia.resolver(problema)