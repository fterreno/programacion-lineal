
import { useState } from 'react';
import styles from './LandingPage.module.css';
import { BlockMath } from 'react-katex';
import { MetodoTipo } from '../../models/domain/MetodoTipo';
import { Tipo } from '../../models/domain/Tipo';
import { ResolverProblemaPL, ErrorPL } from '../../service/ProgramacionLinealService';
import type { SolicitudRespuesta } from '../../models/dtos/SolicitudRespuesta';

interface LandingPageProps {
  al_solucionar: (respuesta: SolicitudRespuesta) => void;
  al_error: (titulo: string, descripcion: string) => void;
}

const LandingPage = ({ al_solucionar, al_error }: LandingPageProps) => {
  const [metodo_tipo, setMetodoTipo] = useState<MetodoTipo>(MetodoTipo.simplex);
  const [tipo, setTipo] = useState<Tipo>(Tipo.MAX);
  const [funcion_objetivo, setFuncionObjetivo] = useState('');
  const [restricciones, setRestricciones] = useState('');
  const [cargando, setCargando] = useState(false);

  const ManejarEnvio = async () => {
    setCargando(true);
    try {
      const respuesta = await ResolverProblemaPL(
        funcion_objetivo,
        restricciones,
        metodo_tipo,
        tipo
      );
      al_solucionar(respuesta);
    } catch (err: unknown) {
      if (err instanceof ErrorPL) {
        al_error(err.titulo, err.message);
      } else {
        al_error('Error', err instanceof Error ? err.message : 'Error desconocido');
      }
    } finally {
      setCargando(false);
    }
  };

  const ConvertirAKaTeX = (input: string): string => {
    if (!input) return '';
    let formateado = input;
    formateado = formateado.replace(/x(\d+)/g, 'x_{$1}');
    formateado = formateado.replace(/\^(\d+)/g, '^{$1}');
    formateado = formateado.replace(/<=/g, '\\le ');
    formateado = formateado.replace(/>=/g, '\\ge ');
    return formateado;
  };

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <button className={styles.btnSecondary} onClick={() => window.open(`${import.meta.env.BASE_URL}apoyo_cuantitativo_decisiones_2020.pdf`, '_blank')}>Documentacion</button>
        <button className={styles.btnSecondary} onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSda5dXlkqvtewRTXsjPikoAsJhq5dMxG7y5wezESgB0TfZoCA/viewform?usp=publish-editor', '_blank')}>Formulario Errores</button>
      </nav>

      <header className={styles.hero}>
        <h1 className={styles.title}>Resuelve Programacion Lineal</h1>
        <p className={styles.subtitle}>
          Resuelve modelos complejos mediante Simplex, Método Gráfico o Base Artificial.
          Iteraciones detalladas con tablas de pivoteo. Manejo de variables de holgura, exceso y artificiales.
          Análisis de sensibilidad y precios sombra incluidos.
        </p>
      </header>

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
              <input
                type="text"
                placeholder="ej: 3x1 + 2x2"
                className={styles.mainInput}
                value={funcion_objetivo}
                onChange={(e) => setFuncionObjetivo(e.target.value)}
              />
            </div>

            <div className={styles.inputField}>
              <label>Método de Resolución</label>
              <select
                value={metodo_tipo}
                onChange={(e) => setMetodoTipo(MetodoTipo[e.target.value as keyof typeof MetodoTipo])}
                className={styles.selectInput}
              >
                <option value={MetodoTipo.simplex}>Método Simplex</option>
                <option value={MetodoTipo.base_artificial}>Base Artificial</option>
              </select>
            </div>
          </div>

          <div className={styles.constraintsArea}>
            <label>Restricciones (Forma Explícita)</label>
            <textarea
              placeholder="ej: 2x1 + x2 <= 10&#10;x1 + 3x2 >= 15"
              rows={4}
              value={restricciones}
              onChange={(e) => setRestricciones(e.target.value)}
            />
          </div>

          {funcion_objetivo && (
            <div className={styles.katexBlock}>
              <h4>Función Objetivo</h4>
              <BlockMath math={`
                \\begin{aligned}
                  &\\text{${tipo === Tipo.MAX ? 'Max' : 'Min'}}\\ Z = ${ConvertirAKaTeX(funcion_objetivo)} \\\\
                  &\\text{S.A.} \\\\
                  &\\begin{cases}
                    ${restricciones.split('\n').map(ConvertirAKaTeX).join(' \\\\ ')}
                  \\end{cases}
                \\end{aligned}`}
              />
            </div>
          )}

          <button className={styles.btnPrimary} onClick={ManejarEnvio} disabled={cargando}>
            {cargando ? 'Calculando...' : 'Calcular Solución Óptima'}
          </button>

          <p className={styles.disclaimer}>
            * Si el modelo excede las 2 variables, el sistema omitirá la representación gráfica automáticamente.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <p>Desarrollador</p>
          <p>Terreno Monla Florencia Sofia</p>
        </div>
        <div className={styles.footerRight}>
          <p>Progrmacion Lineal</p>
          <p>Metodo Simplex</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
