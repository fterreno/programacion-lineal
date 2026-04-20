import Plot from 'react-plotly.js';
import type { Restriccion } from '../../../models/domain/restriccion';

interface FeasibilityGraphProps {
    restricciones: Restriccion[];
    currentBFS: { x1: number; x2: number };
    iteracionIndex: number;
}

const getCoef = (r: Restriccion, varName: string): number =>
    r.funcionRestricciones.find(t => t.variable === varName)?.coeficiente ?? 0;

/** Solve 2x2 system: a1*x + b1*y = c1, a2*x + b2*y = c2 */
const solveLinearSystem = (
    a1: number, b1: number, c1: number,
    a2: number, b2: number, c2: number
): [number, number] | null => {
    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-10) return null;
    return [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det];
};

/** Check if a point satisfies all constraints (including x1>=0, x2>=0) */
const isFeasible = (x: number, y: number, restricciones: Restriccion[]): boolean => {
    if (x < -1e-9 || y < -1e-9) return false;
    return restricciones.every(r => {
        const a1 = getCoef(r, 'x1');
        const a2 = getCoef(r, 'x2');
        const lhs = a1 * x + a2 * y;
        const rhs = r.vld;
        switch (r.operador) {
            case 'menorIgual': return lhs <= rhs + 1e-9;
            case 'mayorIgual': return lhs >= rhs - 1e-9;
            case 'igual':      return Math.abs(lhs - rhs) < 1e-9;
            default:           return true;
        }
    });
};

/** Sort points by polar angle around their centroid to build convex hull order */
const sortByAngle = (pts: [number, number][]): [number, number][] => {
    if (pts.length === 0) return [];
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return [...pts].sort((a, b) =>
        Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)
    );
};

const buildFeasibleVertices = (restricciones: Restriccion[]): [number, number][] => {
    const candidates: [number, number][] = [];

    // Build list of "lines": each constraint + the two axes
    type Line = { a: number; b: number; c: number }; // ax + by = c
    const lines: Line[] = restricciones.map(r => ({
        a: getCoef(r, 'x1'),
        b: getCoef(r, 'x2'),
        c: r.vld,
    }));
    // x1 = 0 → 1*x1 + 0*x2 = 0
    lines.push({ a: 1, b: 0, c: 0 });
    // x2 = 0 → 0*x1 + 1*x2 = 0
    lines.push({ a: 0, b: 1, c: 0 });

    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const pt = solveLinearSystem(
                lines[i].a, lines[i].b, lines[i].c,
                lines[j].a, lines[j].b, lines[j].c
            );
            if (pt && isFeasible(pt[0], pt[1], restricciones)) {
                candidates.push(pt);
            }
        }
    }

    return sortByAngle(candidates);
};

const FeasibilityGraph = ({ restricciones, currentBFS, iteracionIndex }: FeasibilityGraphProps) => {
    const vertices = buildFeasibleVertices(restricciones);

    // Determine axis range
    const allX = vertices.map(v => v[0]).concat(currentBFS.x1);
    const allY = vertices.map(v => v[1]).concat(currentBFS.x2);
    const maxX = Math.max(...allX, 1) * 1.25;
    const maxY = Math.max(...allY, 1) * 1.25;

    // Constraint line traces
    const constraintTraces = restricciones.map((r, idx) => {
        const a1 = getCoef(r, 'x1');
        const a2 = getCoef(r, 'x2');
        const b = r.vld;
        let xVals: number[], yVals: number[];

        if (Math.abs(a2) > 1e-10) {
            xVals = [0, maxX];
            yVals = xVals.map(x => (b - a1 * x) / a2);
        } else if (Math.abs(a1) > 1e-10) {
            // Vertical line: x = b/a1
            const xConst = b / a1;
            xVals = [xConst, xConst];
            yVals = [0, maxY];
        } else {
            return null;
        }

        return {
            x: xVals,
            y: yVals,
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: `R${idx + 1}`,
            line: { color: `hsl(${(idx * 67 + 200) % 360}, 60%, 55%)`, width: 1.5, dash: 'dot' as const },
        };
    }).filter(Boolean);

    // Feasible region polygon
    const regionTrace = vertices.length > 0 ? {
        x: [...vertices.map(v => v[0]), vertices[0][0]],
        y: [...vertices.map(v => v[1]), vertices[0][1]],
        type: 'scatter' as const,
        mode: 'lines' as const,
        fill: 'toself' as const,
        fillcolor: 'rgba(255, 255, 255, 0.05)',
        line: { color: 'rgba(255,255,255,0.2)', width: 1 },
        name: 'Región factible',
        showlegend: false,
    } : null;

    // BFS marker
    const bfsTrace = {
        x: [currentBFS.x1],
        y: [currentBFS.x2],
        type: 'scatter' as const,
        mode: 'markers+text' as const,
        marker: { color: '#ffffff', size: 10, symbol: 'circle' as const, line: { color: '#000', width: 1 } },
        text: [`Iter ${iteracionIndex}`],
        textposition: 'top center' as const,
        textfont: { color: '#fff', size: 11 },
        name: 'SBF actual',
    };

    const traces = [
        ...(regionTrace ? [regionTrace] : []),
        ...constraintTraces,
        bfsTrace,
    ];

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(10,10,10,0.6)',
        font: { color: '#888', family: 'Inter, sans-serif', size: 11 },
        xaxis: {
            title: 'x₁',
            gridcolor: '#1a1a1a',
            zerolinecolor: '#333',
            range: [0, maxX],
            tickfont: { color: '#555' },
        },
        yaxis: {
            title: 'x₂',
            gridcolor: '#1a1a1a',
            zerolinecolor: '#333',
            range: [0, maxY],
            tickfont: { color: '#555' },
        },
        legend: {
            font: { color: '#555', size: 10 },
            bgcolor: 'rgba(0,0,0,0)',
        },
        margin: { t: 10, r: 10, b: 45, l: 45 },
    };

    return (
        <Plot
            data={traces}
            layout={layout}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '420px' }}
            useResizeHandler
        />
    );
};

export default FeasibilityGraph;
