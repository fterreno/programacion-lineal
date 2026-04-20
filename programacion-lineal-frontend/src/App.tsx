import { useState } from 'react';
import LandingPage from './boundaries/landingPage/landingPage';
import SolutionPage from './boundaries/solutionPage/solutionPage';
import type { SolicitudRespuesta } from './models/DTOs/solicitudRespuesta';

type PageState =
  | { page: 'landing' }
  | { page: 'solution'; respuesta: SolicitudRespuesta };

function App() {
  const [pageState, setPageState] = useState<PageState>({ page: 'landing' });

  if (pageState.page === 'solution') {
    return (
      <SolutionPage
        respuesta={pageState.respuesta}
        onVolver={() => setPageState({ page: 'landing' })}
      />
    );
  }

  return (
    <LandingPage
      onSolucionar={(respuesta) => setPageState({ page: 'solution', respuesta })}
    />
  );
}

export default App;
