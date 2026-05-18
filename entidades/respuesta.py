from entidades.problema import Problema

class Respuesta:
    def __init__(self, mensaje: str = None, problema_solucionado: Problema = None):
        self.mensaje = mensaje                          # public String mensaje
        self.problema_solucionado = problema_solucionado  # public ProblemaPL problema_solucionado
