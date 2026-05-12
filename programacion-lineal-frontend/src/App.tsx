import { useState } from 'react';
import LandingPage from './boundaries/landingPage/LandingPage';
import SolutionPage from './boundaries/solutionPage/SolutionPage';
import ErrorModal from './boundaries/errorModal/ErrorModal';
import type { SolicitudRespuesta } from './models/dtos/SolicitudRespuesta';
import type { MetodoTipo } from './models/domain/MetodoTipo';

type EstadoPagina =
  | { pagina: 'inicio' }
  | { pagina: 'solucion'; respuesta: SolicitudRespuesta; metodo_tipo: MetodoTipo };

type EstadoError = { titulo: string; descripcion: string } | null;

function App() {
  const [estado_pagina, setEstadoPagina] = useState<EstadoPagina>({ pagina: 'inicio' });
  const [error, setError] = useState<EstadoError>(null);

  const alError = (titulo: string, descripcion: string) => setError({ titulo, descripcion });

  return (
    <>
      {error && (
        <ErrorModal
          titulo={error.titulo}
          descripcion={error.descripcion}
          onClose={() => setError(null)}
        />
      )}

      {estado_pagina.pagina === 'solucion' ? (
        <SolutionPage
          respuesta={estado_pagina.respuesta}
          metodo_tipo={estado_pagina.metodo_tipo}
          al_volver={() => setEstadoPagina({ pagina: 'inicio' })}
          al_error={alError}
        />
      ) : (
        <LandingPage
          al_solucionar={(respuesta, metodo_tipo) =>
            setEstadoPagina({ pagina: 'solucion', respuesta, metodo_tipo })
          }
          al_error={alError}
        />
      )}
    </>
  );
}

export default App;
