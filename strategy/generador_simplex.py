from entidades.tipo import Tipo
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
        problema.agregar_variables_holgura()   # Convertir el modelo a su forma estándar.
        problema.generar_matriz_inicial()      # Corroborar que tenga m vectores unitarios, si existe una igualdad se utiliza una variable artificial

    def segunda_fase(self, problema: Problema) -> None:
        problema.variable_entrada()
        problema.variable_salida()
        problema.actualizar_matriz()

    def es_solucion(self, problema: Problema) -> bool:
        ultima = problema.iteraciones[-1]  # Última iteración
        if problema.funcion_objetivo.tipo == Tipo.MAX:
            return all(valor <= 0 for valor in ultima.fila_cj_zj)  # Condición de Maximización: (cj-zj) <= 0
        else:
            return all(valor >= 0 for valor in ultima.fila_cj_zj)  # Condición de Minimización: (cj-zj) >= 0