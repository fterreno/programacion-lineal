from abc import ABC, abstractmethod
from entidades.respuesta import Respuesta
from entidades.problema import Problema


class GeneradorMetodo(ABC):
    @abstractmethod
    def resolver(self, problema: Problema) -> Respuesta:
        pass

    @abstractmethod    
    def primera_fase(self, problema: Problema) -> None:
        pass

    @abstractmethod    
    def segunda_fase(self, problema: Problema) -> None:
        pass
    
    @abstractmethod    
    def es_solucion(self, problema: Problema) -> bool:
        pass