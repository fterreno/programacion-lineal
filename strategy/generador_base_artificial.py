from entidades.tipo import Tipo
from strategy.generador_metodo import GeneradorMetodo
from entidades.respuesta import Respuesta
from entidades.problema import Problema

class MetodoBaseArtificial(GeneradorMetodo):

    TOLERANCIA: float = 1e-8  # Constante de clase, equivalente a static final

    def resolver(self, problema: Problema) -> Respuesta:
        problema.validar()
        self.primera_fase(problema)
        while not self.es_solucion(problema):
            self.segunda_fase(problema)
        self.verificar_factibilidad(problema)
        respuesta = Respuesta()
        respuesta.mensaje = f"Método Base Artificial: {problema}"
        respuesta.problema_solucionado = problema
        return respuesta


    def primera_fase(self, problema: Problema) -> None:
        # Construye la base inicial con variables artificiales en lugar de solo holguras
        problema.agregar_variables_artificiales()
        problema.generar_matriz_inicial()


    def segunda_fase(self, problema: Problema) -> None:
        problema.variable_entrada()
        problema.variable_salida()
        problema.actualizar_matriz()


    def es_solucion(self, problema: Problema) -> bool:
        ultima = problema.iteraciones[-1]
        if problema.funcion_objetivo.tipo == Tipo.MAX:
            return all(valor <= 0 for valor in ultima.fila_cj_zj)
        else:
            return all(valor >= 0 for valor in ultima.fila_cj_zj)


    def verificar_factibilidad(self, problema: Problema) -> None:
        # Si alguna variable artificial permanece en la base con valor > 0, el problema es infactible
        ultima = problema.iteraciones[-1]
        for i, var_base in enumerate(ultima.columna_base):
            valor = ultima.columna_vld[i]
            if var_base.startswith("A") and abs(valor) > self.TOLERANCIA:
                raise ValueError(
                    f"El problema no tiene solución factible: la variable artificial "
                    f"{var_base} permanece en la base con valor {valor}."
                )