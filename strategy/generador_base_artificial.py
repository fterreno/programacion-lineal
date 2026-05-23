from typing import Optional, Union

from entidades.contexto_resolucion import ContextoResolucion
from entidades.empate import Empate, TipoEmpate
from entidades.problema import Problema
from entidades.respuesta import Respuesta
from entidades.tipo import Tipo
from strategy.generador_metodo import GeneradorMetodo


class MetodoBaseArtificial(GeneradorMetodo):

    TOLERANCIA: float = 1e-8

    def resolver(self, problema: Problema, contexto: ContextoResolucion) -> Union[Respuesta, Empate]:
        problema.validar()
        self.primera_fase(problema)
        while not self.es_solucion(problema):
            empate = self.segunda_fase(problema, contexto)
            if empate is not None:
                return empate
        self.verificar_factibilidad(problema)
        respuesta = Respuesta()
        respuesta.mensaje = f"Método Base Artificial: {problema}"
        respuesta.problema_solucionado = problema
        return respuesta

    def primera_fase(self, problema: Problema) -> None:
        problema.agregar_variables_artificiales()
        problema.generar_matriz_inicial()

    def segunda_fase(self, problema: Problema, contexto: ContextoResolucion) -> Optional[Empate]:
        candidatos_entrada = problema.candidatos_entrada()
        eleccion_entrada = contexto.siguiente_eleccion(candidatos_entrada)
        if eleccion_entrada is None:
            return Empate(TipoEmpate.ENTRADA, candidatos_entrada)
        problema.establecer_variable_entrada(eleccion_entrada)

        candidatos_salida = problema.candidatos_salida()
        eleccion_salida = contexto.siguiente_eleccion(candidatos_salida)
        if eleccion_salida is None:
            return Empate(TipoEmpate.SALIDA, candidatos_salida)
        
        problema.establecer_variable_salida(eleccion_salida)
        problema.actualizar_matriz()
        return None

    def es_solucion(self, problema: Problema) -> bool:
        ultima = problema.iteraciones[-1]
        if problema.funcion_objetivo.tipo == Tipo.MAX:
            return all(valor <= 0 for valor in ultima.fila_cj_zj)
        else:
            return all(valor >= 0 for valor in ultima.fila_cj_zj)

    def verificar_factibilidad(self, problema: Problema) -> None:
        ultima = problema.iteraciones[-1]
        for i, var_base in enumerate(ultima.columna_base):
            valor = ultima.columna_vld[i]
            if var_base.startswith("A") and abs(valor) > self.TOLERANCIA:
                raise ValueError(
                    f"El problema no tiene solución factible: la variable artificial "
                    f"{var_base} permanece en la base con valor {valor}."
                )
