import { useState } from 'react';
import LandingPage from './boundaries/landingPage/LandingPage';
import SolutionPage from './boundaries/solutionPage/SolutionPage';
import type { SolicitudRespuesta } from './models/dtos/SolicitudRespuesta';

type EstadoPagina =
  | { pagina: 'inicio' }
  | { pagina: 'solucion'; respuesta: SolicitudRespuesta };

function App() {
  const [estado_pagina, setEstadoPagina] = useState<EstadoPagina>({ pagina: 'inicio' });

  if (estado_pagina.pagina === 'solucion') {
    return (
      <SolutionPage
        respuesta={estado_pagina.respuesta}
        al_volver={() => setEstadoPagina({ pagina: 'inicio' })}
      />
    );
  }

  return (
    <LandingPage
      al_solucionar={(respuesta) => setEstadoPagina({ pagina: 'solucion', respuesta })}
    />
  );
}

export default App;
