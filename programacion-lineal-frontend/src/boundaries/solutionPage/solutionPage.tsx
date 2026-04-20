import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { SolicitudRespuesta } from '../../models/DTOs/solicitudRespuesta';
import type { MatrizSimplex } from '../../models/domain/matrizSimplex';
import styles from './solutionPage.module.css';
import SimplexTableau from './components/simplexTableau';
import FeasibilityGraph from './components/feasibilityGraph';

interface SolutionPageProps {
    respuesta: SolicitudRespuesta;
    onVolver: () => void;
}

const getBFSValue = (varName: string, iter: MatrizSimplex): number => {
    const idx = iter.c_base.indexOf(varName);
    return idx === -1 ? 0 : iter.c_vld[idx];
};

const fmt = (n: number): string => Number(n.toFixed(4)).toString();

const SolutionPage = ({ respuesta, onVolver }: SolutionPageProps) => {
    const iteraciones = respuesta.problemaSolucionado.iteraciones ?? [];
    const [visibleCount, setVisibleCount] = useState<number>(1);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleCount]);

    const iteracionesVisibles = iteraciones.slice(0, visibleCount);
    const ultimaVisible = iteracionesVisibles[iteracionesVisibles.length - 1];
    const esSolucionOptima = ultimaVisible?.variableEntrada === null || ultimaVisible?.variableEntrada === undefined;
    const hayMas = visibleCount < iteraciones.length;

    // Detect decision variables (exclude S* and A* prefixes)
    const decisionVars = iteraciones[0]?.f_etiqueta.filter(
        l => !l.startsWith('S') && !l.startsWith('A')
    ) ?? [];
    const showGraph = decisionVars.length === 2;

    // Z* and BFS for the current visible iteration
    const zOptimo = ultimaVisible
        ? ultimaVisible.c_cb.reduce((s, cb, i) => s + cb * ultimaVisible.c_vld[i], 0)
        : 0;

    const currentBFS = ultimaVisible
        ? { x1: getBFSValue('x1', ultimaVisible), x2: getBFSValue('x2', ultimaVisible) }
        : { x1: 0, x2: 0 };

    const restricciones = respuesta.problemaSolucionado.restricciones;

    const matricesContent = (
        <div className={styles.matricesColumn}>
            {iteracionesVisibles.map((iter, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                    <SimplexTableau
                        iteracion={iter}
                        index={idx}
                        isOptimal={idx === iteraciones.length - 1}
                    />
                </motion.div>
            ))}

            {esSolucionOptima && (
                <motion.div
                    className={styles.optimalSection}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                >
                    <div className={styles.optimalBadge}>SOLUCIÓN ÓPTIMA ENCONTRADA</div>
                    <p className={styles.optimalZ}>
                        <span>Z* =</span>{fmt(zOptimo)}
                    </p>
                    <div className={styles.bfsValues}>
                        {decisionVars.map(v => (
                            <div key={v} className={styles.bfsItem}>
                                <strong>{v}</strong> = {fmt(getBFSValue(v, ultimaVisible))}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {hayMas && (
                <button className={styles.btnNext} onClick={() => setVisibleCount(c => c + 1)}>
                    Ver siguiente iteración →
                </button>
            )}

            <div ref={bottomRef} />
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.headerTitle}>
                    Resultado
                    <span>Método Simplex</span>
                </span>
                <button className={styles.btnVolver} onClick={onVolver}>← Volver</button>
            </div>

            {showGraph ? (
                <div className={styles.splitLayout}>
                    <div>{matricesContent}</div>
                    <div className={styles.graphPanel}>
                        <div className={styles.graphCard}>
                            <h4>Región Factible</h4>
                            <FeasibilityGraph
                                restricciones={restricciones}
                                currentBFS={currentBFS}
                                iteracionIndex={visibleCount - 1}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.singleLayout}>
                    {matricesContent}
                </div>
            )}
        </div>
    );
};

export default SolutionPage;
