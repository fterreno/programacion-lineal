import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

    /* --- hooks (todos al inicio) --- */
    const [indice_actual, setIndiceActual] = useState<number>(0);
    const [direccion, setDireccion] = useState<'down' | 'up'>('down');
    const [cantidad_visible_multi, setCantidadVisible] = useState<number>(1);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const referencia_inferior = useRef<HTMLDivElement>(null);
    const scrollCooldown = useRef(false);

    /* --- derivaciones --- */
    const variables_decision = iteraciones[0]?.fila_etiqueta.filter(
        l => !l.startsWith('S') && !l.startsWith('A')
    ) ?? [];
    const mostrar_grafico = variables_decision.length === 2;

    const iteracion_actual = iteraciones[indice_actual];
    const es_ultima = indice_actual === iteraciones.length - 1;
    const es_solucion_optima = es_ultima && (
        iteracion_actual?.variable_entrada === null ||
        iteracion_actual?.variable_entrada === undefined
    );

    const ultima_iteracion = iteraciones[iteraciones.length - 1];
    const z_optimo_multi = ultima_iteracion
        ? ultima_iteracion.columna_cb.reduce((s, cb, i) => s + cb * ultima_iteracion.columna_vld[i], 0)
        : 0;

    const bfs_actual = iteracion_actual
        ? { x1: ObtenerValorBFS('x1', iteracion_actual), x2: ObtenerValorBFS('x2', iteracion_actual) }
        : { x1: 0, x2: 0 };

    const restricciones = respuesta.problema_solucionado.restricciones;

    /* --- navegación por scroll --- */
    const irSiguiente = useCallback(() => {
        setDireccion('down');
        setIndiceActual(i => Math.min(i + 1, iteraciones.length - 1));
    }, [iteraciones.length]);

    const irAnterior = useCallback(() => {
        setDireccion('up');
        setIndiceActual(i => Math.max(i - 1, 0));
    }, []);

    const manejarScroll = useCallback((e: WheelEvent) => {
        if (!mostrar_grafico) return;
        e.preventDefault();
        if (scrollCooldown.current) return;
        scrollCooldown.current = true;
        setTimeout(() => { scrollCooldown.current = false; }, 600);
        if (e.deltaY > 0) irSiguiente();
        else irAnterior();
    }, [mostrar_grafico, irSiguiente, irAnterior]);

    useEffect(() => {
        if (!mostrar_grafico) return;
        const area = scrollAreaRef.current;
        if (!area) return;
        area.addEventListener('wheel', manejarScroll, { passive: false });
        return () => area.removeEventListener('wheel', manejarScroll);
    }, [mostrar_grafico, manejarScroll]);

    /* scroll suave para modo multi-iteraciones */
    useEffect(() => {
        if (!mostrar_grafico) referencia_inferior.current?.scrollIntoView({ behavior: 'smooth' });
    }, [cantidad_visible_multi, mostrar_grafico]);

    /* --- variantes de animación --- */
    const variantes = {
        entrar: (dir: 'down' | 'up') => ({ opacity: 0, y: dir === 'down' ? 40 : -40 }),
        visible: { opacity: 1, y: 0 },
        salir: (dir: 'down' | 'up') => ({ opacity: 0, y: dir === 'down' ? -40 : 40 }),
    };

    /* === LAYOUT CON GRÁFICO (2 variables) === */
    const z_actual = iteracion_actual
        ? iteracion_actual.columna_cb.reduce((s, cb, i) => s + cb * iteracion_actual.columna_vld[i], 0)
        : 0;

    const layout_con_grafico = (
        <div className={styles.splitLayout}>
            <div>
                <div ref={scrollAreaRef} className={styles.matricesScrollArea}>
                    <AnimatePresence mode="wait" initial={false} custom={direccion}>
                        <motion.div
                            key={indice_actual}
                            custom={direccion}
                            variants={variantes}
                            initial="entrar"
                            animate="visible"
                            exit="salir"
                            transition={{ duration: 0.32, ease: 'easeOut' }}
                        >
                            <SimplexTableau
                                iteracion={iteracion_actual}
                                indice={indice_actual}
                                es_optima={es_solucion_optima}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {es_solucion_optima && (
                        <motion.div
                            className={styles.optimalSection}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            style={{ marginTop: '1.5rem' }}
                        >
                            <div className={styles.optimalBadge}>SOLUCIÓN ÓPTIMA ENCONTRADA</div>
                            <p className={styles.optimalZ}><span>Z* =</span>{Formatear(z_actual)}</p>
                            <div className={styles.bfsValues}>
                                {variables_decision.map(v => (
                                    <div key={v} className={styles.bfsItem}>
                                        <strong>{v}</strong> = {Formatear(ObtenerValorBFS(v, iteracion_actual))}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <p className={styles.scrollHint}>
                        {indice_actual > 0 && '↑ · '}
                        Iteración {indice_actual + 1} de {iteraciones.length}
                        {!es_ultima && ' · ↓ Scroll para avanzar'}
                    </p>
                </div>
            </div>

            <div className={styles.graphPanel}>
                <div className={styles.graphCard}>
                    <h4>Región Factible</h4>
                    <FeasibilityGraph
                        restricciones={restricciones}
                        bfs_actual={bfs_actual}
                        indice_iteracion={indice_actual}
                    />
                </div>
            </div>
        </div>
    );

    /* === LAYOUT SIN GRÁFICO (>2 variables) === */
    const layout_sin_grafico = (
        <div className={styles.singleLayout}>
            <div className={styles.matricesColumn}>
                {iteraciones.slice(0, cantidad_visible_multi).map((iter, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, ease: 'easeOut' }}
                    >
                        <SimplexTableau
                            iteracion={iter}
                            indice={i}
                            es_optima={i === iteraciones.length - 1}
                        />
                    </motion.div>
                ))}

                {cantidad_visible_multi >= iteraciones.length && (
                    <motion.div
                        className={styles.optimalSection}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                    >
                        <div className={styles.optimalBadge}>SOLUCIÓN ÓPTIMA ENCONTRADA</div>
                        <p className={styles.optimalZ}><span>Z* =</span>{Formatear(z_optimo_multi)}</p>
                        <div className={styles.bfsValues}>
                            {variables_decision.map(v => (
                                <div key={v} className={styles.bfsItem}>
                                    <strong>{v}</strong> = {Formatear(ObtenerValorBFS(v, ultima_iteracion))}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {cantidad_visible_multi < iteraciones.length && (
                    <p
                        className={styles.scrollHint}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setCantidadVisible(c => c + 1)}
                    >
                        Ver iteración {cantidad_visible_multi + 1} de {iteraciones.length} ↓
                    </p>
                )}

                <div ref={referencia_inferior} />
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <nav className={styles.nav}>
                <button className={styles.btnNav}>Documentacion</button>
                <button className={styles.btnInicio} onClick={al_volver}>
                    ⌂ Inicio
                </button>
            </nav>

            <div className={styles.pageHeader}>
                <h1>Resolucion Programacion Lineal</h1>
            </div>
            <hr className={styles.separator} />

            <div className={styles.mainContent}>
                {mostrar_grafico ? layout_con_grafico : layout_sin_grafico}
            </div>

            <footer className={styles.footer}>
                <div className={styles.footerLeft}>
                    <p>Terreno Monla,</p>
                    <p>Florencia Sofia</p>
                </div>
                <div className={styles.footerRight}>
                    <p>Progrmacion Lineal Simplex</p>
                </div>
            </footer>
        </div>
    );
};

export default SolutionPage;
