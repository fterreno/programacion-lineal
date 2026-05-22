from typing import List
from entidades.termino import Termino
from entidades.operador import Operador
import math

class Restriccion:
    def __init__(self, funcion_restricciones: List[Termino], operador: Operador, valor_lado_derecho: float):
        self.funcion_restricciones = funcion_restricciones  # Matriz de restricciones, vl izquierdo
        self.operador = operador                            # "<=", ">=", "=", "<", ">"
        self.valor_lado_derecho = valor_lado_derecho        # Límite, ej: 200

    
    def validar(self) -> None:
        if math.isnan(self.valor_lado_derecho):  # Verificar límite válido
            raise ValueError(f"El límite de la restricción no es válido: {self.valor_lado_derecho}")

        if self.operador is None:  # Verificar operador no nulo
            raise ValueError("El operador de la restricción no puede ser nulo.")

        if not self.funcion_restricciones:  # Verificar términos
            raise ValueError("La restricción debe tener al menos un término.")

        for t in self.funcion_restricciones:  # Validar cada término de la funcion_restricciones
            if math.isnan(t.coeficiente):
                raise ValueError(f"Coeficiente inválido en un término de la restricción: {t}")
            if t.variable is None:
                raise ValueError(f"Variable nula en un término de la restricción: {t}")
            if t.exponente < 0:
                raise ValueError(f"Exponente negativo en un término de la restricción: {t}")
            

    def normalizar_vld(self) -> None:
        # En el caso de que en el vector del lado derecho exista algún valor negativo
        # deberán multiplicarse ambos miembros de la restricción por -1.
        if self.valor_lado_derecho < 0:
            for t in self.funcion_restricciones:
                t.coeficiente *= -1
            self.invertir_operador()
            self.valor_lado_derecho *= -1


    def variables_holgura(self, nombre_variable: str) -> None:
        # Agrega las holguras o excesos correspondientes
        if self.operador == Operador.IGUAL:
            return
        coeficiente = 1.0 if self.operador in (Operador.MENOR_IGUAL, Operador.MENOR) else -1.0
        holgura = Termino(coeficiente, nombre_variable, 1.0)
        self.funcion_restricciones.append(holgura)

    def variables_artificiales(self, nombre_variable: str) -> None:
        # Agrega una variable artificial con coeficiente +1 para construir el vector unitario base
        artificial = Termino(1.0, nombre_variable, 1.0)
        self.funcion_restricciones.append(artificial)

    def asegurar_variable(self, nombre_variable: str) -> None:
        # Asegura que se encuentren todas las variables (misma cantidad) para la matriz
        existe = any(t.variable == nombre_variable for t in self.funcion_restricciones)
        if not existe:
            cero = Termino(0.0, nombre_variable, 1.0)
            self.funcion_restricciones.append(cero)

    def ordenar_terminos(self, key) -> None:
        # Ordena los términos: primero las variables y luego variables holgura/excesos
        self.funcion_restricciones.sort(key=key)

    def invertir_operador(self) -> None:
        # En el caso de que en el vector del lado derecho exista algún valor negativo
        # deberán multiplicarse ambos miembros de la restricción por -1.
        inversiones = {
            Operador.MENOR_IGUAL: Operador.MAYOR_IGUAL,
            Operador.MAYOR_IGUAL: Operador.MENOR_IGUAL,
            Operador.MENOR:       Operador.MAYOR,
            Operador.MAYOR:       Operador.MENOR,
        }
        self.operador = inversiones.get(self.operador, self.operador)

    ## PASO 1 ------------------------------------------------------------------------------------------------

    def obtener_base(self) -> str:
        for t in self.funcion_restricciones:
            if (t.variable.startswith("S") or t.variable.startswith("A")) and t.coeficiente == 1.0:
                return t.variable
        raise ValueError("No se encontró variable de base válida (holgura o artificial) para esta restricción.")
    