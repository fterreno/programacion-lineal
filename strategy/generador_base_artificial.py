from strategy.generador_pl import GeneradorPL
from entidades.respuesta import Respuesta
from entidades.problema_pl import ProblemaPL

class MetodoBaseArtificial(GeneradorPL):

    TOLERANCIA: float = 1e-8  # Constante de clase, equivalente a static final

    def resolver(self, problema: ProblemaPL) -> Respuesta:
        problema.validar()
        self.primera_fase(problema)
        while not self.es_solucion(problema):
            self.segunda_fase(problema)

        self.verificar_factibilidad(problema)

        respuesta = Respuesta()
        respuesta.mensaje = f"Método Base Artificial: {problema}"
        respuesta.problema_solucionado = problema
        return respuesta

    def primera_fase(self, problema: ProblemaPL) -> None:
        pass  # TODO: implementar

    def segunda_fase(self, problema: ProblemaPL) -> None:
        pass  # TODO: implementar

    def es_solucion(self, problema: ProblemaPL) -> bool:
        pass  # TODO: implementar

    def verificar_factibilidad(self, problema: ProblemaPL) -> None:
        pass  # TODO: implementar