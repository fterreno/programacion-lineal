import {
    ComposedChart, Line, Scatter, XAxis, YAxis,
    CartesianGrid, ResponsiveContainer, Customized,
} from 'recharts';
import type { Restriccion } from '../../../models/domain/Restriccion';

interface FeasibilityGraphProps {
    restricciones: Restriccion[];
    bfs_actual: { x1: number; x2: number };
    indice_iteracion: number;
}

interface RechartsScaleContext {
    xAxisMap?: Record<string, { scale: (v: number) => number }>;
    yAxisMap?: Record<string, { scale: (v: number) => number }>;
}

/* ── Funciones matemáticas puras ────────────────────────────────────────── */

const ObtenerCoeficiente = (r: Restriccion, nombre: string): number =>
    r.funcion_restricciones.find(t => t.variable === nombre)?.coeficiente ?? 0;

const ResolverSistemaLineal = (
    a1: number, b1: number, c1: number,
    a2: number, b2: number, c2: number
): [number, number] | null => {
    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-10) return null;
    return [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det];
};

const EsFactible = (x: number, y: number, restricciones: Restriccion[]): boolean => {
    if (x < -1e-9 || y < -1e-9) return false;
    return restricciones.every(r => {
        const li = ObtenerCoeficiente(r, 'x1') * x + ObtenerCoeficiente(r, 'x2') * y;
        const ld = r.valor_lado_derecho;
        switch (r.operador) {
            case 'menor_igual': return li <= ld + 1e-9;
            case 'mayor_igual': return li >= ld - 1e-9;
            case 'igual':       return Math.abs(li - ld) < 1e-9;
            default:            return true;
        }
    });
};

const OrdenarPorAngulo = (puntos: [number, number][]): [number, number][] => {
    if (puntos.length === 0) return [];
    const cx = puntos.reduce((s, p) => s + p[0], 0) / puntos.length;
    const cy = puntos.reduce((s, p) => s + p[1], 0) / puntos.length;
    return [...puntos].sort((a, b) =>
        Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)
    );
};

const ConstruirVerticesFactibles = (restricciones: Restriccion[]): [number, number][] => {
    type Linea = { a: number; b: number; c: number };
    const lineas: Linea[] = restricciones.map(r => ({
        a: ObtenerCoeficiente(r, 'x1'), b: ObtenerCoeficiente(r, 'x2'), c: r.valor_lado_derecho,
    }));
    lineas.push({ a: 1, b: 0, c: 0 }, { a: 0, b: 1, c: 0 });
    const candidatos: [number, number][] = [];
    for (let i = 0; i < lineas.length; i++)
        for (let j = i + 1; j < lineas.length; j++) {
            const p = ResolverSistemaLineal(
                lineas[i].a, lineas[i].b, lineas[i].c,
                lineas[j].a, lineas[j].b, lineas[j].c,
            );
            if (p && EsFactible(p[0], p[1], restricciones)) candidatos.push(p);
        }
    return OrdenarPorAngulo(candidatos);
};

const FormatearCoordenada = (n: number): string => Number(n.toFixed(2)).toString();

/* Todas las intersecciones en el cuadrante positivo (con ejes incluidos) */
const ObtenerTodasIntersecciones = (
    restricciones: Restriccion[],
    max_x: number,
    max_y: number,
): [number, number][] => {
    type Linea = { a: number; b: number; c: number };
    const lineas: Linea[] = restricciones.map(r => ({
        a: ObtenerCoeficiente(r, 'x1'), b: ObtenerCoeficiente(r, 'x2'), c: r.valor_lado_derecho,
    }));
    lineas.push({ a: 1, b: 0, c: 0 }, { a: 0, b: 1, c: 0 });

    const resultado: [number, number][] = [];
    for (let i = 0; i < lineas.length; i++)
        for (let j = i + 1; j < lineas.length; j++) {
            const p = ResolverSistemaLineal(
                lineas[i].a, lineas[i].b, lineas[i].c,
                lineas[j].a, lineas[j].b, lineas[j].c,
            );
            if (p && p[0] >= -1e-9 && p[1] >= -1e-9 && p[0] <= max_x + 1e-9 && p[1] <= max_y + 1e-9)
                resultado.push([Math.max(0, p[0]), Math.max(0, p[1])]);
        }

    return resultado.filter((p, i) =>
        !resultado.slice(0, i).some(q => Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6)
    );
};

