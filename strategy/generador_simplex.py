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
        p = respuesta.problema_solucionado
        print("=== Respuesta Simplex ===")
        print(f"  mensaje      : {respuesta.mensaje}")
        print(f"  metodo_tipo  : {p.metodo_tipo}")
        print(f"  fo tipo      : {p.funcion_objetivo.tipo}")
        print(f"  fo terminos  : {[(t.coeficiente, t.variable) for t in p.funcion_objetivo.termino]}")
        print(f"  restricciones:")
        for r in p.restricciones:
            print(f"    {[(t.coeficiente, t.variable) for t in r.funcion_restricciones]} {r.operador} {r.valor_lado_derecho}")
        print(f"  iteraciones ({len(p.iteraciones)}):")
        for i, m in enumerate(p.iteraciones):
            print(f"    [{i}] cj={m.fila_cj} | etiqueta={m.fila_etiqueta} | zj={m.fila_zj} | cj-zj={m.fila_cj_zj}")
            print(f"         cb={m.columna_cb} | base={m.columna_base} | vld={m.columna_vld}")
            print(f"         matriz={m.matriz_restricciones}")
        print("=========================")
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