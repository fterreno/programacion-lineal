from abc import ABC, abstractmethod
from entidades.respuesta import Respuesta
from entidades.problema_pl import ProblemaPL


class GeneradorPL(ABC):
    @abstractmethod
    def resolver(self, problema: ProblemaPL) -> Respuesta:
        pass