/* ── Etiquetas de coordenadas en cada intersección ──────────────────────── */

interface EtiquetasProps extends RechartsScaleContext {
    intersecciones: [number, number][];
    max_x: number;
    max_y: number;
}

const EtiquetasIntersecciones = ({ intersecciones, xAxisMap, yAxisMap, max_x, max_y }: EtiquetasProps) => {
    const ex = xAxisMap?.['0']?.scale;
    const ey = yAxisMap?.['0']?.scale;
    if (!ex || !ey) return null;

    return (
        <g>
            {intersecciones.map(([x, y], i) => {
                const px = ex(x);
                const py = ey(y);

                // Offset para evitar que el texto salga por los bordes
                const cerca_derecha = x > max_x * 0.78;
                const cerca_abajo   = y < max_y * 0.08;
                const ox     = cerca_derecha ? -6 : 6;
                const oy     = cerca_abajo   ? -14 : 12;
                const anchor = cerca_derecha ? 'end' : 'start';

                return (
                    <g key={i}>
                        <circle cx={px} cy={py} r={3} fill="rgba(255,255,255,0.6)" />
                        <text
                            x={px + ox}
                            y={py + oy}
                            textAnchor={anchor}
                            fill="rgba(210,220,216,0.95)"
                            fontSize={9}
                            fontFamily="Inter, sans-serif"
                            paintOrder="stroke"
                            stroke="rgba(15,25,20,0.9)"
                            strokeWidth={2.5}
                            strokeLinejoin="round"
                        >
                            ({FormatearCoordenada(x)}, {FormatearCoordenada(y)})
                        </text>
                    </g>
                );
            })}
        </g>
    );
};

/* ── Polígono de región factible ────────────────────────────────────────── */

interface PoligonoProps extends RechartsScaleContext {
    vertices: [number, number][];
}

const PoligonoRegionFactible = ({ vertices, xAxisMap, yAxisMap }: PoligonoProps) => {
    if (vertices.length < 3) return null;
    const ex = xAxisMap?.['0']?.scale;
    const ey = yAxisMap?.['0']?.scale;
    if (!ex || !ey) return null;
    const points = vertices.map(([x, y]) => `${ex(x)},${ey(y)}`).join(' ');
    return (
        <polygon
            points={points}
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
        />
    );
};

/* ── Marcador del punto BFS ─────────────────────────────────────────────── */

const MarcadorBFS = ({ cx = 0, cy = 0, label }: { cx?: number; cy?: number; label: string }) => (
    <g>
        <circle cx={cx} cy={cy} r={5} fill="#ffffff" stroke="#000000" strokeWidth={1} />
        <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={11}
            fontFamily="Inter, sans-serif"
            paintOrder="stroke"
            stroke="rgba(15,25,20,0.8)"
            strokeWidth={2}
            strokeLinejoin="round"
        >
            {label}
        </text>
    </g>
);

/* ── Componente principal ───────────────────────────────────────────────── */

