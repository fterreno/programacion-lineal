import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { SolicitudRespuesta } from '../../models/dtos/SolicitudRespuesta';
import type { MatrizSimplex } from '../../models/domain/MatrizSimplex';
import styles from './SolutionPage.module.css';
import SimplexTableau from './components/SimplexTableau';
import FeasibilityGraph from './components/FeasibilityGraph';

interface SolutionPageProps {
    respuesta: SolicitudRespuesta;
    al_volver: () => void;
}

const ObtenerValorBFS = (nombre_variable: string, iteracion: MatrizSimplex): number => {
    const indice = iteracion.columna_base.indexOf(nombre_variable);
    return indice === -1 ? 0 : iteracion.columna_vld[indice];
};

const Formatear = (n: number): string => Number(n.toFixed(4)).toString();

const SolutionPage = ({ respuesta, al_volver }: SolutionPageProps) => {
    const iteraciones = respuesta.problema_solucionado.iteraciones ?? [];
    const [cantidad_visible, setCantidadVisible] = useState<number>(1);
    const referencia_inferior = useRef<HTMLDivElement>(null);

    useEffect(() => {
        referencia_inferior.current?.scrollIntoView({ behavior: 'smooth' });
    }, [cantidad_visible]);

    const iteraciones_visibles = iteraciones.slice(0, cantidad_visible);
    const ultima_visible = iteraciones_visibles[iteraciones_visibles.length - 1];
    const es_solucion_optima = ultima_visible?.variable_entrada === null || ultima_visible?.variable_entrada === undefined;
    const hay_mas = cantidad_visible < iteraciones.length;

    const variables_decision = iteraciones[0]?.fila_etiqueta.filter(
        l => !l.startsWith('S') && !l.startsWith('A')
    ) ?? [];
    const mostrar_grafico = variables_decision.length === 2;

    const z_optimo = ultima_visible
        ? ultima_visible.columna_cb.reduce((s, cb, i) => s + cb * ultima_visible.columna_vld[i], 0)
        : 0;

    const bfs_actual = ultima_visible
        ? { x1: ObtenerValorBFS('x1', ultima_visible), x2: ObtenerValorBFS('x2', ultima_visible) }
        : { x1: 0, x2: 0 };

    const restricciones = respuesta.problema_solucionado.restricciones;

    const contenido_matrices = (
        <div className={styles.matricesColumn}>
            {iteraciones_visibles.map((iter, indice) => (
                <motion.div
                    key={indice}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                    <SimplexTableau
                        iteracion={iter}
                        indice={indice}
                        es_optima={indice === iteraciones.length - 1}
                    />
                </motion.div>
            ))}

            {es_solucion_optima && (
                <motion.div
                    className={styles.optimalSection}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                >
                    <div className={styles.optimalBadge}>SOLUCIÓN ÓPTIMA ENCONTRADA</div>
                    <p className={styles.optimalZ}>
                        <span>Z* =</span>{Formatear(z_optimo)}
                    </p>
                    <div className={styles.bfsValues}>
                        {variables_decision.map(v => (
                            <div key={v} className={styles.bfsItem}>
                                <strong>{v}</strong> = {Formatear(ObtenerValorBFS(v, ultima_visible))}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {hay_mas && (
                <button className={styles.btnNext} onClick={() => setCantidadVisible(c => c + 1)}>
                    Ver siguiente iteración →
                </button>
            )}

            <div ref={referencia_inferior} />
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.headerTitle}>
                    Resultado
                    <span>Método Simplex</span>
                </span>
                <button className={styles.btnVolver} onClick={al_volver}>← Volver</button>
            </div>

            {mostrar_grafico ? (
                <div className={styles.splitLayout}>
                    <div>{contenido_matrices}</div>
                    <div className={styles.graphPanel}>
                        <div className={styles.graphCard}>
                            <h4>Región Factible</h4>
                            <FeasibilityGraph
                                restricciones={restricciones}
                                bfs_actual={bfs_actual}
                                indice_iteracion={cantidad_visible - 1}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.singleLayout}>
                    {contenido_matrices}
                </div>
            )}
        </div>
    );
};

export default SolutionPage;
