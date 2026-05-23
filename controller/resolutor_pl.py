from entidades.contexto_resolucion import ContextoResolucion
from entidades.metodo_tipo import MetodoTipo
from entidades.problema import Problema
from strategy.generador_base_artificial import MetodoBaseArtificial
from strategy.generador_metodo import GeneradorMetodo
from strategy.generador_simplex import MetodoSimplex


class ResolutorPL:

    def __init__(self):
        self.estrategias: dict[MetodoTipo, GeneradorMetodo] = {
            MetodoTipo.SIMPLEX:         MetodoSimplex(),
            MetodoTipo.BASE_ARTIFICIAL: MetodoBaseArtificial()
        }

    def resolver(self, problema: Problema, contexto: ContextoResolucion = None):
        if contexto is None:
            contexto = ContextoResolucion()
        estrategia = self.estrategias.get(problema.metodo_tipo)
        if estrategia is None:
            raise ValueError(f"Método no soportado: {problema.metodo_tipo}")
        return estrategia.resolver(problema, contexto)
