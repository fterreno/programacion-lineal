import type { MatrizSimplex } from '../../../models/domain/MatrizSimplex';
import styles from '../SolutionPage.module.css';

interface SimplexTableauProps {
    iteracion: MatrizSimplex;
    indice: number;
    es_optima: boolean;
}

const Formatear = (n: number): string => {
    const redondeado = Number(n.toFixed(4));
    return redondeado.toString();
};

const SimplexTableau = ({ iteracion, indice, es_optima }: SimplexTableauProps) => {
    const { fila_cj, fila_etiqueta, matriz_restricciones, fila_zj, fila_cj_zj, columna_cb, columna_base, columna_vld, variable_entrada, variable_salida } = iteracion;

    const indice_columna_entrada = variable_entrada ? fila_etiqueta.indexOf(variable_entrada) : -1;
    const indice_fila_salida    = variable_salida  ? columna_base.indexOf(variable_salida)   : -1;

    const ObtenerClaseCelda = (fila: number, columna: number): string => {
        const es_entrada = columna === indice_columna_entrada;
        const es_salida  = fila   === indice_fila_salida;
        if (es_entrada && es_salida) return styles.cellPivot;
        if (es_entrada) return styles.cellEntering;
        if (es_salida)  return styles.cellLeaving;
        return '';
    };

    const valor_z = columna_cb.reduce((suma, cb, i) => suma + cb * columna_vld[i], 0);
    const titulo  = indice === 0 ? 'Matriz Inicial' : `Iteración ${indice}`;

    return (
        <div className={styles.tableauCard}>
            <div className={styles.tableauHeader}>
                <span className={styles.iterBadge}>{es_optima ? 'Óptimo' : titulo}</span>
                <h3>{es_optima ? 'Solución Óptima' : titulo}</h3>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.simplexTable}>
                    <thead>
                        <tr>
                            <th>Cj</th>
                            <th></th>
                            <th></th>
                            {fila_cj.map((cj, j) => (
                                <th key={j} className={j === indice_columna_entrada ? styles.cellEntering : ''}>{Formatear(cj)}</th>
                            ))}
                        </tr>
                        <tr>
                            <th>CB</th>
                            <th>Base</th>
                            <th>VLD</th>
                            {fila_etiqueta.map((etiqueta, j) => (
                                <th key={j} className={j === indice_columna_entrada ? styles.cellEntering : ''}>{etiqueta}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matriz_restricciones.map((fila, i) => (
                            <tr key={i}>
                                <td className={`${styles.labelCell} ${i === indice_fila_salida ? styles.cellLeaving : ''}`}>{Formatear(columna_cb[i])}</td>
                                <td className={`${styles.labelCell} ${i === indice_fila_salida ? styles.cellLeaving : ''}`}>{columna_base[i]}</td>
                                <td className={`${styles.labelCell} ${i === indice_fila_salida ? styles.cellLeaving : ''}`}>{Formatear(columna_vld[i])}</td>
                                {fila.map((val, j) => (
                                    <td key={j} className={ObtenerClaseCelda(i, j)}>{Formatear(val)}</td>
                                ))}
                            </tr>
                        ))}
                        <tr className={styles.zjRow}>
                            <td className={styles.labelCell}></td>
                            <td className={styles.labelCell}>Zj</td>
                            <td className={styles.labelCell}>{Formatear(valor_z)}</td>
                            {fila_zj.map((zj, j) => (
                                <td key={j}>{Formatear(zj)}</td>
                            ))}
                        </tr>
                        <tr className={styles.cjZjRow}>
                            <td className={styles.labelCell}></td>
                            <td className={styles.labelCell}>Cj - Zj</td>
                            <td className={styles.labelCell}></td>
                            {fila_cj_zj.map((val, j) => (
                                <td key={j} className={j === indice_columna_entrada ? styles.cellEntering : ''}>{Formatear(val)}</td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {!es_optima && variable_entrada && variable_salida && (
                <div className={styles.pivotLegend}>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDotGreen}`} />
                        Entra: <strong>{variable_entrada}</strong>
                    </span>
                    <span className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDotRed}`} />
                        Sale: <strong>{variable_salida}</strong>
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
