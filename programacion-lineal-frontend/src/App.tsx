import { useState } from 'react';
import LandingPage from './boundaries/landingPage/LandingPage';
import SolutionPage from './boundaries/solutionPage/SolutionPage';
import ErrorModal from './boundaries/errorModal/ErrorModal';
import type { SolicitudRespuesta } from './models/dtos/SolicitudRespuesta';

type EstadoPagina =
  | { pagina: 'inicio' }
  | { pagina: 'solucion'; respuesta: SolicitudRespuesta };

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
          al_volver={() => setEstadoPagina({ pagina: 'inicio' })}
        />
      ) : (
        <LandingPage
          al_solucionar={(respuesta) => setEstadoPagina({ pagina: 'solucion', respuesta })}
          al_error={alError}
        />
      )}
    </>
  );
}

export default App;
