from strategy.generador_metodo import GeneradorMetodo
from entidades.respuesta import Respuesta
from entidades.problema import Problema

class MetodoSimplex(GeneradorMetodo):

    def resolver(self, problema: Problema) -> Respuesta:
        problema.validar()
        self.primera_fase(problema)  # Identificación de una solución factible básica.
        while not self.es_solucion(problema):
            self.segunda_fase(problema)

        respuesta = Respuesta()
        respuesta.mensaje = f"Método Simplex: {problema}"
        respuesta.problema_solucionado = problema
        return respuesta

    def primera_fase(self, problema: Problema) -> None:
        pass  # TODO: implementar

    def segunda_fase(self, problema: Problema) -> None:
        pass  # TODO: implementar

    def es_solucion(self, problema: Problema) -> bool:
        pass  # TODO: implementar