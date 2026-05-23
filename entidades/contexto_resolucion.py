from typing import List, Optional


class ContextoResolucion:
    """
    Gestiona la secuencia de elecciones del usuario ante empates.

    Patrón: Context (complementa al Strategy GeneradorMetodo).

    Funcionamiento replay stateless:
    - El cliente acumula elecciones como lista ordenada.
    - En cada re-ejecución el algoritmo recorre la lista en orden; cuando hay
      un único candidato lo consume sin gastar elección; cuando hay empate y
      queda elección pre-grabada la consume; si no queda ninguna devuelve None
      para que el route señale la pausa a la UI.
    """

    def __init__(self, elecciones: List[str] = None):
        self._elecciones: List[str] = list(elecciones or [])
        self._cursor: int = 0

    def siguiente_eleccion(self, candidatos: List[str]) -> Optional[str]:
        """
        Retorna la variable elegida para este punto de decisión.

        - Candidato único  →  lo retorna directamente (no hay empate real).
        - Empate con elección pre-grabada  →  la consume y la retorna.
        - Empate sin elección disponible   →  retorna None  (señal para la UI).
        """
        if len(candidatos) == 1:
            return candidatos[0]
        if self._cursor < len(self._elecciones):
            eleccion = self._elecciones[self._cursor]
            self._cursor += 1
            return eleccion
        return None
