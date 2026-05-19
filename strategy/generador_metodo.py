from abc import ABC, abstractmethod
from entidades.respuesta import Respuesta
from entidades.problema import Problema


class GeneradorMetodo(ABC):
    @abstractmethod
    def resolver(self, problema: Problema) -> Respuesta:
        pass