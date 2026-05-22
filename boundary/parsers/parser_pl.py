import re
from typing import List
from entidades.funcion_objetivo import FuncionObjetivo
from entidades.matriz import Matriz
from entidades.metodo_tipo import MetodoTipo
from entidades.problema import Problema
from entidades.restriccion import Restriccion
from entidades.termino import Termino
from entidades.tipo import Tipo
from entidades.operador import Operador

_OPERADORES = {
    '<=': Operador.MENOR_IGUAL,
    '>=': Operador.MAYOR_IGUAL,
    '=':  Operador.IGUAL,
    '<':  Operador.MENOR,
    '>':  Operador.MAYOR,
}

_PATRON_TERMINO = re.compile(
    r'([+-]?\s*\d*\.?\d*)\s*([a-zA-Z][a-zA-Z0-9]*)(?:\^(\d*\.?\d*))?'
)

_PATRON_RESTRICCION = re.compile(r'^(.+?)\s*(<=|>=|=|<|>)\s*(.+)$')


def _parsear_terminos(expresion: str) -> List[Termino]:
    terminos = []
    for match in _PATRON_TERMINO.finditer(expresion):
        coef_str, variable, exp_str = match.groups()
        coef_str = coef_str.replace(' ', '')
        if coef_str in ('', '+'):
            coef_str = '1'
        elif coef_str == '-':
            coef_str = '-1'
        terminos.append(Termino(
            coeficiente=float(coef_str),
            variable=variable,
            exponente=float(exp_str) if exp_str else 1.0
        ))
    return terminos


def parsear_funcion_objetivo(expresion: str, tipo: Tipo) -> FuncionObjetivo:
    return FuncionObjetivo(tipo=tipo, termino=_parsear_terminos(expresion))


def parsear_restriccion(linea: str) -> Restriccion:
    match = _PATRON_RESTRICCION.match(linea.strip())
    if not match:
        raise ValueError(f"Restricción inválida: '{linea}'")
    lado_izq, op_str, lado_der = match.groups()
    return Restriccion(
        funcion_restricciones=_parsear_terminos(lado_izq),
        operador=_OPERADORES[op_str],
        valor_lado_derecho=float(lado_der.strip())
    )


def parsear_restricciones(texto: str) -> List[Restriccion]:
    return [
        parsear_restriccion(linea)
        for linea in texto.strip().splitlines()
        if linea.strip()
    ]

def parsear_problema(metodo_tipo: str, funcion_objetivo: FuncionObjetivo, restricciones: List[Restriccion]) -> Problema:
    return Problema(MetodoTipo[metodo_tipo], funcion_objetivo, restricciones)
