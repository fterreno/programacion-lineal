from abc import ABC, abstractmethod
from typing import Optional, Union

from entidades.contexto_resolucion import ContextoResolucion
from entidades.empate import Empate
from entidades.problema import Problema
from entidades.respuesta import Respuesta


class GeneradorMetodo(ABC):
    @abstractmethod
    def resolver(self, problema: Problema, contexto: ContextoResolucion) -> Union[Respuesta, Empate]:
        pass

    @abstractmethod
    def primera_fase(self, problema: Problema) -> None:
        pass

    @abstractmethod
    def segunda_fase(self, problema: Problema, contexto: ContextoResolucion) -> Optional[Empate]:
        pass

    @abstractmethod
    def es_solucion(self, problema: Problema) -> bool:
        pass
