from typing import List
from entidades.tipo import Tipo
from entidades.termino import Termino
import math

class FuncionObjetivo:

    M: float = 1_000_000.0

    def __init__(self, tipo: Tipo, termino: List[Termino]):
        self.tipo = tipo
        self.termino = termino
    
    def validar(self) -> None:
        if not self.termino:
            raise ValueError("La función objetivo debe tener al menos un término.")
        for t in self.termino:
            if math.isnan(t.coeficiente):
                raise ValueError(f"Coeficiente inválido en un término: {t}")
            if t.variable is None:
                raise ValueError(f"Variable nula en un término: {t}")
            if t.exponente < 0:
                raise ValueError(f"Exponente negativo en un término: {t}")
    

    def variables_holgura(self, nombres_holgura: List[str]) -> None:
        # Agrega variables de holgura/exceso
        if self.termino is None:
            self.termino = []
        for nombre in nombres_holgura:
            existe = any(t.variable == nombre for t in self.termino)
            if not existe:
                holgura = Termino(0.0, nombre, 1.0)
                self.termino.append(holgura)


    def variables_artificiales(self, nombres_artificiales: List[str], tipo: Tipo) -> None:
        # Agrega variables artificiales con penalización ±M según tipo de optimización
        if self.termino is None:
            self.termino = []
        coeficiente = -self.M if tipo == Tipo.MAX else self.M
        for nombre in nombres_artificiales:
            existe = any(t.variable == nombre for t in self.termino)
            if not existe:
                self.termino.append(Termino(coeficiente, nombre, 1.0))


    def obtener_cj(self, etiquetas: List[str]) -> List[float]:
        return [self.obtener_coeficiente_de(var) for var in etiquetas]
    
    
    ## PASO 1 ------------------------------------------------------------------------------------------------

    def obtener_coeficiente_de(self, variable: str) -> float:
        # FuncionObjetivo es la única que sabe cuánto vale una variable.
        for t in self.termino:
            if t.variable == variable:
                return t.coeficiente
        raise ValueError(f"La variable '{variable}' no existe en la función objetivo.")