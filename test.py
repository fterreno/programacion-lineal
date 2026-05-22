import pytest

from controller.resolutor_pl import ResolutorPL
from entidades.problema import Problema
from entidades.funcion_objetivo import FuncionObjetivo
from entidades.restriccion import Restriccion
from entidades.termino import Termino
from entidades.metodo_tipo import MetodoTipo
from entidades.tipo import Tipo
from entidades.operador import Operador

def _resolver_simplex(funcion_obj, restricciones):
    problema = Problema(MetodoTipo.SIMPLEX, funcion_obj, restricciones)
    return ResolutorPL().resolver(problema)

def _respuesta_simplex(respuesta):
    p = respuesta.problema_solucionado
    ultima_iteracion = p.iteraciones[-1]
    base = []
    vld = []
    # construir con append
    for i in range(len(ultima_iteracion.columna_vld)):
        base.append(ultima_iteracion.columna_base[i])
        vld.append(ultima_iteracion.columna_vld[i])

    return  dict(zip(base, vld))

@pytest.mark.parametrize("funcion_obj, restricciones, esperado", [
    (
        FuncionObjetivo(Tipo.MAX, [
            Termino(10.0, 'x1', 1.0),
            Termino(6.0, 'x2', 1.0)
        ]),
        [
            Restriccion([Termino(8.0, 'x1', 1.0), Termino(4.0, 'x2', 1.0)], Operador.MENOR_IGUAL, 24.0),
            Restriccion([Termino(8.0, 'x1', 1.0), Termino(2.0, 'x2', 1.0)], Operador.MENOR_IGUAL, 20.0),
            Restriccion([Termino(2.0, 'x1', 1.0), Termino(2.0, 'x2', 1.0)], Operador.MENOR_IGUAL, 8.0),
        ],
        {"x1": 2.0, "x2": 2.0, "S3": 0.0}
    ),
    (
        FuncionObjetivo(Tipo.MAX, [
            Termino(800.0, 'x1', 1.0),
            Termino(1400.0, 'x2', 1.0)
        ]),
        [
            Restriccion([Termino(11.0, 'x1', 1.0), Termino(22.0, 'x2', 1.0)], Operador.MENOR_IGUAL, 352.0),
            Restriccion([Termino(5.0, 'x1', 1.0), Termino(8.0, 'x2', 1.0)], Operador.MENOR_IGUAL, 132.0),
            Restriccion([Termino(3.0, 'x1', 1.0), Termino(5.0, 'x2', 1.0)], Operador.MENOR_IGUAL, 88.0),
        ],
        {"x1": 4.0, "x2": 14.0, "S3": 6.0}
    ),
])


def test_simplex(funcion_obj, restricciones, esperado):
    respuesta = _resolver_simplex(funcion_obj, restricciones)
    solucion = _respuesta_simplex(respuesta)

    assert solucion == esperado

# def imprimir_respuesta(respuesta):
#     p = respuesta.problema_solucionado
#     print("=== Respuesta Simplex ===")
#     print(f"  mensaje      : {respuesta.mensaje}")
#     print(f"  metodo_tipo  : {p.metodo_tipo}")
#     print(f"  fo tipo      : {p.funcion_objetivo.tipo}")
#     print(f"  fo terminos  : {[(t.coeficiente, t.variable) for t in p.funcion_objetivo.termino]}")
#     print(f"  restricciones:")
#     for r in p.restricciones:
#         print(f"    {[(t.coeficiente, t.variable) for t in r.funcion_restricciones]} {r.operador} {r.valor_lado_derecho}")
#     print(f"  iteraciones ({len(p.iteraciones)}):")
#     for i, m in enumerate(p.iteraciones):
#         print(f"    [{i}] cj={m.fila_cj} | etiqueta={m.fila_etiqueta} | zj={m.fila_zj} | cj-zj={m.fila_cj_zj}")
#         print(f"         cb={m.columna_cb} | base={m.columna_base} | vld={m.columna_vld}")
#         print(f"         matriz={m.matriz_restricciones}")
#     print("=========================")