const FeasibilityGraph = ({ restricciones, bfs_actual, indice_iteracion }: FeasibilityGraphProps) => {
    const vertices = ConstruirVerticesFactibles(restricciones);

    // Cortes de cada restricción con los ejes positivos
    const cortes_eje_x: number[] = [];
    const cortes_eje_y: number[] = [];
    restricciones.forEach(r => {
        const a1 = ObtenerCoeficiente(r, 'x1');
        const a2 = ObtenerCoeficiente(r, 'x2');
        const b  = r.valor_lado_derecho;
        if (Math.abs(a1) > 1e-10 && b / a1 >= 0) cortes_eje_x.push(b / a1);
        if (Math.abs(a2) > 1e-10 && b / a2 >= 0) cortes_eje_y.push(b / a2);
    });

    // Dominio: incluye vértices, punto BFS y todos los cortes con los ejes
    const todos_x = vertices.map(v => v[0]).concat(bfs_actual.x1, ...cortes_eje_x);
    const todos_y = vertices.map(v => v[1]).concat(bfs_actual.x2, ...cortes_eje_y);
    const max_x = Math.max(...todos_x, 1) * 1.25;
    const max_y = Math.max(...todos_y, 1) * 1.25;

    const intersecciones = ObtenerTodasIntersecciones(restricciones, max_x, max_y);

    const lineas_restriccion = restricciones.map((r, i) => {
        const a1 = ObtenerCoeficiente(r, 'x1');
        const a2 = ObtenerCoeficiente(r, 'x2');
        const b  = r.valor_lado_derecho;
        const color = `hsl(${(i * 67 + 200) % 360}, 60%, 55%)`;

        if (Math.abs(a2) > 1e-10) {
            const y_int = b / a2;
            const x_int = Math.abs(a1) > 1e-10 ? b / a1 : null;
            const puntos = (x_int !== null && x_int >= 0 && y_int >= 0)
                ? [{ x: 0, y: y_int }, { x: x_int, y: 0 }]
                : [{ x: 0, y: Math.max(0, y_int) }, { x: max_x, y: (b - a1 * max_x) / a2 }];
            return { nombre: `R${i + 1}`, color, puntos };
        }

        if (Math.abs(a1) > 1e-10) {
            const xk = b / a1;
            return { nombre: `R${i + 1}`, color, puntos: [{ x: xk, y: 0 }, { x: xk, y: max_y }] };
        }

        return null;
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    const datos_bfs = [{ x: bfs_actual.x1, y: bfs_actual.x2 }];
    const label_bfs = `Iter ${indice_iteracion}`;

    return (
        /*
         * aspect={1} hace que el gráfico sea siempre cuadrado y responsive:
         * desktop (~420 px de ancho) → 420×420 px
         * mobile  (~340 px de ancho) → 340×340 px
         * Sin height fijo, no se desborda en pantallas pequeñas.
         */
        <ResponsiveContainer width="100%" aspect={1}>
            <ComposedChart
                data={[]}
                margin={{ top: 10, right: 10, bottom: 30, left: 30 }}
                style={{ background: 'rgba(10,10,10,0.6)', borderRadius: 8 }}
            >
                <CartesianGrid stroke="#1a1a1a" />

                <XAxis
                    dataKey="x"
                    type="number"
                    domain={[0, max_x]}
                    tick={{ fill: '#555', fontSize: 10 }}
                    axisLine={{ stroke: '#333' }}
                    tickLine={{ stroke: '#555' }}
                    label={{ value: 'x₁', position: 'insideBottom', offset: -14, fill: '#888', fontSize: 11 }}
                />
                <YAxis
                    dataKey="y"
                    type="number"
                    domain={[0, max_y]}
                    tick={{ fill: '#555', fontSize: 10 }}
                    axisLine={{ stroke: '#333' }}
                    tickLine={{ stroke: '#555' }}
                    label={{ value: 'x₂', angle: -90, position: 'insideLeft', offset: 14, fill: '#888', fontSize: 11 }}
                />

                {/* Región factible */}
                <Customized
                    component={(props: RechartsScaleContext) => (
                        <PoligonoRegionFactible vertices={vertices} {...props} />
                    )}
                />

                {/* Etiquetas de coordenadas en cada intersección */}
                <Customized
                    component={(props: RechartsScaleContext) => (
                        <EtiquetasIntersecciones
                            intersecciones={intersecciones}
                            max_x={max_x}
                            max_y={max_y}
                            {...props}
                        />
                    )}
                />

                {/* Líneas de restricciones */}
                {lineas_restriccion.map(r => (
                    <Line
                        key={r.nombre}
                        data={r.puntos}
                        dataKey="y"
                        name={r.nombre}
                        stroke={r.color}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                    />
                ))}

                {/* Punto BFS actual */}
                <Scatter
                    data={datos_bfs}
                    dataKey="y"
                    name="SBF actual"
                    isAnimationActive={false}
                    shape={(p: { cx?: number; cy?: number }) => (
                        <MarcadorBFS cx={p.cx} cy={p.cy} label={label_bfs} />
                    )}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default FeasibilityGraph;
