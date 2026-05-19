from typing import Dict, List
from entidades.funcion_objetivo import FuncionObjetivo
from entidades.restriccion import Restriccion
from entidades.metodo_tipo import MetodoTipo

class ResolutorPL:

    def resolver(funcion_objetivo: FuncionObjetivo, restricciones: List[Restriccion], metodo_tipo: MetodoTipo):
        
        print(f"funcion_objetivo: tipo={funcion_objetivo.tipo}, terminos={[(t.coeficiente, t.variable, t.exponente) for t in funcion_objetivo.termino]}")
        print(f"restricciones:")
        for r in restricciones:
            print(f"  {[(t.coeficiente, t.variable, t.exponente) for t in r.funcion_restricciones]} {r.operador} {r.valor_lado_derecho}")
        print(f"metodo_tipo: {metodo_tipo}")

        
        pass