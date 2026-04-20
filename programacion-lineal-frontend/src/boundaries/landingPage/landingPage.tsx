
import { useState } from 'react';
import styles from './landingPage.module.css';
import { BlockMath } from 'react-katex';
import { MetodoTipo } from '../../models/domain/metodoTipo';
import { Tipo } from '../../models/domain/tipo';
import { resolverProblemaPL } from '../../service/programacionLinealService';
import type { SolicitudRespuesta } from '../../models/DTOs/solicitudRespuesta';

interface LandingPageProps {
  onSolucionar: (respuesta: SolicitudRespuesta) => void;
}

const LandingPage = ({ onSolucionar }: LandingPageProps) => {
  const [metodoTipo, setMetodoTipo] = useState<MetodoTipo>(MetodoTipo.Simplex);
  const [tipo, setTipo] = useState<Tipo>(Tipo.MAX);
  const [funcionObjetivo, setFunObj] = useState('');
  const [restricciones, setRestricciones] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    console.log('[handleSubmit] click recibido');
    setError(null);
    setCargando(true);
    try {
      console.log('[handleSubmit] llamando al backend...');
      const respuesta = await resolverProblemaPL(
        funcionObjetivo,
        restricciones,
        metodoTipo,
        tipo
      );
      console.log('[handleSubmit] respuesta recibida:', respuesta);
      onSolucionar(respuesta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[handleSubmit] error:', msg);
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  // Convierte función objetivo a lista de términos
  const parseToKaTeX = (input: string): string => {
    if (!input) return '';

    let formatted = input;

    // x1 → x_{1}
    formatted = formatted.replace(/x(\d+)/g, 'x_{$1}');

    // Potencias
    formatted = formatted.replace(/\^(\d+)/g, '^{$1}');

    // Desigualdades
    formatted = formatted.replace(/<=/g, '\\le ');
    formatted = formatted.replace(/>=/g, '\\ge ');

    return formatted;
  };

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navLinks}>
          <button className={styles.btnSecondary}>Documentación</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.badge}>Para Ingenieros en Sistemas</div>
        <h1 className={styles.title}>
          Aprende Programación Lineal <br />
        </h1>
        <p className={styles.subtitle}>
          Resuelve modelos complejos mediante Simplex, Método Gráfico o Base Artificial.
          Iteraciones detalladas con tablas de pivoteo. Manejo de variables de holgura, exceso y artificiales. Análisis de sensibilidad y precios sombra incluidos.
        </p>
      </header>

      {/* Calculator Section / App Interface */}
      <section className={styles.appSection}>
        <div className={styles.glassCard}>
          <div className={styles.formHeader}>
            <h3>Configuración del Modelo</h3>
            <div className={styles.toggleGroup}>
              <button
                className={tipo === Tipo.MAX ? styles.activeTab : ''}
                onClick={() => setTipo(Tipo.MAX)}
              >Maximizar</button>
              <button
                className={tipo === Tipo.MIN ? styles.activeTab : ''}
                onClick={() => setTipo(Tipo.MIN)}
              >Minimizar</button>
            </div>
          </div>

          <div className={styles.gridInputs}>
            <div className={styles.inputField}>
              <label>Función Objetivo (Z)</label>
              <input type="text" placeholder="ej: 3x1 + 2x2^2 + 6" className={styles.mainInput}
                value={funcionObjetivo} onChange={(e) => setFunObj(e.target.value)} />
            </div>

            <div className={styles.inputField}>
              <label>Método de Resolución</label>
              <select value={metodoTipo} onChange={(e) => setMetodoTipo(MetodoTipo[e.target.value as keyof typeof MetodoTipo])}
                className={styles.selectInput}>
                <option value={MetodoTipo.Simplex}>Método Simplex</option>
                <option value={MetodoTipo.BaseArtificial}>Base Artificial</option>
              </select>
            </div>
          </div>

          <div className={styles.constraintsArea}>
            <label>Restricciones (Forma Explícita)</label>
            <textarea placeholder="ej: 2x1 + x2 <= 10&#10;x1 + 3x2 >= 15" rows={4}
              value={restricciones} onChange={(e) => setRestricciones(e.target.value)} />
          </div>

          {funcionObjetivo && (
            <div className={styles.katexBlock}>
              <h4>Función Objetivo</h4>
              <BlockMath math={`
                      \\begin{aligned}
                        &\\text{${tipo === Tipo.MAX ? 'Max' : 'Min'}}\\ Z = ${parseToKaTeX(funcionObjetivo)} \\\\
                        &\\text{S.A.} \\\\
                        &\\begin{cases}
                          ${restricciones
                  .split('\n')
                  .map(parseToKaTeX)
                  .join(' \\\\ ')}
                        \\end{cases}
                      \\end{aligned}`}
              />
            </div>
          )}

          {error && (
            <div style={{
              marginTop: '1.2rem',
              padding: '1rem 1.2rem',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              fontSize: '0.85rem',
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={cargando}>
            {cargando ? 'Calculando...' : 'Calcular Solución Óptima'}
          </button>

          <p className={styles.disclaimer}>
            * Si el modelo excede las 3 variables, el sistema omitirá la representación gráfica automáticamente.
          </p>
        </div>
      </section >

      {/* Footer / Features sutil */}
      < footer className={styles.footer} >
        <div className={styles.featureGrid}>
          <div className={styles.featureItem}>
            <h4>Tecnologias Utilizadas Backend</h4>
            <p>Maven, Java, Spring Boot</p>
          </div>
          <div className={styles.featureItem}>
            <h4>Desarrolladores</h4>
            <p>Terreno Monla Florencia Sofia</p>
          </div>
          <div className={styles.featureItem}>
            <h4>Tecnologias Utilizadas FrontEnd</h4>
            <p>React, Typescript</p>
          </div>
        </div>
      </footer >
    </div >
  );
};

export default LandingPage;