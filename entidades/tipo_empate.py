from enum import Enum

class TipoEmpate(Enum):
    ENTRADA = "entrada"   # empate en Cj-Zj (múltiples variables candidatas a entrar)
    SALIDA  = "salida"    # empate en θ (múltiples variables candidatas a salir)