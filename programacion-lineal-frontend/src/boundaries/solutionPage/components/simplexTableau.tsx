import type { MatrizSimplex } from '../../../models/domain/matrizSimplex';
import styles from '../solutionPage.module.css';

interface SimplexTableauProps {
    iteracion: MatrizSimplex;
    index: number;
    isOptimal: boolean;
}

const fmt = (n: number): string => {
    const rounded = Number(n.toFixed(4));
    return rounded.toString();
};

const SimplexTableau = ({ iteracion, index, isOptimal }: SimplexTableauProps) => {
    const { f_cj, f_etiqueta, m_restricciones, f_zj, f_cjZj, c_cb, c_base, c_vld, variableEntrada, variableSalida } = iteracion;

    const enteringColIdx = variableEntrada ? f_etiqueta.indexOf(variableEntrada) : -1;
    const leavingRowIdx  = variableSalida  ? c_base.indexOf(variableSalida)      : -1;

    const getCellClass = (row: number, col: number): string => {
        const isE = col === enteringColIdx;
        const isL = row === leavingRowIdx;
        if (isE && isL) return styles.cellPivot;
        if (isE) return styles.cellEntering;
        if (isL) return styles.cellLeaving;
        return '';
    };

    // Z* = sum of cb_i * vld_i
    const zValue = c_cb.reduce((sum, cb, i) => sum + cb * c_vld[i], 0);

    const title = index === 0 ? 'Matriz Inicial' : `Iteración ${index}`;

    return (
        <div className={styles.tableauCard}>
            <div className={styles.tableauHeader}>
                <span className={styles.iterBadge}>{isOptimal ? 'Óptimo' : title}</span>
                <h3>{isOptimal ? 'Solución Óptima' : title}</h3>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.simplexTable}>
                    <thead>
                        {/* Cj row */}
                        <tr>
                            <th>Cj</th>
                            <th></th>
                            <th></th>
                            {f_cj.map((cj, j) => (
                                <th key={j} className={j === enteringColIdx ? styles.cellEntering : ''}>{fmt(cj)}</th>
                            ))}
                        </tr>
                        {/* Header row */}
                        <tr>
                            <th>CB</th>
                            <th>Base</th>
                            <th>VLD</th>
                            {f_etiqueta.map((label, j) => (
                                <th key={j} className={j === enteringColIdx ? styles.cellEntering : ''}>{label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Restriction rows */}
                        {m_restricciones.map((row, i) => (
                            <tr key={i}>
                                <td className={`${styles.labelCell} ${i === leavingRowIdx ? styles.cellLeaving : ''}`}>{fmt(c_cb[i])}</td>
                                <td className={`${styles.labelCell} ${i === leavingRowIdx ? styles.cellLeaving : ''}`}>{c_base[i]}</td>
                                <td className={`${styles.labelCell} ${i === leavingRowIdx ? styles.cellLeaving : ''}`}>{fmt(c_vld[i])}</td>
                                {row.map((val, j) => (
                                    <td key={j} className={getCellClass(i, j)}>{fmt(val)}</td>
                                ))}
                            </tr>
                        ))}
                        {/* Zj row */}
                        <tr className={styles.zjRow}>
                            <td className={styles.labelCell}></td>
                            <td className={styles.labelCell}>Zj</td>
                            <td className={styles.labelCell}>{fmt(zValue)}</td>
                            {f_zj.map((zj, j) => (
                                <td key={j}>{fmt(zj)}</td>
                            ))}
                        </tr>
                        {/* Cj - Zj row */}
                        <tr className={styles.cjZjRow}>
                            <td className={styles.labelCell}></td>
                            <td className={styles.labelCell}>Cj - Zj</td>
                            <td className={styles.labelCell}></td>
                            {f_cjZj.map((val, j) => (
                                <td key={j} className={j === enteringColIdx ? styles.cellEntering : ''}>{fmt(val)}</td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {!isOptimal && variableEntrada && variableSalida && (
                <div className={styles.pivotLegend}>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDotGreen}`} />
                        Entra: <strong>{variableEntrada}</strong>
                    </span>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDotRed}`} />
                        Sale: <strong>{variableSalida}</strong>
                    </span>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDotAmber}`} />
                        Pivote
                    </span>
                </div>
            )}
        </div>
    );
};

export default SimplexTableau;
