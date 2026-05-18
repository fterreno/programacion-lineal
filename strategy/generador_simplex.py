from strategy.generador_pl import GeneradorPL
from entidades.respuesta import Respuesta
from entidades.problema_pl import ProblemaPL

class MetodoSimplex(GeneradorPL):

    def resolver(self, problema: ProblemaPL) -> Respuesta:
        problema.validar()
        self.primera_fase(problema)  # Identificación de una solución factible básica.
        while not self.es_solucion(problema):
            self.segunda_fase(problema)

        respuesta = Respuesta()
        respuesta.mensaje = f"Método Simplex: {problema}"
        respuesta.problema_solucionado = problema
        return respuesta

    def primera_fase(self, problema: ProblemaPL) -> None:
        pass  # TODO: implementar

    def segunda_fase(self, problema: ProblemaPL) -> None:
        pass  # TODO: implementar

    def es_solucion(self, problema: ProblemaPL) -> bool:
        pass  # TODO: implementar